// app/api/integrator/sync/route.ts (corrigido)
import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'
import { fetchNewContagens, fetchNewContagensTransito, markRecordsAsProcessed } from '@/lib/supabase-external'
import { ativos } from '@/data/ativos'
import { ProcessedResult } from '@/types/integrator'

export async function POST(request?: NextRequest) {
  const startTime = Date.now()
  
  try {
    const result = await startOptimizedSyncProcess()
    const duration = Date.now() - startTime
    
    return NextResponse.json({
      success: true,
      processed: result.processed,
      errors: result.errors,
      duplicates: result.duplicates,
      duration
    })

  } catch (error) {
    const duration = Date.now() - startTime
    console.error('Erro na sincronização:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno na sincronização',
      duration
    }, { status: 500 })
  }
}

export async function startOptimizedSyncProcess(): Promise<ProcessedResult> {
  const result: ProcessedResult = {
    success: true,
    processed: 0,
    errors: [],
    duplicates: 0
  }

  try {
    // Verificar inventário ativo
    const { data: inventario } = await supabaseServer
      .from('invtrack_inventarios')
      .select('codigo')
      .eq('status', 'ativo')
      .single()

    if (!inventario) {
      result.errors.push('Nenhum inventário ativo encontrado')
      return result
    }

    // Buscar configuração atual
    const { data: config } = await supabaseServer
      .from('invtrack_integrator_config')
      .select('*')
      .eq('id', 1)
      .single()

    if (!config) {
      result.errors.push('Configuração do integrador não encontrada')
      return result
    }

    // Processar contagens de lojas
    const lojasResult = await processContagensOptimized(
      inventario.codigo, 
      config.last_contagem_id || 0
    )
    result.processed += lojasResult.processed
    result.errors.push(...lojasResult.errors)
    result.duplicates += lojasResult.duplicates

    // Processar contagens de trânsito
    const transitoResult = await processContagensTransitoOptimized(
      inventario.codigo, 
      config.last_transito_id || 0
    )
    result.processed += transitoResult.processed
    result.errors.push(...transitoResult.errors)
    result.duplicates += transitoResult.duplicates

    // Atualizar configuração com novos IDs processados
    await supabaseServer
      .from('invtrack_integrator_config')
      .upsert({
        id: 1,
        last_sync: new Date().toISOString(),
        total_processed: (config.total_processed || 0) + result.processed,
        last_contagem_id: lojasResult.lastProcessedId || config.last_contagem_id,
        last_transito_id: transitoResult.lastProcessedId || config.last_transito_id,
        updated_at: new Date().toISOString()
      })

    // Registrar estatísticas de sincronização
    await supabaseServer
      .from('invtrack_sync_stats')
      .insert({
        records_found: result.processed + result.duplicates,
        records_processed: result.processed,
        records_failed: result.errors.length,
        table_name: 'both',
        sync_duration_ms: Date.now() - Date.now(), // Será atualizado no worker
        last_processed_id: Math.max(lojasResult.lastProcessedId || 0, transitoResult.lastProcessedId || 0),
        details: {
          lojas: { processed: lojasResult.processed, errors: lojasResult.errors.length },
          transito: { processed: transitoResult.processed, errors: transitoResult.errors.length }
        }
      })

    // Log de sucesso se houver processamento
    if (result.processed > 0) {
      await logOptimizedSuccess(`Sincronização otimizada concluída: ${result.processed} itens processados`, {
        processed: result.processed,
        errors: result.errors.length,
        duplicates: result.duplicates,
        tables: ['contagens', 'contagens_transito'],
        duration: Date.now() - Date.now()
      })

      // Disparar evento de integração para notificar frontends
      await supabaseServer
        .from('invtrack_integrator_events')
        .insert({
          event_type: 'new_integration',
          processed_count: result.processed,
          details: { 
            method: 'sequence_control',
            tables_processed: ['contagens', 'contagens_transito'],
            processed_breakdown: {
              lojas: lojasResult.processed,
              transito: transitoResult.processed
            }
          }
        })
    }

    // Log de erros se houver
    if (result.errors.length > 0) {
      await logError('Erros na sincronização otimizada', result.errors)
    }

  } catch (error) {
    result.success = false
    result.errors.push(`Erro geral: ${error}`)
    await logError('Erro geral na sincronização otimizada', error)
  }

  return result
}

interface OptimizedProcessResult extends ProcessedResult {
  lastProcessedId?: number
}

async function processContagensOptimized(
  codigoInventario: string, 
  lastProcessedId: number
): Promise<OptimizedProcessResult> {
  const result: OptimizedProcessResult = { 
    success: true, 
    processed: 0, 
    errors: [], 
    duplicates: 0,
    lastProcessedId
  }

  try {
    // Buscar novas contagens usando RPC otimizada
    const { data: contagens, error } = await fetchNewContagens(lastProcessedId)

    if (error) {
      result.errors.push(`Erro ao buscar contagens via RPC: ${(error as Error).message}`)
      return result
    }

    if (!contagens || contagens.length === 0) {
      return result
    }

    const processedIds: number[] = []

    // Processar cada contagem
    for (const contagem of contagens) {
      try {
        // Validar ativo
        const ativoValido = ativos.find(a => a.nome === contagem.ativo_nome)
        if (!ativoValido) {
          result.errors.push(`Ativo não encontrado: ${contagem.ativo_nome}`)
          processedIds.push(contagem.id) // Marcar como processado mesmo com erro
          continue
        }

        // Preparar dados para inserção
        const dadosContagem = {
          tipo: 'loja',
          ativo: ativoValido.nome,
          quantidade: contagem.quantidade,
          codigo_inventario: codigoInventario,
          responsavel: contagem.email,
          loja: contagem.loja_nome,
          data_contagem: new Date().toISOString(),
          external_id: contagem.id.toString() // Rastrear ID externo
        }

        // Tentar inserir
        const { error: insertError } = await supabaseServer
          .from('invtrack_contagens')
          .insert(dadosContagem)

        if (insertError) {
          if (insertError.code === '23505') { // Constraint de unicidade
            result.duplicates++
          } else {
            result.errors.push(`Erro ao inserir contagem ${contagem.ativo_nome}: ${insertError.message}`)
          }
        } else {
          result.processed++
        }

        processedIds.push(contagem.id)
        result.lastProcessedId = Math.max(result.lastProcessedId || 0, contagem.id)

      } catch (error) {
        result.errors.push(`Erro ao processar contagem ${contagem.ativo_nome}: ${error}`)
        processedIds.push(contagem.id) // Marcar como processado mesmo com erro
      }
    }

    // Marcar registros como processados na tabela externa
    if (processedIds.length > 0) {
      const { success: markSuccess } = await markRecordsAsProcessed('contagens', processedIds)
      if (!markSuccess) {
        result.errors.push('Falha ao marcar registros como processados na tabela externa')
      }
    }

  } catch (error) {
    result.errors.push(`Erro geral no processamento de contagens: ${error}`)
  }

  return result
}

async function processContagensTransitoOptimized(
  codigoInventario: string, 
  lastProcessedId: number
): Promise<OptimizedProcessResult> {
  const result: OptimizedProcessResult = { 
    success: true, 
    processed: 0, 
    errors: [], 
    duplicates: 0,
    lastProcessedId
  }

  try {
    // Buscar novas contagens de trânsito usando RPC otimizada
    const { data: contagens, error } = await fetchNewContagensTransito(lastProcessedId)

    if (error) {
      result.errors.push(`Erro ao buscar contagens de trânsito via RPC: ${(error as Error).message}`)
      return result
    }

    if (!contagens || contagens.length === 0) {
      return result
    }

    const processedIds: number[] = []

    // Processar cada contagem de trânsito
    for (const contagem of contagens) {
      try {
        // Validar ativo
        const ativoValido = ativos.find(a => a.nome === contagem.ativo_nome)
        if (!ativoValido) {
          result.errors.push(`Ativo não encontrado: ${contagem.ativo_nome}`)
          processedIds.push(contagem.id)
          continue
        }

        // Mapear CD origem
        let cdOrigem: string
        if (contagem.loja_nome === 'CD SP') {
          cdOrigem = 'CD SÃO PAULO'
        } else if (contagem.loja_nome === 'CD ES') {
          cdOrigem = 'CD ESPIRITO SANTO'
        } else {
          result.errors.push(`CD origem não reconhecido: ${contagem.loja_nome}`)
          processedIds.push(contagem.id)
          continue
        }

        // Preparar dados para inserção
        const dadosContagem = {
          tipo: 'transito',
          ativo: ativoValido.nome,
          quantidade: contagem.quantidade,
          codigo_inventario: codigoInventario,
          responsavel: contagem.email,
          cd_origem: cdOrigem,
          cd_destino: 'CD RIO',
          data_contagem: new Date().toISOString(),
          external_id: contagem.id.toString()
        }

        // Tentar inserir
        const { error: insertError } = await supabaseServer
          .from('invtrack_contagens')
          .insert(dadosContagem)

        if (insertError) {
          if (insertError.code === '23505') { // Constraint de unicidade
            result.duplicates++
          } else {
            result.errors.push(`Erro ao inserir contagem de trânsito ${contagem.ativo_nome}: ${insertError.message}`)
          }
        } else {
          result.processed++
        }

        processedIds.push(contagem.id)
        result.lastProcessedId = Math.max(result.lastProcessedId || 0, contagem.id)

      } catch (error) {
        result.errors.push(`Erro ao processar contagem de trânsito ${contagem.ativo_nome}: ${error}`)
        processedIds.push(contagem.id)
      }
    }

    // Marcar registros como processados na tabela externa
    if (processedIds.length > 0) {
      const { success: markSuccess } = await markRecordsAsProcessed('contagens_transito', processedIds)
      if (!markSuccess) {
        result.errors.push('Falha ao marcar registros de trânsito como processados na tabela externa')
      }
    }

  } catch (error) {
    result.errors.push(`Erro geral no processamento de contagens de trânsito: ${error}`)
  }

  return result
}

async function logOptimizedSuccess(message: string, details?: any) {
  await supabaseServer
    .from('invtrack_integrator_logs')
    .insert({
      type: 'success',
      message,
      details,
      processed_count: details?.processed
    })
}

async function logError(message: string, error: any) {
  await supabaseServer
    .from('invtrack_integrator_logs')
    .insert({
      type: 'error',
      message,
      details: { error: error?.message || error }
    })
}
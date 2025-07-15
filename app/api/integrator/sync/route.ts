// app/api/integrator/sync/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'
import { fetchExternalContagens, fetchExternalContagensTransito } from '@/lib/supabase-external'
import { ativos } from '@/data/ativos'
import { ProcessedResult } from '@/types/integrator'

export async function POST(request?: NextRequest) {
  try {
    const result = await startSyncProcess()
    
    return NextResponse.json({
      success: true,
      processed: result.processed,
      errors: result.errors,
      duplicates: result.duplicates
    })

  } catch (error) {
    console.error('Erro na sincronização:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno na sincronização'
    }, { status: 500 })
  }
}

export async function startSyncProcess(): Promise<ProcessedResult> {
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

    // Buscar última sincronização
    const { data: lastSync } = await supabaseServer
      .from('invtrack_integrator_config')
      .select('last_sync, total_processed')
      .single()

    const lastSyncDate = lastSync?.last_sync ? new Date(lastSync.last_sync) : undefined

    // Processar contagens de lojas
    const lojasResult = await processContagens(inventario.codigo, lastSyncDate)
    result.processed += lojasResult.processed
    result.errors.push(...lojasResult.errors)
    result.duplicates += lojasResult.duplicates

    // Processar contagens de trânsito
    const transitoResult = await processContagensTransito(inventario.codigo, lastSyncDate)
    result.processed += transitoResult.processed
    result.errors.push(...transitoResult.errors)
    result.duplicates += transitoResult.duplicates

    // Atualizar última sincronização
    await supabaseServer
      .from('invtrack_integrator_config')
      .upsert({
        id: 1,
        last_sync: new Date().toISOString(),
        total_processed: (lastSync?.total_processed || 0) + result.processed
      })

    // Log de sucesso
    if (result.processed > 0) {
      await logSuccess(`Sincronização concluída: ${result.processed} itens processados`, {
        processed: result.processed,
        errors: result.errors.length,
        duplicates: result.duplicates
      })
    }

    // Log de erros se houver
    if (result.errors.length > 0) {
      await logError('Erros na sincronização', result.errors)
    }

  } catch (error) {
    result.success = false
    result.errors.push(`Erro geral: ${error}`)
    await logError('Erro geral na sincronização', error)
  }

  return result
}

async function processContagens(codigoInventario: string, lastSync?: Date): Promise<ProcessedResult> {
  const result: ProcessedResult = { success: true, processed: 0, errors: [], duplicates: 0 }

  try {
    // Buscar contagens externas
    const { data: contagens, error } = await fetchExternalContagens(lastSync)

    if (error) {
      result.errors.push(`Erro ao buscar contagens externas: ${error.message}`)
      return result
    }

    if (!contagens || contagens.length === 0) {
      return result
    }

    // Processar cada contagem
    for (const contagem of contagens) {
      try {
        // Validar ativo
        const ativoValido = ativos.find(a => a.nome === contagem.ativo_nome)
        if (!ativoValido) {
          result.errors.push(`Ativo não encontrado: ${contagem.ativo_nome}`)
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
          data_contagem: new Date().toISOString()
        }

        // Tentar inserir (pode falhar por duplicata)
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

      } catch (error) {
        result.errors.push(`Erro ao processar contagem ${contagem.ativo_nome}: ${error}`)
      }
    }

  } catch (error) {
    result.errors.push(`Erro geral no processamento de contagens: ${error}`)
  }

  return result
}

async function processContagensTransito(codigoInventario: string, lastSync?: Date): Promise<ProcessedResult> {
  const result: ProcessedResult = { success: true, processed: 0, errors: [], duplicates: 0 }

  try {
    // Buscar contagens de trânsito externas
    const { data: contagens, error } = await fetchExternalContagensTransito(lastSync)

    if (error) {
      result.errors.push(`Erro ao buscar contagens de trânsito: ${error.message}`)
      return result
    }

    if (!contagens || contagens.length === 0) {
      return result
    }

    // Processar cada contagem de trânsito
    for (const contagem of contagens) {
      try {
        // Validar ativo
        const ativoValido = ativos.find(a => a.nome === contagem.ativo_nome)
        if (!ativoValido) {
          result.errors.push(`Ativo não encontrado: ${contagem.ativo_nome}`)
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
          data_contagem: new Date().toISOString()
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

      } catch (error) {
        result.errors.push(`Erro ao processar contagem de trânsito ${contagem.ativo_nome}: ${error}`)
      }
    }

  } catch (error) {
    result.errors.push(`Erro geral no processamento de contagens de trânsito: ${error}`)
  }

  return result
}

async function logSuccess(message: string, details?: any) {
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
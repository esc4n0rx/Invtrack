// lib/integrator-monitor.ts
import { supabaseServer } from '@/lib/supabase'
import { processRecordWithDeduplication, cleanupOldProcessedRecords } from '@/lib/integrator-deduplication'
import type { IntegratorDeduplicationStats } from '@/types/contagem'

export class IntegratorMonitor {
  private isRunning = false

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Integrator monitor já está executando')
      return
    }

    this.isRunning = true
    console.log('Iniciando integrator monitor...')
    
    this.runLoop()
  }

  async stop(): Promise<void> {
    this.isRunning = false
    console.log('Parando integrator monitor...')
  }

  private async runLoop(): Promise<void> {
    while (this.isRunning) {
      try {
        const result = await this.processIntegration()
        
        if (result.totalProcessed > 0) {
          await this.logSuccess(
            `Integração concluída: ${result.totalProcessed} total (${result.newRecords} novos, ${result.duplicatesSkipped} duplicatas)`,
            result
          )
        }

        if (result.errors > 0) {
          await this.logError('Erros durante integração', { 
            errorCount: result.errors,
            stats: result 
          })
        }

      } catch (error) {
        await this.logError('Erro crítico no integrator', { 
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        })
      }

      // Aguardar intervalo configurado
      const { data: config } = await supabaseServer
        .from('invtrack_integrator_config')
        .select('interval_seconds, is_active')
        .eq('id', 1)
        .single()

      if (!config?.is_active) {
        this.isRunning = false
        break
      }

      await this.sleep((config?.interval_seconds || 30) * 1000)
    }
  }

  private async processIntegration(): Promise<IntegratorDeduplicationStats> {
    const startTime = Date.now()
    let totalProcessed = 0
    let newRecords = 0
    let duplicatesSkipped = 0
    let errors = 0

    try {
      // Buscar inventário ativo
      const { data: inventarioAtivo } = await supabaseServer
        .from('invtrack_inventarios')
        .select('codigo')
        .eq('status', 'ativo')
        .single()

      if (!inventarioAtivo) {
        return { totalProcessed, newRecords, duplicatesSkipped, errors, processingTime: Date.now() - startTime }
      }

      // Processar contagens de loja
      const resultLoja = await this.processContagensLoja(inventarioAtivo.codigo)
      totalProcessed += resultLoja.totalProcessed
      newRecords += resultLoja.newRecords
      duplicatesSkipped += resultLoja.duplicatesSkipped
      errors += resultLoja.errors

      // Processar contagens de trânsito
      const resultTransito = await this.processContagensTransito(inventarioAtivo.codigo)
      totalProcessed += resultTransito.totalProcessed
      newRecords += resultTransito.newRecords
      duplicatesSkipped += resultTransito.duplicatesSkipped
      errors += resultTransito.errors

      const processingTime = Date.now() - startTime

      // Atualizar configuração
      if (totalProcessed > 0) {
        const { data: currentConfig } = await supabaseServer
          .from('invtrack_integrator_config')
          .select('total_processed, error_count')
          .eq('id', 1)
          .single()

        await supabaseServer
          .from('invtrack_integrator_config')
          .update({
            last_sync: new Date().toISOString(),
            total_processed: (currentConfig?.total_processed || 0) + newRecords, // Apenas novos registros
            error_count: errors > 0 ? (currentConfig?.error_count || 0) + errors : currentConfig?.error_count
          })
          .eq('id', 1)
      }

      // Limpeza de registros antigos (executar uma vez por hora)
      if (Math.random() < 0.02) { // ~2% de chance por execução
        await cleanupOldProcessedRecords()
      }

      return {
        totalProcessed,
        newRecords,
        duplicatesSkipped,
        errors,
        processingTime
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      await this.logError('Erro no processamento da integração', { error: errorMessage })
      
      return {
        totalProcessed,
        newRecords,
        duplicatesSkipped,
        errors: errors + 1,
        processingTime: Date.now() - startTime
      }
    }
  }

  private async processContagensLoja(codigoInventario: string): Promise<IntegratorDeduplicationStats> {
    let totalProcessed = 0
    let newRecords = 0
    let duplicatesSkipped = 0
    let errors = 0

    try {
      // Buscar contagens não processadas
      const { data: contagens, error } = await supabaseServer
        .from('contagens')
        .select('*')
        .eq('processado', false)
        .order('created_at', { ascending: true })

      if (error) throw error

      if (!contagens || contagens.length === 0) {
        return { totalProcessed, newRecords, duplicatesSkipped, errors, processingTime: 0 }
      }

      // Processar cada contagem
      for (const contagem of contagens) {
        try {
          totalProcessed++

          const recordData = {
            tipo: 'loja',
            ativo: contagem.ativo_nome,
            quantidade: contagem.quantidade,
            loja: contagem.loja_nome,
            responsavel: contagem.email,
            codigo_inventario: codigoInventario,
            obs: 'Capturado pelo integrator'
          }

          const result = await processRecordWithDeduplication(recordData, 'contagens', contagem.id)

          if (result.success) {
            newRecords++
            await this.markAsProcessed('contagens', contagem.id)
          } else if (result.isDuplicate) {
            duplicatesSkipped++
            await this.markAsProcessed('contagens', contagem.id) // Marcar como processado mesmo sendo duplicata
          } else {
            errors++
            console.error(`Erro ao processar contagem ${contagem.id}:`, result.error)
          }

        } catch (error) {
          errors++
          console.error(`Erro ao processar contagem ${contagem.id}:`, error)
        }
      }

    } catch (error) {
      errors++
      console.error('Erro ao buscar contagens loja:', error)
    }

    return { totalProcessed, newRecords, duplicatesSkipped, errors, processingTime: 0 }
  }

  private async processContagensTransito(codigoInventario: string): Promise<IntegratorDeduplicationStats> {
    let totalProcessed = 0
    let newRecords = 0
    let duplicatesSkipped = 0
    let errors = 0

    try {
      // Buscar contagens não processadas
      const { data: contagens, error } = await supabaseServer
        .from('contagens_transito')
        .select('*')
        .eq('processado', false)
        .order('created_at', { ascending: true })

      if (error) throw error

      if (!contagens || contagens.length === 0) {
        return { totalProcessed, newRecords, duplicatesSkipped, errors, processingTime: 0 }
      }

      // Processar cada contagem
      for (const contagem of contagens) {
        try {
          totalProcessed++

          const recordData = {
            tipo: 'transito',
            ativo: contagem.ativo_nome,
            quantidade: contagem.quantidade,
            cd_origem: this.mapCDOrigem(contagem.loja_nome),
            cd_destino: 'CD RIO',
            responsavel: contagem.email,
            codigo_inventario: codigoInventario,
            obs: 'Capturado pelo integrator'
          }

          const result = await processRecordWithDeduplication(recordData, 'contagens_transito', contagem.id)

          if (result.success) {
            newRecords++
            await this.markAsProcessed('contagens_transito', contagem.id)
          } else if (result.isDuplicate) {
            duplicatesSkipped++
            await this.markAsProcessed('contagens_transito', contagem.id) // Marcar como processado mesmo sendo duplicata
          } else {
            errors++
            console.error(`Erro ao processar contagem trânsito ${contagem.id}:`, result.error)
          }

        } catch (error) {
          errors++
          console.error(`Erro ao processar contagem trânsito ${contagem.id}:`, error)
        }
      }

    } catch (error) {
      errors++
      console.error('Erro ao buscar contagens trânsito:', error)
    }

    return { totalProcessed, newRecords, duplicatesSkipped, errors, processingTime: 0 }
  }

  private mapCDOrigem(lojaNome: string): string {
    const mapeamento: { [key: string]: string } = {
      'CD SP': 'CD SÃO PAULO',
      'CD ES': 'CD ESPIRITO SANTO'
    }
    return mapeamento[lojaNome] || lojaNome
  }

  private async markAsProcessed(tabela: string, id: number) {
    await supabaseServer
      .from(tabela)
      .update({
        processado: true,
        processed_at: new Date().toISOString()
      })
      .eq('id', id)
  }

  private async logSuccess(message: string, details?: any) {
    await supabaseServer
      .from('invtrack_integrator_logs')
      .insert({
        type: 'success',
        message,
        details,
        processed_count: details?.newRecords || 0
      })
  }

  private async logError(message: string, details?: any) {
    await supabaseServer
      .from('invtrack_integrator_logs')
      .insert({
        type: 'error',
        message,
        details
      })
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

export const integratorMonitor = new IntegratorMonitor()
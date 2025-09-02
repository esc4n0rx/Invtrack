// lib/integrator-monitor.ts
import { supabaseServer } from '@/lib/supabase'
import { ContagemOriginal, ContagemTransitoOriginal, ProcessingResult } from '@/types/integrator-monitor'
import { processRecordWithDeduplication, cleanupOldProcessedRecords } from '@/lib/integrator-deduplication'
import type { IntegratorDeduplicationStats } from '@/types/contagem'

export class IntegratorMonitor {
  private static instance: IntegratorMonitor
  private intervalId: NodeJS.Timeout | null = null
  private running: boolean = false
  private currentIntervalSeconds: number = 30

  static getInstance(): IntegratorMonitor {
    if (!IntegratorMonitor.instance) {
      IntegratorMonitor.instance = new IntegratorMonitor()
    }
    return IntegratorMonitor.instance
  }

  async startMonitoring(intervalSeconds: number = 30) {
    if (this.running) {
      await this.stopMonitoring()
    }

    this.running = true
    this.currentIntervalSeconds = intervalSeconds
    
    console.log(`Monitor iniciado com intervalo de ${intervalSeconds}s`)
    
    // Primeiro check imediato
    await this.checkTables()
    
    // Configurar interval
    this.intervalId = setInterval(async () => {
      if (this.running) {
        await this.checkTables()
      }
    }, intervalSeconds * 1000)

    await this.logInfo('Monitor iniciado automaticamente', { intervalSeconds })
  }

  async stopMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.running = false
    console.log('Monitor parado')
    await this.logInfo('Monitor parado')
  }

  isRunning(): boolean {
    return this.running
  }

  getCurrentInterval(): number {
    return this.currentIntervalSeconds
  }

  async checkTables(): Promise<ProcessingResult> {
    const startTime = Date.now()
    let totalProcessed = 0
    let lojaProcessed = 0
    let transitoProcessed = 0
    const errors: string[] = []

    try {
      // Verificar se ainda deve estar ativo
      const { data: config, error: configError } = await supabaseServer
        .from('invtrack_integrator_config')
        .select('is_active')
        .eq('id', 1)
        .single()

      if (configError) {
        console.error('Erro ao verificar configuração:', configError)
        errors.push('Erro ao verificar configuração: ' + configError.message)
        return { totalProcessed, lojaProcessed, transitoProcessed, errors, duration: Date.now() - startTime }
      }

      if (!config?.is_active) {
        console.log('Monitor foi desativado, parando...')
        await this.stopMonitoring()
        return { totalProcessed, lojaProcessed, transitoProcessed, errors, duration: Date.now() - startTime }
      }

      // Buscar inventário ativo
      const { data: inventarioAtivo, error: inventarioError } = await supabaseServer
        .from('invtrack_inventarios')
        .select('codigo')
        .eq('status', 'ativo')
        .single()

      if (inventarioError) {
        console.error('Erro ao buscar inventário:', inventarioError)
        errors.push('Erro ao buscar inventário: ' + inventarioError.message)
        return { totalProcessed, lojaProcessed, transitoProcessed, errors, duration: Date.now() - startTime }
      }

      if (!inventarioAtivo) {
        // Sem inventário ativo, não processar mas não é erro
        return { totalProcessed, lojaProcessed, transitoProcessed, errors, duration: Date.now() - startTime }
      }

      // Processar contagens de loja
      const resultLoja = await this.processContagensLoja(inventarioAtivo.codigo)
      lojaProcessed = resultLoja.processed
      totalProcessed += resultLoja.processed
      errors.push(...resultLoja.errors)

      // Processar contagens de trânsito
      const resultTransito = await this.processContagensTransito(inventarioAtivo.codigo)
      transitoProcessed = resultTransito.processed
      totalProcessed += resultTransito.processed
      errors.push(...resultTransito.errors)

      const duration = Date.now() - startTime

      // Atualizar configuração apenas se processou algo ou teve erro
      if (totalProcessed > 0 || errors.length > 0) {
        const { data: currentConfig } = await supabaseServer
          .from('invtrack_integrator_config')
          .select('total_processed, error_count')
          .eq('id', 1)
          .single()

        await supabaseServer
          .from('invtrack_integrator_config')
          .update({
            last_sync: new Date().toISOString(),
            total_processed: (currentConfig?.total_processed || 0) + totalProcessed,
            error_count: errors.length > 0 ? (currentConfig?.error_count || 0) + errors.length : currentConfig?.error_count
          })
          .eq('id', 1)
      }

      // Log de sucesso se processou alguma coisa
      if (totalProcessed > 0) {
        await this.logSuccess(
          `Processadas ${totalProcessed} contagens (${lojaProcessed} loja, ${transitoProcessed} trânsito)`,
          { totalProcessed, lojaProcessed, transitoProcessed, duration }
        )
      }

      // Log de erro se houver
      if (errors.length > 0) {
        await this.logError('Erros durante o processamento', { errors, duration })
      }

      // Limpeza periódica (1% de chance por execução)
      if (Math.random() < 0.01) {
        await cleanupOldProcessedRecords()
      }

      return {
        totalProcessed,
        lojaProcessed,
        transitoProcessed,
        errors,
        duration
      }

    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      errors.push(errorMessage)

      await this.logError('Erro no monitoramento', { error: errorMessage, duration })

      return {
        totalProcessed,
        lojaProcessed,
        transitoProcessed,
        errors,
        duration
      }
    }
  }

  private async processContagensLoja(codigoInventario: string) {
    let processed = 0
    const errors: string[] = []

    try {
      // Buscar contagens não processadas
      const { data: contagens, error } = await supabaseServer
        .from('contagens')
        .select('*')
        .eq('processado', false)
        .order('created_at', { ascending: true })

      if (error) throw error

      if (!contagens || contagens.length === 0) {
        return { processed, errors }
      }

      // Processar cada contagem com novo sistema de deduplicação
      for (const contagem of contagens) {
        try {
          const recordData = {
            tipo: 'loja',
            ativo: contagem.ativo_nome,
            quantidade: contagem.quantidade,
            loja: contagem.loja_nome,
            responsavel: contagem.email,
            codigo_inventario: codigoInventario,
            obs: 'Capturado pelo integrator'
          }

          // Usar novo sistema de deduplicação
          const result = await processRecordWithDeduplication(recordData, 'contagens', contagem.id)

          if (result.success) {
            processed++
          } else if (result.isDuplicate) {
            // Duplicata identificada, não é erro mas marcar como processado
            console.log(`Duplicata ignorada - contagem loja ${contagem.id}: ${result.reason}`)
          } else {
            throw new Error(result.error || 'Erro desconhecido')
          }

          // Sempre marcar como processado (seja sucesso ou duplicata)
          await this.markAsProcessed('contagens', contagem.id)

        } catch (error) {
          const errorMessage = `Erro ao processar contagem ${contagem.id}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
          errors.push(errorMessage)
        }
      }

    } catch (error) {
      errors.push(`Erro ao buscar contagens: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }

    return { processed, errors }
  }

  private async processContagensTransito(codigoInventario: string) {
    let processed = 0
    const errors: string[] = []

    try {
      // Buscar contagens não processadas
      const { data: contagens, error } = await supabaseServer
        .from('contagens_transito')
        .select('*')
        .eq('processado', false)
        .order('created_at', { ascending: true })

      if (error) throw error

      if (!contagens || contagens.length === 0) {
        return { processed, errors }
      }

      // Processar cada contagem
      for (const contagem of contagens) {
        try {
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

          // Usar novo sistema de deduplicação
          const result = await processRecordWithDeduplication(recordData, 'contagens_transito', contagem.id)

          if (result.success) {
            processed++
          } else if (result.isDuplicate) {
            // Duplicata identificada, não é erro mas marcar como processado
            console.log(`Duplicata ignorada - contagem trânsito ${contagem.id}: ${result.reason}`)
          } else {
            throw new Error(result.error || 'Erro desconhecido')
          }

          // Sempre marcar como processado (seja sucesso ou duplicata)
          await this.markAsProcessed('contagens_transito', contagem.id)

        } catch (error) {
          const errorMessage = `Erro ao processar contagem trânsito ${contagem.id}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
          errors.push(errorMessage)
        }
      }

    } catch (error) {
      errors.push(`Erro ao buscar contagens trânsito: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }

    return { processed, errors }
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
        processed_count: details?.totalProcessed || 0
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

  private async logInfo(message: string, details?: any) {
    await supabaseServer
      .from('invtrack_integrator_logs')
      .insert({
        type: 'info',
        message,
        details
      })
  }
}

export const integratorMonitor = IntegratorMonitor.getInstance()
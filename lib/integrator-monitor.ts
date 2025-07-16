// lib/integrator-monitor.ts
import { supabaseServer } from '@/lib/supabase'
import { ContagemOriginal, ContagemTransitoOriginal, ProcessingResult } from '@/types/integrator-monitor'

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
      const { data: config } = await supabaseServer
        .from('invtrack_integrator_config')
        .select('is_active')
        .eq('id', 1)
        .single()

      if (!config?.is_active) {
        console.log('Monitor foi desativado, parando...')
        await this.stopMonitoring()
        return { totalProcessed, lojaProcessed, transitoProcessed, errors, duration: Date.now() - startTime }
      }

      // Buscar inventário ativo
      const { data: inventarioAtivo } = await supabaseServer
        .from('invtrack_inventarios')
        .select('codigo')
        .eq('status', 'ativo')
        .single()

      if (!inventarioAtivo) {
        // Sem inventário ativo, não processar mas não é erro
        return { totalProcessed, lojaProcessed, transitoProcessed, errors, duration: Date.now() - startTime }
      }

      // Processar tabela contagens (loja)
      const resultLoja = await this.processContagensLoja(inventarioAtivo.codigo)
      lojaProcessed = resultLoja.processed
      totalProcessed += resultLoja.processed
      errors.push(...resultLoja.errors)

      // Processar tabela contagens_transito (trânsito)
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

      // Processar cada contagem
      for (const contagem of contagens) {
        try {
          // Inserir em invtrack_contagens
          const { error: insertError } = await supabaseServer
            .from('invtrack_contagens')
            .insert({
              tipo: 'loja',
              ativo: contagem.ativo_nome,
              loja: contagem.loja_nome,
              quantidade: contagem.quantidade,
              codigo_inventario: codigoInventario,
              responsavel: contagem.email,
              obs: 'Capturado pelo integrator'
            })

          if (insertError) {
            // Se for erro de duplicata, marcar como processado mesmo assim
            if (insertError.code === '23505') {
              await this.markAsProcessed('contagens', contagem.id)
              continue
            }
            throw insertError
          }

          // Marcar como processado
          await this.markAsProcessed('contagens', contagem.id)
          processed++

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
          // Mapear CD origem
          const cdOrigem = this.mapCDOrigem(contagem.loja_nome)

          // Inserir em invtrack_contagens
          const { error: insertError } = await supabaseServer
            .from('invtrack_contagens')
            .insert({
              tipo: 'transito',
              ativo: contagem.ativo_nome,
              quantidade: contagem.quantidade,
              codigo_inventario: codigoInventario,
              responsavel: contagem.email,
              cd_origem: cdOrigem,
              cd_destino: 'CD RIO',
              obs: 'Capturado pelo integrator'
            })

          if (insertError) {
            // Se for erro de duplicata, marcar como processado mesmo assim
            if (insertError.code === '23505') {
              await this.markAsProcessed('contagens_transito', contagem.id)
              continue
            }
            throw insertError
          }

          // Marcar como processado
          await this.markAsProcessed('contagens_transito', contagem.id)
          processed++

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
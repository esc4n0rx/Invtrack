// lib/integrator-scheduler.ts
import { supabaseServer } from '@/lib/supabase'
import { integratorMonitor } from '@/lib/integrator-monitor'

export class IntegratorScheduler {
  private static instance: IntegratorScheduler
  private checkInterval: NodeJS.Timeout | null = null
  private isInitialized = false

  static getInstance(): IntegratorScheduler {
    if (!IntegratorScheduler.instance) {
      IntegratorScheduler.instance = new IntegratorScheduler()
    }
    return IntegratorScheduler.instance
  }

  async initialize() {
    if (this.isInitialized) return
    
    this.isInitialized = true
    
    try {
      // Verificar configuração inicial
      await this.checkAndStartMonitor()
      
      // Verificar a cada 10 segundos se a configuração mudou
      this.checkInterval = setInterval(async () => {
        await this.checkAndStartMonitor()
      }, 10000)
      
      console.log('IntegratorScheduler inicializado com sucesso')
    } catch (error) {
      console.error('Erro ao inicializar IntegratorScheduler:', error)
      this.isInitialized = false
      throw error
    }
  }

  private async checkAndStartMonitor() {
    try {
      // Buscar configuração atual com timeout
      const { data: config, error } = await supabaseServer
        .from('invtrack_integrator_config')
        .select('*')
        .eq('id', 1)
        .single()

      if (error) {
        console.error('Erro ao buscar configuração do integrator:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        
        // Se for erro de rede, tentar novamente em 30 segundos
        if (error.message.includes('fetch failed') || error.message.includes('network')) {
          console.log('Erro de rede detectado, tentando novamente em 30 segundos...')
          setTimeout(() => this.checkAndStartMonitor(), 30000)
        }
        return
      }

      if (!config) {
        console.log('Nenhuma configuração encontrada, criando configuração padrão...')
        
        // Criar configuração padrão
        const { error: insertError } = await supabaseServer
          .from('invtrack_integrator_config')
          .upsert({
            id: 1,
            is_active: false,
            interval_seconds: 30,
            total_processed: 0,
            error_count: 0
          })
          
        if (insertError) {
          console.error('Erro ao criar configuração padrão:', insertError)
        }
        return
      }

      // Verificar se o monitor está rodando
      const monitorRunning = integratorMonitor.isRunning()

      // Se deve estar ativo mas não está rodando, iniciar
      if (config.is_active && !monitorRunning) {
        console.log(`Iniciando monitor com intervalo de ${config.interval_seconds}s`)
        await integratorMonitor.startMonitoring(config.interval_seconds)
      }
      
      // Se não deve estar ativo mas está rodando, parar
      if (!config.is_active && monitorRunning) {
        console.log('Parando monitor')
        await integratorMonitor.stopMonitoring()
      }

      // Se está ativo mas o intervalo mudou, reiniciar
      if (config.is_active && monitorRunning) {
        const currentInterval = integratorMonitor.getCurrentInterval()
        if (currentInterval !== config.interval_seconds) {
          console.log(`Reiniciando monitor com novo intervalo: ${config.interval_seconds}s`)
          await integratorMonitor.stopMonitoring()
          await integratorMonitor.startMonitoring(config.interval_seconds)
        }
      }

    } catch (error) {
      console.error('Erro no scheduler:', error)
      
      // Log detalhado do erro
      if (error instanceof Error) {
        console.error('Stack trace:', error.stack)
      }
    }
  }

  async stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
    
    try {
      await integratorMonitor.stopMonitoring()
    } catch (error) {
      console.error('Erro ao parar monitor:', error)
    }
    
    this.isInitialized = false
    console.log('IntegratorScheduler parado')
  }
}

export const integratorScheduler = IntegratorScheduler.getInstance()
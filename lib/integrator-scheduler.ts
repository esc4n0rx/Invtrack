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
    
    // Verificar configuração inicial
    await this.checkAndStartMonitor()
    
    // Verificar a cada 10 segundos se a configuração mudou
    this.checkInterval = setInterval(async () => {
      await this.checkAndStartMonitor()
    }, 10000)
    
    console.log('IntegratorScheduler inicializado')
  }

  private async checkAndStartMonitor() {
    try {
      // Buscar configuração atual
      const { data: config, error } = await supabaseServer
        .from('invtrack_integrator_config')
        .select('*')
        .eq('id', 1)
        .single()

      if (error) {
        console.error('Erro ao buscar configuração do integrator:', error)
        return
      }

      if (!config) {
        console.log('Nenhuma configuração encontrada')
        return
      }

      // Se deve estar ativo mas não está rodando, iniciar
      if (config.is_active && !integratorMonitor.isRunning()) {
        console.log(`Iniciando monitor com intervalo de ${config.interval_seconds}s`)
        await integratorMonitor.startMonitoring(config.interval_seconds)
      }
      
      // Se não deve estar ativo mas está rodando, parar
      if (!config.is_active && integratorMonitor.isRunning()) {
        console.log('Parando monitor')
        await integratorMonitor.stopMonitoring()
      }

      // Se está ativo mas o intervalo mudou, reiniciar
      if (config.is_active && integratorMonitor.isRunning()) {
        const currentInterval = integratorMonitor.getCurrentInterval()
        if (currentInterval !== config.interval_seconds) {
          console.log(`Reiniciando monitor com novo intervalo: ${config.interval_seconds}s`)
          await integratorMonitor.stopMonitoring()
          await integratorMonitor.startMonitoring(config.interval_seconds)
        }
      }

    } catch (error) {
      console.error('Erro no scheduler:', error)
    }
  }

  async stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
    
    await integratorMonitor.stopMonitoring()
    this.isInitialized = false
    console.log('IntegratorScheduler parado')
  }
}

export const integratorScheduler = IntegratorScheduler.getInstance()
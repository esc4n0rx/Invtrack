// hooks/useIntegrator.ts
"use client"

import { useState, useEffect } from 'react'
import { IntegratorConfig, IntegratorLog, WebhookToken, WebhookStats } from '@/types/integrator'
import { ProcessingResult } from '@/types/integrator-monitor'
import { supabaseClient } from '@/lib/supabase'
import { toast } from 'sonner'

export function useIntegrator() {
  const [config, setConfig] = useState<IntegratorConfig>({
    isActive: false,
    interval: 30,
    lastSync: null,
    totalProcessed: 0,
    errorCount: 0
  })
  const [logs, setLogs] = useState<IntegratorLog[]>([])
  const [webhookTokens, setWebhookTokens] = useState<WebhookToken[]>([])
  const [webhookStats, setWebhookStats] = useState<WebhookStats>({
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageProcessingTime: 0,
    totalContagensCreated: 0
  })
  const [loading, setLoading] = useState(false)

  // Inicializar scheduler quando componente montar
  useEffect(() => {
    const initScheduler = async () => {
      try {
        await fetch('/api/integrator/init', { method: 'POST' })
      } catch (error) {
        console.error('Erro ao inicializar scheduler:', error)
      }
    }
    
    initScheduler()
  }, [])

  // Buscar dados iniciais
  useEffect(() => {
    fetchConfig()
    fetchLogs()
    fetchWebhookTokens()
    fetchWebhookStats()
  }, [])

  // Subscription para mudanças na config
  useEffect(() => {
    const subscription = supabaseClient
      .channel('integrator-config')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'invtrack_integrator_config' 
        }, 
        () => fetchConfig()
      )
      .subscribe()

    return () => { subscription.unsubscribe() }
  }, [])

  // Subscription para novos logs
  useEffect(() => {
    const subscription = supabaseClient
      .channel('integrator-logs')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'invtrack_integrator_logs' 
        }, 
        (payload) => {
          const newLog = payload.new as IntegratorLog
          setLogs(prev => [newLog, ...prev.slice(0, 99)])
          
          // Toast automático para sucessos
          if (newLog.type === 'success' && newLog.processed_count && newLog.processed_count > 0) {
            toast.success('Novas contagens capturadas!', {
              description: `${newLog.processed_count} contagens processadas pelo integrator`
            })
          }
        }
      )
      .subscribe()

    return () => { subscription.unsubscribe() }
  }, [])

  // Subscription para contagens (atualizar dashboard)
  useEffect(() => {
    const subscription = supabaseClient
      .channel('contagens-updates')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'invtrack_contagens' 
        }, 
        (payload) => {
          const newContagem = payload.new
          
          // Verificar se foi criada pelo integrator
          if (newContagem.obs === 'Capturado pelo integrator') {
            // Disparar evento customizado para atualizar dashboard
            window.dispatchEvent(new CustomEvent('contagens-updated'))
          }
        }
      )
      .subscribe()

    return () => { subscription.unsubscribe() }
  }, [])

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/integrator/monitor')
      const data = await response.json()
      
      if (data.success) {
        setConfig({
          isActive: data.config.isActive,
          interval: data.config.intervalSeconds,
          lastSync: data.config.lastCheck ? new Date(data.config.lastCheck) : null,
          totalProcessed: data.config.totalProcessed,
          errorCount: data.config.errorCount
        })
      }
    } catch (error) {
      console.error('Erro ao buscar config:', error)
    }
  }

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/integrator/logs?limit=100')
      const data = await response.json()
      
      if (data.success) {
        setLogs(data.logs)
      }
    } catch (error) {
      console.error('Erro ao buscar logs:', error)
    }
  }

  const fetchWebhookTokens = async () => {
    try {
      const response = await fetch('/api/integrator/tokens')
      const data = await response.json()
      
      if (data.success) {
        setWebhookTokens(data.tokens)
      }
    } catch (error) {
      console.error('Erro ao buscar tokens:', error)
    }
  }

  const fetchWebhookStats = async () => {
    try {
      const response = await fetch('/api/integrator/stats')
      const data = await response.json()
      
      if (data.success) {
        setWebhookStats(data.stats)
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error)
    }
  }

  const toggleIntegrator = async () => {
    setLoading(true)
    try {
      const action = config.isActive ? 'stop' : 'start'
      const response = await fetch('/api/integrator/monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, intervalSeconds: config.interval })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success(
          config.isActive ? 'Monitor desativado!' : 'Monitor ativado!',
          {
            description: config.isActive 
              ? 'Parou de monitorar novas contagens'
              : `Iniciou monitoramento automático a cada ${config.interval}s`
          }
        )
      } else {
        toast.error(data.error || 'Erro ao alterar status do monitor')
      }
    } catch (error) {
      toast.error('Erro ao alterar status do monitor')
    } finally {
      setLoading(false)
    }
  }

  const updateInterval = async (newInterval: number) => {
    setLoading(true)
    try {
      const response = await fetch('/api/integrator/monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_interval', intervalSeconds: newInterval })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success(`Intervalo alterado para ${newInterval}s`)
      } else {
        toast.error(data.error || 'Erro ao alterar intervalo')
      }
    } catch (error) {
      toast.error('Erro ao alterar intervalo')
    } finally {
      setLoading(false)
    }
  }

  const executeManualCheck = async (): Promise<ProcessingResult | null> => {
    setLoading(true)
    try {
      const response = await fetch('/api/integrator/monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check' })
      })
      
      const data = await response.json()
      
      if (data.success) {
        await fetchConfig()
        await fetchLogs()
        
        const result = data.result as ProcessingResult
        if (result.totalProcessed > 0) {
          toast.success(`Verificação concluída: ${result.totalProcessed} contagens processadas`)
        } else {
          toast.info('Verificação concluída: nenhuma contagem nova encontrada')
        }
        
        return result
      } else {
        toast.error(data.error || 'Erro na verificação manual')
        return null
      }
    } catch (error) {
      toast.error('Erro na verificação manual')
      return null
    } finally {
      setLoading(false)
    }
  }

  const generateNewToken = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/integrator/tokens', {
        method: 'POST'
      })
      
      const data = await response.json()
      
      if (data.success) {
        await fetchWebhookTokens()
        toast.success('Novo token gerado com sucesso!')
      } else {
        toast.error(data.error || 'Erro ao gerar token')
      }
    } catch (error) {
      toast.error('Erro ao gerar token')
    } finally {
      setLoading(false)
    }
  }

  const revokeToken = async (tokenId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/integrator/tokens/${tokenId}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (data.success) {
        await fetchWebhookTokens()
        toast.success('Token revogado com sucesso!')
      } else {
        toast.error(data.error || 'Erro ao revogar token')
      }
    } catch (error) {
      toast.error('Erro ao revogar token')
    } finally {
      setLoading(false)
    }
  }

  return {
    config,
    logs,
    webhookTokens,
    webhookStats,
    loading,
    toggleIntegrator,
    updateInterval,
    executeManualCheck,
    generateNewToken,
    revokeToken,
    fetchLogs,
    fetchWebhookStats
  }
}
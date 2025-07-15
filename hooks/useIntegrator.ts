// hooks/useIntegrator.ts
"use client"

import { useState, useEffect } from 'react'
import { IntegratorConfig, IntegratorLog, WebhookToken, WebhookStats } from '@/types/integrator'
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

    return () => { subscription.unsubscribe(); }
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
            toast.success('Novas contagens recebidas!', {
              description: `${newLog.processed_count} contagens processadas via webhook`
            })
          }
        }
      )
      .subscribe()

    return () => { subscription.unsubscribe(); }
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
        () => {
          // Disparar evento customizado para atualizar dashboard
          window.dispatchEvent(new CustomEvent('contagens-updated'))
        }
      )
      .subscribe()

    return () => { subscription.unsubscribe(); }
  }, [])

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/integrator/status')
      const data = await response.json()
      
      if (data.success) {
        setConfig(data.config)
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
      const response = await fetch('/api/integrator/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setConfig(data.config)
        toast.success(
          config.isActive ? 'Integrador desativado!' : 'Integrador ativado!',
          {
            description: config.isActive 
              ? 'API webhook bloqueada para receber contagens'
              : 'API webhook liberada para receber contagens'
          }
        )
      } else {
        toast.error(data.error || 'Erro ao alterar status do integrador')
      }
    } catch (error) {
      toast.error('Erro ao alterar status do integrador')
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
    generateNewToken,
    revokeToken,
    fetchLogs,
    fetchWebhookStats
  }
}
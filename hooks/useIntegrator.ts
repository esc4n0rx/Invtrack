// hooks/useIntegrator.ts (corrigido)
"use client"

import { useState, useEffect, useCallback } from 'react'
import { IntegratorConfig, IntegratorLog } from '@/types/integrator'
import { supabaseClient } from '@/lib/supabase'
import { toast } from 'sonner'
import { useIntegratorNotifications } from './useIntegratorNotifications'

export function useIntegrator() {
  const [config, setConfig] = useState<IntegratorConfig>({
    isActive: false,
    interval: 30,
    lastSync: null,
    totalProcessed: 0,
    errorCount: 0,
    lastContagemId: 0,
    lastTransitoId: 0,
    syncStrategy: 'sequence'
  })
  const [logs, setLogs] = useState<IntegratorLog[]>([])
  const [loading, setLoading] = useState(false)
  const [syncProgress, setSyncProgress] = useState<{
    isRunning: boolean
    recordsFound: number
    recordsProcessed: number
  }>({
    isRunning: false,
    recordsFound: 0,
    recordsProcessed: 0
  })

  // Usar notificações otimizadas
  const { notifications, unreadCount, markAsRead } = useIntegratorNotifications()

  // Buscar status inicial
  useEffect(() => {
    fetchStatus()
    fetchLogs()
  }, [])

  // Subscription para mudanças no banco em tempo real
  useEffect(() => {
    const subscription = supabaseClient
      .channel('integrator-config-optimized')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'invtrack_integrator_config' 
        }, 
        () => {
          fetchStatus()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Subscription para logs em tempo real
  useEffect(() => {
    const subscription = supabaseClient
      .channel('integrator-logs-optimized')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'invtrack_integrator_logs' 
        }, 
        () => {
          fetchLogs()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Subscription para estatísticas de sincronização
  useEffect(() => {
    const subscription = supabaseClient
      .channel('sync-stats')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'invtrack_sync_stats' 
        }, 
        (payload) => {
          const { records_found, records_processed } = payload.new
          setSyncProgress({
            isRunning: records_processed < records_found,
            recordsFound: records_found,
            recordsProcessed: records_processed
          })
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/integrator/status')
      const data = await response.json()
      
      if (data.success) {
        setConfig(data.config)
      }
    } catch (error) {
      console.error('Erro ao buscar status:', error)
    }
  }

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/integrator/logs')
      const data = await response.json()
      
      if (data.success) {
        setLogs(data.logs)
      }
    } catch (error) {
      console.error('Erro ao buscar logs:', error)
    }
  }

  const startIntegrator = async (interval: number) => {
    setLoading(true)
    try {
      const response = await fetch('/api/integrator/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', interval })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setConfig(data.config)
        toast.success('Integrador iniciado com sucesso!', {
          description: `Sincronização a cada ${interval} segundos usando controle de sequência`
        })
      } else {
        toast.error(data.error || 'Erro ao iniciar integrador')
      }
    } catch (error) {
      toast.error('Erro ao iniciar integrador')
    } finally {
      setLoading(false)
    }
  }

  const stopIntegrator = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/integrator/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop' })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setConfig(data.config)
        toast.success('Integrador parado com sucesso!')
      } else {
        toast.error(data.error || 'Erro ao parar integrador')
      }
    } catch (error) {
      toast.error('Erro ao parar integrador')
    } finally {
      setLoading(false)
    }
  }

  const forcSync = useCallback(async () => {
    setLoading(true)
    setSyncProgress({ isRunning: true, recordsFound: 0, recordsProcessed: 0 })
    
    try {
      const response = await fetch('/api/integrator/sync', {
        method: 'POST'
      })
      
      const data = await response.json()
      
      if (data.success) {
        const message = `Sincronização forçada concluída! ${data.processed} itens processados`
        const description = data.duplicates > 0 
          ? `${data.duplicates} duplicatas encontradas em ${data.duration}ms`
          : `Concluída em ${data.duration}ms`

        toast.success(message, { description })
        fetchStatus()
        fetchLogs()
      } else {
        toast.error(data.error || 'Erro na sincronização')
      }
    } catch (error) {
      toast.error('Erro na sincronização forçada')
    } finally {
      setLoading(false)
      setSyncProgress({ isRunning: false, recordsFound: 0, recordsProcessed: 0 })
    }
  }, [])

  const resetSequenceControl = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/integrator/reset-sequence', {
        method: 'POST'
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success('Controle de sequência resetado com sucesso!')
        fetchStatus()
      } else {
        toast.error(data.error || 'Erro ao resetar controle de sequência')
      }
    } catch (error) {
      toast.error('Erro ao resetar controle de sequência')
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    config,
    logs,
    loading,
    syncProgress,
    notifications,
    unreadCount,
    startIntegrator,
    stopIntegrator,
    forcSync,
    resetSequenceControl,
    fetchStatus,
    fetchLogs,
    markNotificationsAsRead: markAsRead
  }
}
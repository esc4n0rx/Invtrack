// hooks/useIntegrator.ts
"use client"

import { useState, useEffect, useCallback } from 'react'
import { IntegratorConfig, IntegratorLog } from '@/types/integrator'
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
  const [loading, setLoading] = useState(false)

  // Buscar status inicial
  useEffect(() => {
    fetchStatus()
  }, [])

  // Polling para atualizações em tempo real
  useEffect(() => {
    if (!config.isActive) return

    const interval = setInterval(() => {
      fetchStatus()
      fetchLogs()
    }, 5000) // Atualiza a cada 5 segundos

    return () => clearInterval(interval)
  }, [config.isActive])

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
        toast.success('Integrador iniciado com sucesso!')
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
    try {
      const response = await fetch('/api/integrator/sync', {
        method: 'POST'
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success(`Sincronização forçada concluída! ${data.processed} itens processados`)
        fetchStatus()
        fetchLogs()
      } else {
        toast.error(data.error || 'Erro na sincronização')
      }
    } catch (error) {
      toast.error('Erro na sincronização forçada')
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    config,
    logs,
    loading,
    startIntegrator,
    stopIntegrator,
    forcSync,
    fetchStatus,
    fetchLogs
  }
}
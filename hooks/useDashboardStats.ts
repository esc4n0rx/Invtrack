// hooks/useDashboardStats.ts
import { useState, useEffect } from 'react'
import { DashboardStats } from '@/types/dashboard'
import { buscarEstatisticasDashboard } from '@/lib/api/dashboard'
import { supabaseClient } from '@/lib/supabase'

export function useDashboardStats(codigoInventario?: string) {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const carregarEstatisticas = async () => {
    if (!codigoInventario) {
      setStats(null)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const response = await buscarEstatisticasDashboard(codigoInventario)
      
      if (response.success && response.data) {
        setStats(response.data)
      } else {
        setError(response.error || 'Erro ao carregar estatísticas')
        setStats(null)
      }
    } catch (err) {
      setError('Erro de conexão')
      setStats(null)
    } finally {
      setLoading(false)
    }
  }

  // Carregar estatísticas inicial
  useEffect(() => {
    carregarEstatisticas()
  }, [codigoInventario])

  // Subscription para eventos de integração
  useEffect(() => {
    if (!codigoInventario) return

    const subscription = supabaseClient
      .channel('integration-events-stats')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'invtrack_integrator_events' 
        }, 
        (payload) => {
          if (payload.new.event_type === 'new_integration') {
            // Só recarrega se realmente houve novas integrações
            carregarEstatisticas()
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [codigoInventario])

  return {
    stats,
    loading,
    error,
    recarregar: carregarEstatisticas
  }
}
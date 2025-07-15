// hooks/useContagens.ts
import { useState, useEffect } from 'react'
import { Contagem, CreateContagemRequest, EditContagemRequest, DeleteContagemRequest } from '@/types/contagem'
import { buscarContagens, criarContagem, editarContagem, deletarContagem } from '@/lib/api/contagens'
import { supabaseClient } from '@/lib/supabase'

export function useContagens(codigoInventario?: string) {
  const [contagens, setContagens] = useState<Contagem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const carregarContagens = async () => {
    if (!codigoInventario) {
      setContagens([])
      return
    }

    try {
      setLoading(true)
      setError(null)
      const response = await buscarContagens(codigoInventario)
      
      if (response.success && Array.isArray(response.data)) {
        setContagens(response.data)
      } else {
        setError(response.error || 'Erro ao carregar contagens')
        setContagens([])
      }
    } catch (err) {
      setError('Erro de conexão')
      setContagens([])
    } finally {
      setLoading(false)
    }
  }

  // Carregar contagens inicial
  useEffect(() => {
    carregarContagens()
  }, [codigoInventario])

  // Subscription para eventos de integração
  useEffect(() => {
    if (!codigoInventario) return

    const subscription = supabaseClient
      .channel('integration-events')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'invtrack_integrator_events' 
        }, 
        (payload) => {
          if (payload.new.event_type === 'new_integration') {
            // Só recarrega se realmente houve novas integrações
            carregarContagens()
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [codigoInventario])

  const adicionarContagem = async (dados: CreateContagemRequest) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await criarContagem(dados)
      
      if (response.success && response.data) {
        await carregarContagens() // Recarrega a lista
        return { success: true, data: response.data }
      } else {
        const errorMsg = response.error || 'Erro ao criar contagem'
        setError(errorMsg)
        return { success: false, error: errorMsg }
      }
    } catch (err) {
      const errorMsg = 'Erro de conexão ao criar contagem'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setLoading(false)
    }
  }

  const atualizarContagem = async (dados: EditContagemRequest) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await editarContagem(dados)
      
      if (response.success) {
        await carregarContagens() // Recarrega a lista
        return { success: true }
      } else {
        const errorMsg = response.error || 'Erro ao editar contagem'
        setError(errorMsg)
        return { success: false, error: errorMsg }
      }
    } catch (err) {
      const errorMsg = 'Erro de conexão ao editar contagem'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setLoading(false)
    }
  }

  const removerContagem = async (dados: DeleteContagemRequest) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await deletarContagem(dados)
      
      if (response.success) {
        await carregarContagens() // Recarrega a lista
        return { success: true }
      } else {
        const errorMsg = response.error || 'Erro ao deletar contagem'
        setError(errorMsg)
        return { success: false, error: errorMsg }
      }
    } catch (err) {
      const errorMsg = 'Erro de conexão ao deletar contagem'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setLoading(false)
    }
  }

  return {
    contagens,
    loading,
    error,
    adicionarContagem,
    atualizarContagem,
    removerContagem,
    recarregar: carregarContagens
  }
}
// hooks/useInventario.ts
import { useState, useEffect } from 'react'
import { Inventario } from '@/types/inventario'
import { buscarInventarioAtivo, criarInventario, finalizarInventario } from '@/lib/api/inventarios'

export function useInventario() {
  const [inventarioAtivo, setInventarioAtivo] = useState<Inventario | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const carregarInventarioAtivo = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await buscarInventarioAtivo()
      
      if (response.success) {
        setInventarioAtivo(response.data || null)
      } else {
        setError(response.error || 'Erro ao carregar inventário')
      }
    } catch (err) {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  const criarNovoInventario = async (responsavel: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await criarInventario({ responsavel })
      
      if (response.success && response.data) {
        setInventarioAtivo(response.data)
        return { success: true, data: response.data }
      } else {
        const errorMsg = response.error || 'Erro ao criar inventário'
        setError(errorMsg)
        return { success: false, error: errorMsg }
      }
    } catch (err) {
      const errorMsg = 'Erro de conexão ao criar inventário'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setLoading(false)
    }
  }

  const finalizarInventarioAtivo = async () => {
    if (!inventarioAtivo) {
      return { success: false, error: 'Nenhum inventário ativo encontrado' }
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await finalizarInventario(inventarioAtivo.id)
      
      if (response.success) {
        setInventarioAtivo(null)
        return { success: true }
      } else {
        const errorMsg = response.error || 'Erro ao finalizar inventário'
        setError(errorMsg)
        return { success: false, error: errorMsg }
      }
    } catch (err) {
      const errorMsg = 'Erro de conexão ao finalizar inventário'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarInventarioAtivo()
  }, [])

  return {
    inventarioAtivo,
    loading,
    error,
    criarNovoInventario,
    finalizarInventarioAtivo,
    recarregar: carregarInventarioAtivo
  }
}
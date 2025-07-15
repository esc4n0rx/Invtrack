// hooks/useComparativo.ts
import { useState, useCallback } from 'react'
import { ComparativoRequest, ComparativoResultado, ComparativoInventario } from '@/types/comparativo'
import { buscarInventariosDisponiveis, compararInventarios } from '@/lib/api/comparativos'

export function useComparativo() {
  const [inventarios, setInventarios] = useState<ComparativoInventario[]>([])
  const [loadingInventarios, setLoadingInventarios] = useState(false)
  const [comparacao, setComparacao] = useState<ComparativoResultado | null>(null)
  const [loadingComparacao, setLoadingComparacao] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const carregarInventarios = useCallback(async () => {
    try {
      setLoadingInventarios(true)
      setError(null)
      
      const response = await buscarInventariosDisponiveis()
      
      if (response.success && response.data) {
        setInventarios(response.data)
      } else {
        setError(response.error || 'Erro ao carregar inventários')
        setInventarios([])
      }
    } catch (err) {
      setError('Erro de conexão')
      setInventarios([])
    } finally {
      setLoadingInventarios(false)
    }
  }, [])

  const realizarComparacao = useCallback(async (request: ComparativoRequest) => {
    try {
      setLoadingComparacao(true)
      setError(null)
      
      const response = await compararInventarios(request)
      
      if (response.success && response.data) {
        setComparacao(response.data)
        return { success: true, data: response.data }
      } else {
        const errorMsg = response.error || 'Erro ao realizar comparação'
        setError(errorMsg)
        return { success: false, error: errorMsg }
      }
    } catch (err) {
      const errorMsg = 'Erro de conexão ao comparar inventários'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setLoadingComparacao(false)
    }
  }, [])

  const limparComparacao = useCallback(() => {
    setComparacao(null)
    setError(null)
  }, [])

  return {
    inventarios,
    loadingInventarios,
    comparacao,
    loadingComparacao,
    error,
    carregarInventarios,
    realizarComparacao,
    limparComparacao
  }
}
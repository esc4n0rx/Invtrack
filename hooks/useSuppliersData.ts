// hooks/useSuppliersData.ts
import { useState, useEffect } from 'react'
import { Contagem } from '@/types/contagem'
import { buscarContagensFornecedor } from '@/lib/api/suppliers'

export interface SuppliersStats {
  totalFornecedores: number
  totalItens: number
  totalQuantidade: number
  fornecedoresDetalhes: { fornecedor: string; itens: number; quantidade: number }[]
  topResponsaveis: { responsavel: string; quantidade: number }[]
}

export function useSuppliersData(codigoInventario?: string) {
  const [contagens, setContagens] = useState<Contagem[]>([])
  const [stats, setStats] = useState<SuppliersStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const carregarDados = async () => {
    if (!codigoInventario) {
      setContagens([])
      setStats(null)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const response = await buscarContagensFornecedor(codigoInventario)
      
      if (response.success && Array.isArray(response.data)) {
        const contagensFornecedor = response.data
        setContagens(contagensFornecedor)
        
        // Calcular estatísticas
        const fornecedoresUnicos = new Set(contagensFornecedor.map(c => c.fornecedor).filter(Boolean))
        const totalFornecedores = fornecedoresUnicos.size
        const totalItens = contagensFornecedor.length
        const totalQuantidade = contagensFornecedor.reduce((acc, c) => acc + c.quantidade, 0)
        
        // Detalhes por fornecedor
        const fornecedoresMap = new Map<string, { itens: number; quantidade: number }>()
        contagensFornecedor.forEach(c => {
          if (c.fornecedor) {
            const current = fornecedoresMap.get(c.fornecedor) || { itens: 0, quantidade: 0 }
            fornecedoresMap.set(c.fornecedor, {
              itens: current.itens + 1,
              quantidade: current.quantidade + c.quantidade
            })
          }
        })
        
        const fornecedoresDetalhes = Array.from(fornecedoresMap.entries())
          .map(([fornecedor, dados]) => ({ fornecedor, ...dados }))
          .sort((a, b) => b.quantidade - a.quantidade)

        // Top responsáveis
        const responsaveisMap = new Map<string, number>()
        contagensFornecedor.forEach(c => {
          responsaveisMap.set(c.responsavel, (responsaveisMap.get(c.responsavel) || 0) + c.quantidade)
        })
        
        const topResponsaveis = Array.from(responsaveisMap.entries())
          .map(([responsavel, quantidade]) => ({ responsavel, quantidade }))
          .sort((a, b) => b.quantidade - a.quantidade)
          .slice(0, 5)

        setStats({
          totalFornecedores,
          totalItens,
          totalQuantidade,
          fornecedoresDetalhes,
          topResponsaveis
        })
      } else {
        setError(response.error || 'Erro ao carregar dados de fornecedores')
        setContagens([])
        setStats(null)
      }
    } catch (err) {
      setError('Erro de conexão')
      setContagens([])
      setStats(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [codigoInventario])

  return {
    contagens,
    stats,
    loading,
    error,
    recarregar: carregarDados
  }
}
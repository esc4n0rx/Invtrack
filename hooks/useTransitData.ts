// hooks/useTransitData.ts
import { useState, useEffect } from 'react'
import { Contagem } from '@/types/contagem'
import { buscarContagensTransito } from '@/lib/api/transit'

export interface TransitStats {
  totalItens: number
  totalQuantidade: number
  rotas: { origem: string; destino: string; quantidade: number }[]
  topResponsaveis: { responsavel: string; quantidade: number }[]
}

export function useTransitData(codigoInventario?: string) {
  const [contagens, setContagens] = useState<Contagem[]>([])
  const [stats, setStats] = useState<TransitStats | null>(null)
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
      const response = await buscarContagensTransito(codigoInventario)
      
      if (response.success && Array.isArray(response.data)) {
        const contagensTransito = response.data
        setContagens(contagensTransito)
        
        // Calcular estatísticas
        const totalItens = contagensTransito.length
        const totalQuantidade = contagensTransito.reduce((acc, c) => acc + c.quantidade, 0)
        
        // Agrupar por rotas
        const rotasMap = new Map<string, number>()
        contagensTransito.forEach(c => {
          const rota = `${c.cd_origem} → ${c.cd_destino}`
          rotasMap.set(rota, (rotasMap.get(rota) || 0) + c.quantidade)
        })
        
        const rotas = Array.from(rotasMap.entries()).map(([rota, quantidade]) => {
          const [origem, destino] = rota.split(' → ')
          return { origem, destino, quantidade }
        }).sort((a, b) => b.quantidade - a.quantidade)

        // Top responsáveis
        const responsaveisMap = new Map<string, number>()
        contagensTransito.forEach(c => {
          responsaveisMap.set(c.responsavel, (responsaveisMap.get(c.responsavel) || 0) + c.quantidade)
        })
        
        const topResponsaveis = Array.from(responsaveisMap.entries())
          .map(([responsavel, quantidade]) => ({ responsavel, quantidade }))
          .sort((a, b) => b.quantidade - a.quantidade)
          .slice(0, 5)

        setStats({
          totalItens,
          totalQuantidade,
          rotas,
          topResponsaveis
        })
      } else {
        setError(response.error || 'Erro ao carregar dados de trânsito')
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
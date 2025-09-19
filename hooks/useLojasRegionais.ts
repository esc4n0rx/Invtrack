// hooks/useLojasRegionais.ts
import * as React from 'react'
import { LojaRegional } from '@/types/loja'

interface UseLojasRegionaisResult {
  lojas: LojaRegional[]
  lojasPorResponsavel: Record<string, string[]>
  responsaveis: string[]
  loading: boolean
  error: string | null
  recarregar: () => Promise<void>
}

export function useLojasRegionais(): UseLojasRegionaisResult {
  const [lojas, setLojas] = React.useState<LojaRegional[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const carregar = React.useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/lojas')
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Não foi possível carregar as lojas')
      }

      const dados: LojaRegional[] = (result.data || []).map((loja: LojaRegional) => ({
        ...loja,
        nome: loja.nome.trim(),
        responsavel: loja.responsavel.trim(),
      }))

      setLojas(dados)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado ao carregar as lojas')
      setLojas([])
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    carregar()
  }, [carregar])

  const lojasOrdenadas = React.useMemo(
    () =>
      lojas
        .slice()
        .sort(
          (a, b) =>
            a.responsavel.localeCompare(b.responsavel, 'pt-BR') ||
            a.nome.localeCompare(b.nome, 'pt-BR')
        ),
    [lojas]
  )

  const lojasPorResponsavel = React.useMemo(() => {
    return lojasOrdenadas.reduce<Record<string, string[]>>((acc, loja) => {
      if (!acc[loja.responsavel]) {
        acc[loja.responsavel] = []
      }
      acc[loja.responsavel].push(loja.nome)
      return acc
    }, {})
  }, [lojasOrdenadas])

  const responsaveis = React.useMemo(
    () => Object.keys(lojasPorResponsavel).sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [lojasPorResponsavel]
  )

  return {
    lojas: lojasOrdenadas,
    lojasPorResponsavel,
    responsaveis,
    loading,
    error,
    recarregar: carregar,
  }
}

// hooks/useContagensExternas.ts
import { useState, useEffect, useMemo } from 'react'
import { ContagemExterna, SetorContagens, ContagemComparacao } from '@/types/contagem-externa'
import { buscarContagensExternas, aprovarContagemExterna } from '@/lib/api/contagens-externas'
import { setoresCD } from '@/data/setores'

export function useContagensExternas(codigoInventario?: string) {
  const [contagens, setContagens] = useState<ContagemExterna[]>([])
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
      const response = await buscarContagensExternas(codigoInventario)
      
      if (response.success && Array.isArray(response.data)) {
        setContagens(response.data)
      } else {
        setError(response.error || 'Erro ao carregar contagens externas')
        setContagens([])
      }
    } catch (err) {
      setError('Erro de conexão')
      setContagens([])
    } finally {
      setLoading(false)
    }
  }

  const aprovarContagem = async (id: string, responsavel: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await aprovarContagemExterna(id, responsavel)
      
      if (response.success) {
        await carregarContagens() // Recarrega a lista
        return { success: true }
      } else {
        const errorMsg = response.error || 'Erro ao aprovar contagem'
        setError(errorMsg)
        return { success: false, error: errorMsg }
      }
    } catch (err) {
      const errorMsg = 'Erro de conexão ao aprovar contagem'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setLoading(false)
    }
  }

  // Processar contagens por setor
  const setoresComContagens = useMemo((): SetorContagens[] => {
    return setoresCD.map(setor => {
      const contagensDoSetor = contagens.filter(c => c.setor_cd === setor)
      
      // Criar comparação entre contagens
      const comparacao: ContagemComparacao[] = []
      if (contagensDoSetor.length > 1) {
        // Obter todos os ativos únicos das contagens deste setor
        const ativosUnicos = [...new Set(
          contagensDoSetor.flatMap(c => c.itens.map(i => i.ativo))
        )]

        ativosUnicos.forEach(ativo => {
          const contagensDoAtivo = contagensDoSetor.map(contagem => {
            const item = contagem.itens.find(i => i.ativo === ativo)
            return {
              numero: contagem.numero_contagem,
              quantidade: item?.quantidade || 0,
              contador: contagem.contador
            }
          })

          const quantidades = contagensDoAtivo.map(c => c.quantidade)
          const temDivergencia = new Set(quantidades).size > 1

          comparacao.push({
            ativo,
            contagens: contagensDoAtivo,
            divergencias: temDivergencia
          })
        })
      }

      return {
        setor,
        contagens: contagensDoSetor,
        totalContagens: contagensDoSetor.length,
        podeContar: contagensDoSetor.length < 5,
        comparacao: comparacao.length > 0 ? comparacao : undefined
      }
    }).filter(setor => setor.totalContagens > 0) // Só mostrar setores com contagens
  }, [contagens])

  useEffect(() => {
    carregarContagens()
  }, [codigoInventario])

  return {
    contagens,
    setoresComContagens,
    loading,
    error,
    aprovarContagem,
    recarregar: carregarContagens
  }
}
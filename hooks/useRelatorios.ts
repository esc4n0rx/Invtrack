// hooks/useRelatorios.ts
import { useState, useEffect } from 'react'
import { Relatorio, RelatorioTemplate, CreateRelatorioRequest } from '@/types/relatorio'
import { buscarRelatorios, criarRelatorio, gerarRelatorio, excluirRelatorio, buscarTemplates, baixarRelatorio } from '@/lib/api/relatorios'

export function useRelatorios(codigoInventario?: string) {
  const [relatorios, setRelatorios] = useState<Relatorio[]>([])
  const [templates, setTemplates] = useState<RelatorioTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const carregarRelatorios = async () => {
    if (!codigoInventario) {
      setRelatorios([])
      return
    }

    try {
      setLoading(true)
      setError(null)
      const response = await buscarRelatorios(codigoInventario)
      
      if (response.success && response.data) {
        setRelatorios(Array.isArray(response.data) ? response.data : [response.data])
      } else {
        setError(response.error || 'Erro ao carregar relatórios')
        setRelatorios([])
      }
    } catch (err) {
      setError('Erro de conexão')
      setRelatorios([])
    } finally {
      setLoading(false)
    }
  }

  const carregarTemplates = async () => {
    try {
      setLoadingTemplates(true)
      const response = await buscarTemplates()
      
      if (response.success && response.data) {
        setTemplates(Array.isArray(response.data) ? response.data : [response.data])
      }
    } catch (err) {
      console.error('Erro ao carregar templates:', err)
    } finally {
      setLoadingTemplates(false)
    }
  }

  const criarNovoRelatorio = async (dados: CreateRelatorioRequest): Promise<Relatorio | null> => {
    try {
      setError(null)
      const response = await criarRelatorio(dados)
      
      if (response.success && response.data) {
        const relatorio = Array.isArray(response.data) ? response.data[0] : response.data;
        await carregarRelatorios() // Recarregar lista
        return relatorio // retorna o relatório criado
      } else {
        setError(response.error || 'Erro ao criar relatório')
        return null
      }
    } catch (err) {
      setError('Erro de conexão ao criar relatório')
      return null
    }
  }

  const processarRelatorio = async (relatorioId: string): Promise<boolean> => {
    try {
      setError(null)
      const response = await gerarRelatorio(relatorioId)
      
      if (response.success) {
        await carregarRelatorios() // Recarregar para atualizar status
        return true
      } else {
        setError(response.error || 'Erro ao processar relatório')
        return false
      }
    } catch (err) {
      setError('Erro de conexão ao processar relatório')
      return false
    }
  }

  const baixarArquivo = async (relatorioId: string, nomeArquivo: string): Promise<boolean> => {
    try {
      const blob = await baixarRelatorio(relatorioId)
      
      if (blob) {
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = nomeArquivo
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        return true
      } else {
        setError('Erro ao baixar arquivo')
        return false
      }
    } catch (err) {
      setError('Erro de conexão ao baixar arquivo')
      return false
    }
  }

  const removerRelatorio = async (relatorioId: string): Promise<boolean> => {
    try {
      setError(null)
      const response = await excluirRelatorio(relatorioId)
      
      if (response.success) {
        await carregarRelatorios() // Recarregar lista
        return true
      } else {
        setError(response.error || 'Erro ao excluir relatório')
        return false
      }
    } catch (err) {
      setError('Erro de conexão ao excluir relatório')
      return false
    }
  }

  useEffect(() => {
    carregarRelatorios()
  }, [codigoInventario])

  useEffect(() => {
    carregarTemplates()
  }, [])

  return {
    relatorios,
    templates,
    loading,
    loadingTemplates,
    error,
    criarNovoRelatorio,
    processarRelatorio,
    baixarArquivo,
    removerRelatorio,
    recarregar: carregarRelatorios
  }
}
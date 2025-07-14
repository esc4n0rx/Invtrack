// lib/api/relatorios.ts
import { RelatorioResponse, CreateRelatorioRequest, TemplateResponse } from '@/types/relatorio'

export async function buscarRelatorios(codigoInventario: string): Promise<RelatorioResponse> {
  try {
    const response = await fetch(`/api/relatorios?inventario=${codigoInventario}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Erro ao buscar relatórios:', error)
    return {
      success: false,
      error: 'Erro de conexão ao buscar relatórios'
    }
  }
}

export async function criarRelatorio(dados: CreateRelatorioRequest): Promise<RelatorioResponse> {
  try {
    const response = await fetch('/api/relatorios', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dados),
    })

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Erro ao criar relatório:', error)
    return {
      success: false,
      error: 'Erro de conexão ao criar relatório'
    }
  }
}

export async function gerarRelatorio(relatorioId: string): Promise<RelatorioResponse> {
  try {
    const response = await fetch('/api/relatorios/gerar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ relatorio_id: relatorioId }),
    })

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Erro ao gerar relatório:', error)
    return {
      success: false,
      error: 'Erro de conexão ao gerar relatório'
    }
  }
}

export async function baixarRelatorio(relatorioId: string): Promise<Blob | null> {
  try {
    const response = await fetch(`/api/relatorios/${relatorioId}/download`)
    
    if (!response.ok) {
      throw new Error('Erro ao baixar relatório')
    }

    return await response.blob()
  } catch (error) {
    console.error('Erro ao baixar relatório:', error)
    return null
  }
}

export async function excluirRelatorio(relatorioId: string): Promise<RelatorioResponse> {
  try {
    const response = await fetch(`/api/relatorios/${relatorioId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Erro ao excluir relatório:', error)
    return {
      success: false,
      error: 'Erro de conexão ao excluir relatório'
    }
  }
}

export async function buscarTemplates(): Promise<TemplateResponse> {
  try {
    const response = await fetch('/api/relatorios/templates', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Erro ao buscar templates:', error)
    return {
      success: false,
      error: 'Erro de conexão ao buscar templates'
    }
  }
}
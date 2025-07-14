// lib/api/contagens-externas.ts
import { CreateContagemExternaRequest, ContagemExternaResponse } from '@/types/contagem-externa'

export async function criarContagemExterna(dados: CreateContagemExternaRequest): Promise<ContagemExternaResponse> {
  try {
    const response = await fetch('/api/contagens-externas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dados),
    })

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Erro ao criar contagem externa:', error)
    return {
      success: false,
      error: 'Erro de conexão ao criar contagem externa'
    }
  }
}

export async function buscarContagensExternas(codigoInventario: string, setor?: string): Promise<ContagemExternaResponse> {
  try {
    const params = new URLSearchParams({ inventario: codigoInventario })
    if (setor) params.append('setor', setor)

    const response = await fetch(`/api/contagens-externas?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Erro ao buscar contagens externas:', error)
    return {
      success: false,
      error: 'Erro de conexão ao buscar contagens externas'
    }
  }
}

export async function aprovarContagemExterna(id: string, responsavel: string): Promise<ContagemExternaResponse> {
  try {
    const response = await fetch(`/api/contagens-externas/${id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ responsavel }),
    })

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Erro ao aprovar contagem externa:', error)
    return {
      success: false,
      error: 'Erro de conexão ao aprovar contagem externa'
    }
  }
}
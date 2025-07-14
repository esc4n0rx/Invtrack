// lib/api/inventarios.ts
import { CreateInventarioRequest, CreateInventarioResponse, GetInventarioAtivoResponse } from '@/types/inventario'

export async function criarInventario(dados: CreateInventarioRequest): Promise<CreateInventarioResponse> {
  try {
    const response = await fetch('/api/inventarios', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dados),
    })

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Erro ao criar inventário:', error)
    return {
      success: false,
      error: 'Erro de conexão ao criar inventário'
    }
  }
}

export async function buscarInventarioAtivo(): Promise<GetInventarioAtivoResponse> {
  try {
    const response = await fetch('/api/inventarios/ativo', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Erro ao buscar inventário ativo:', error)
    return {
      success: false,
      error: 'Erro de conexão ao buscar inventário ativo'
    }
  }
}

export async function finalizarInventario(id: string): Promise<CreateInventarioResponse> {
  try {
    const response = await fetch(`/api/inventarios/${id}/finalizar`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Erro ao finalizar inventário:', error)
    return {
      success: false,
      error: 'Erro de conexão ao finalizar inventário'
    }
  }
}
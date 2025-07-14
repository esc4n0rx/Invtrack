// lib/api/contagens.ts
import { CreateContagemRequest, ContagemResponse, EditContagemRequest, DeleteContagemRequest } from '@/types/contagem'

export async function criarContagem(dados: CreateContagemRequest): Promise<ContagemResponse> {
  try {
    const response = await fetch('/api/contagens', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dados),
    })

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Erro ao criar contagem:', error)
    return {
      success: false,
      error: 'Erro de conexão ao criar contagem'
    }
  }
}

export async function buscarContagens(codigoInventario: string): Promise<ContagemResponse> {
  try {
    const response = await fetch(`/api/contagens?inventario=${codigoInventario}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Erro ao buscar contagens:', error)
    return {
      success: false,
      error: 'Erro de conexão ao buscar contagens'
    }
  }
}

export async function editarContagem(dados: EditContagemRequest): Promise<ContagemResponse> {
  try {
    const response = await fetch(`/api/contagens/${dados.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dados),
    })

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Erro ao editar contagem:', error)
    return {
      success: false,
      error: 'Erro de conexão ao editar contagem'
    }
  }
}

export async function deletarContagem(dados: DeleteContagemRequest): Promise<ContagemResponse> {
  try {
    const response = await fetch(`/api/contagens/${dados.id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dados),
    })

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Erro ao deletar contagem:', error)
    return {
      success: false,
      error: 'Erro de conexão ao deletar contagem'
    }
  }
}
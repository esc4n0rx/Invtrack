// lib/api/comparativos.ts
import { ComparativoRequest, ComparativoResponse, ListaInventariosResponse } from '@/types/comparativo'

export async function buscarInventariosDisponiveis(): Promise<ListaInventariosResponse> {
  try {
    const response = await fetch('/api/comparativos/inventarios', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Erro ao buscar inventários:', error)
    return {
      success: false,
      error: 'Erro de conexão ao buscar inventários'
    }
  }
}

export async function compararInventarios(request: ComparativoRequest): Promise<ComparativoResponse> {
  try {
    const response = await fetch('/api/comparativos/comparar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Erro ao comparar inventários:', error)
    return {
      success: false,
      error: 'Erro de conexão ao comparar inventários'
    }
  }
}
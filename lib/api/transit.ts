// lib/api/transit.ts
import { ContagemResponse } from '@/types/contagem'

export async function buscarContagensTransito(codigoInventario: string): Promise<ContagemResponse> {
  try {
    const response = await fetch(`/api/contagens?inventario=${codigoInventario}&tipo=transito`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Erro ao buscar contagens de trânsito:', error)
    return {
      success: false,
      error: 'Erro de conexão ao buscar contagens de trânsito'
    }
  }
}
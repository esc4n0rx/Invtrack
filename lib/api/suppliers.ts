// lib/api/suppliers.ts
import { ContagemResponse } from '@/types/contagem'

export async function buscarContagensFornecedor(codigoInventario: string): Promise<ContagemResponse> {
  try {
    const response = await fetch(`/api/contagens?inventario=${codigoInventario}&tipo=fornecedor`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Erro ao buscar contagens de fornecedor:', error)
    return {
      success: false,
      error: 'Erro de conexão ao buscar contagens de fornecedor'
    }
  }
}
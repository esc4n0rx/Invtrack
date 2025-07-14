// lib/api/dashboard.ts
import { DashboardStatsResponse } from '@/types/dashboard'

export async function buscarEstatisticasDashboard(codigoInventario: string): Promise<DashboardStatsResponse> {
  try {
    const response = await fetch(`/api/dashboard/stats?inventario=${codigoInventario}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Erro ao buscar estatísticas do dashboard:', error)
    return {
      success: false,
      error: 'Erro de conexão ao buscar estatísticas'
    }
  }
}
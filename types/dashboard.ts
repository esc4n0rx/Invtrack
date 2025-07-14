// types/dashboard.ts
export interface DashboardStats {
    lojas: {
      total: number
      contadas: number
      pendentes: number
      detalhes: LojaContagem[]
    }
    areasCD: {
      total: number
      contadas: number
      pendentes: number
      detalhes: AreaCDContagem[]
    }
    ativos: {
      [key: string]: number
    }
    lojasPendentes: LojasPendentesPorResponsavel[]
  }
  
  export interface LojaContagem {
    loja: string
    contada: boolean
  }
  
  export interface AreaCDContagem {
    setor: string
    contada: boolean
  }
  
  export interface LojasPendentesPorResponsavel {
    responsavel: string
    lojasPendentes: string[]
    totalPendentes: number
  }
  
  export interface DashboardStatsResponse {
    success: boolean
    data?: DashboardStats
    error?: string
  }
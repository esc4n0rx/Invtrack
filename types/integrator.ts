// types/integrator.ts
export interface IntegratorConfig {
    isActive: boolean
    interval: number // em segundos (5, 10, 30, 60)
    lastSync: Date | null
    totalProcessed: number
    errorCount: number
  }
  
  export interface IntegratorLog {
    id: string
    timestamp: Date
    type: 'success' | 'error' | 'warning' | 'info'
    message: string
    details?: any
    processed_count?: number
  }
  
  export interface ExternalContagem {
    email: string
    loja_nome: string
    ativo_nome: string
    quantidade: number
  }
  
  export interface ExternalContagemTransito {
    email: string
    loja_nome: string // CD SP ou CD ES
    ativo_nome: string
    quantidade: number
  }
  
  export interface ProcessedResult {
    success: boolean
    processed: number
    errors: string[]
    duplicates: number
  }
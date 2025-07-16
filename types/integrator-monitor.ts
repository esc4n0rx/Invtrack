// types/integrator-monitor.ts
export interface ContagemOriginal {
    id: number
    email: string
    loja: string
    loja_nome: string
    ativo: string
    ativo_nome: string
    quantidade: number
    data_registro: string
    data_modificacao: string
    modificado_por: string | null
    observacoes: string | null
    created_at: string
    processado: boolean
    processed_at: string | null
  }
  
  export interface ContagemTransitoOriginal {
    id: number
    email: string
    loja: string
    loja_nome: string
    ativo: string
    ativo_nome: string
    quantidade: number
    data_registro: string
    data_modificacao: string
    modificado_por: string | null
    observacoes: string | null
    created_at: string
    processado: boolean
    processed_at: string | null
  }
  
  export interface ProcessingResult {
    totalProcessed: number
    lojaProcessed: number
    transitoProcessed: number
    errors: string[]
    duration: number
  }
  
  export interface MonitorConfig {
    isActive: boolean
    intervalSeconds: number
    lastCheck: Date | null
    totalProcessed: number
    errorCount: number
  }
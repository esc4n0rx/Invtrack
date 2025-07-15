// types/integrator.ts (corrigido)
export interface IntegratorConfig {
    isActive: boolean
    interval: number // em segundos (5, 10, 30, 60)
    lastSync: Date | null
    totalProcessed: number
    errorCount: number
    lastContagemId?: number // Controle de sequência para contagens
    lastTransitoId?: number // Controle de sequência para trânsito
    syncStrategy?: 'timestamp' | 'sequence' // Estratégia de sincronização
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
    id: number // ID para controle de sequência
    email: string
    loja_nome: string
    ativo_nome: string
    quantidade: number
    created_at: string
  }
  
  export interface ExternalContagemTransito {
    id: number // ID para controle de sequência
    email: string
    loja_nome: string // CD SP ou CD ES
    ativo_nome: string
    quantidade: number
    created_at: string
  }
  
  export interface ProcessedResult {
    success: boolean
    processed: number
    errors: string[]
    duplicates: number
    lastProcessedId?: number // Último ID processado
  }
  
  export interface SyncStats {
    id: string
    sync_timestamp: Date
    records_found: number
    records_processed: number
    records_failed: number
    sync_duration_ms: number
    table_name: string
    last_processed_id: number
    details?: any
   }
   
   export interface NotificationConfig {
    enableToasts: boolean
    enableSounds: boolean
    showDuplicateWarnings: boolean
    notificationDuration: number
   }
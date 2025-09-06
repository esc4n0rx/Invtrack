// types/integrator.ts
export interface IntegratorConfig {
    isActive: boolean
    interval: number
    lastSync: Date | null
    totalProcessed: number
    errorCount: number
    isCleanupCronActive: boolean // Adicionado
  }
  
  export interface IntegratorLog {
    id: string
    timestamp: Date
    type: 'success' | 'error' | 'warning' | 'info'
    message: string
    details?: any
    processed_count?: number
  }
  
  export interface WebhookToken {
    id: string
    token: string
    is_active: boolean
    created_at: string
    last_used: string | null
    requests_count: number
  }
  
  export interface WebhookLog {
    id: string
    token_used: string
    request_ip: string
    request_data: any
    response_status: number
    processing_time_ms: number
    contagens_created: number
    errors: string[] | null
    created_at: string
  }
  
  export interface WebhookStats {
    totalRequests: number
    successfulRequests: number
    failedRequests: number
    averageProcessingTime: number
    totalContagensCreated: number
  }
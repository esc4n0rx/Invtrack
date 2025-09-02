// types/contagem.ts
export interface Contagem {
  id: string
  tipo: 'loja' | 'cd' | 'fornecedor' | 'transito'
  ativo: string
  quantidade: number
  data_contagem: string
  codigo_inventario: string
  responsavel: string
  obs?: string
  // Campos específicos por tipo
  loja?: string
  setor_cd?: string
  cd_origem?: string
  cd_destino?: string
  fornecedor?: string
  created_at: string
  updated_at: string
}

export interface CreateContagemRequest {
  tipo: 'loja' | 'cd' | 'fornecedor' | 'transito'
  ativo: string
  quantidade: number
  responsavel: string
  obs?: string
  // Campos específicos por tipo
  loja?: string
  setor_cd?: string
  cd_origem?: string
  cd_destino?: string
  fornecedor?: string
  
}

export interface EditContagemRequest {
  id: string
  usuario_edicao: string
  motivo_edicao: string
  dados?: Partial<CreateContagemRequest>
}

export interface DeleteContagemRequest {
  id: string
  usuario_exclusao: string
  motivo_exclusao: string
}

export interface ContagemResponse {
  success: boolean
  data?: Contagem | Contagem[]
  error?: string
}

// ==========================================
// NOVAS INTERFACES PARA DEDUPLICAÇÃO
// ==========================================

export interface IntegratorProcessedRecord {
  id: string
  record_hash: string
  source_table: 'contagens' | 'contagens_transito' | 'webhook'
  source_id?: number
  codigo_inventario: string
  processed_at: string
  integration_details?: any
  created_at: string
}

export interface IntegratorDeduplicationStats {
  totalProcessed: number
  newRecords: number
  duplicatesSkipped: number
  errors: number
  processingTime: number
}
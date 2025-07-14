// types/inventario.ts
export interface Inventario {
    id: string
    codigo: string
    status: 'ativo' | 'finalizado' | 'cancelado'
    responsavel: string
    created_at: string
    updated_at: string
  }
  
  export interface CreateInventarioRequest {
    responsavel: string
  }
  
  export interface CreateInventarioResponse {
    success: boolean
    data?: Inventario
    error?: string
  }
  
  export interface GetInventarioAtivoResponse {
    success: boolean
    data?: Inventario
    error?: string
  }
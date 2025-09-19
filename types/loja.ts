// types/loja.ts
export interface LojaRegional {
  id: string
  nome: string
  responsavel: string
  created_at?: string | null
  updated_at?: string | null
}

export interface LojaRegionalResponse {
  success: boolean
  data?: LojaRegional[]
  error?: string
}

export interface LojaRegionalPayload {
  nome: string
  responsavel: string
}

// types/contagem-externa.ts
export interface ContagemExterna {
    id: string
    codigo_inventario: string
    setor_cd: string
    contador: string
    obs?: string
    numero_contagem: number // 1, 2, 3, 4, 5
    status: 'pendente' | 'lançada'
    data_contagem: string
    itens: ItemContagemExterna[]
    created_at: string
    updated_at: string
  }
  
  export interface ItemContagemExterna {
    id: string
    contagem_externa_id: string
    ativo: string
    quantidade: number
  }
  
  export interface CreateContagemExternaRequest {
    setor_cd: string
    contador: string
    obs?: string
    itens: {
      ativo: string
      quantidade: number
    }[]
  }
  
  export interface ContagemExternaResponse {
    success: boolean
    data?: ContagemExterna | ContagemExterna[]
    error?: string
  }
  
  export interface ContagemComparacao {
    ativo: string
    contagens: {
      numero: number
      quantidade: number
      contador: string
    }[]
    divergencias: boolean
  }
  
  export interface SetorContagens {
    setor: string
    contagens: ContagemExterna[]
    totalContagens: number
    podeContar: boolean
    comparacao?: ContagemComparacao[]
  }
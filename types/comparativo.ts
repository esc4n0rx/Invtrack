// types/comparativo.ts
export interface ComparativoInventario {
    id: string
    codigo: string
    responsavel: string
    status: 'ativo' | 'finalizado' | 'cancelado'
    data_criacao: string
    total_contagens: number
    total_ativos: number
    total_lojas: number
    total_setores_cd: number
  }
  
  export interface ComparativoRequest {
    inventario_1: string
    inventario_2: string
    tipo_comparacao: 'geral' | 'por_loja' | 'por_setor' | 'por_ativo'
    incluir_zerados?: boolean
    apenas_divergencias?: boolean
    filtros?: {
      lojas?: string[]
      setores?: string[]
      ativos?: string[]
    }
  }
  
  export interface ComparativoResultado {
    inventario_1: ComparativoInventario
    inventario_2: ComparativoInventario
    estatisticas_comparacao: {
      total_ativos_comparados: number
      ativos_apenas_inv1: number
      ativos_apenas_inv2: number
      ativos_em_ambos: number
      divergencias_encontradas: number
      percentual_divergencia: number
    }
    detalhes_comparacao: ComparativoDetalhe[]
    resumo_por_tipo: {
      loja: ComparativoTipo
      cd: ComparativoTipo
      fornecedor: ComparativoTipo
      transito: ComparativoTipo
    }
  }
  
  export interface ComparativoDetalhe {
    ativo: string
    tipo: 'loja' | 'cd' | 'fornecedor' | 'transito'
    localizacao: string // loja, setor_cd, fornecedor, etc.
    quantidade_inv1: number
    quantidade_inv2: number
    diferenca: number
    percentual_diferenca: number
    divergencia: boolean
    observacoes?: string
  }
  
  export interface ComparativoTipo {
    total_contagens_inv1: number
    total_contagens_inv2: number
    total_quantidade_inv1: number
    total_quantidade_inv2: number
    diferenca_quantidade: number
    percentual_diferenca: number
    divergencias: number
  }
  
  export interface ComparativoResponse {
    success: boolean
    data?: ComparativoResultado
    error?: string
  }
  
  export interface ListaInventariosResponse {
    success: boolean
    data?: ComparativoInventario[]
    error?: string
  }
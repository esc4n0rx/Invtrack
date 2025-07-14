// types/relatorio.ts
export interface Relatorio {
    id: string
    nome: string
    tipo: TipoRelatorio
    status: 'processando' | 'concluido' | 'erro'
    codigo_inventario: string
    filtros?: FiltrosRelatorio
    dados?: any
    arquivo_url?: string
    formato: 'json' | 'csv' | 'excel' | 'pdf'
    total_registros: number
    usuario_criacao: string
    data_inicio: string
    data_conclusao?: string
    tempo_processamento_ms?: number
    tamanho_arquivo_kb?: number
    observacoes?: string
    created_at: string
    updated_at: string
  }
  
  export type TipoRelatorio = 
    | 'inventario_completo'
    | 'contagens_por_loja' 
    | 'contagens_por_cd'
    | 'ativos_em_transito'
    | 'comparativo_contagens'
    | 'divergencias'
    | 'resumo_executivo'
  
  export interface FiltrosRelatorio {
    tipo_contagem?: 'loja' | 'cd' | 'fornecedor' | 'transito' | 'todos'
    loja_especifica?: string[]
    setor_cd_especifico?: string[]
    ativo_especifico?: string[]
    data_inicio?: string
    data_fim?: string
    responsavel?: string[]
    incluir_zerados?: boolean
    apenas_divergencias?: boolean
    status_inventario?: 'ativo' | 'finalizado' | 'todos'
  }
  
  export interface CreateRelatorioRequest {
    nome: string
    tipo: TipoRelatorio
    formato: 'json' | 'csv' | 'excel' | 'pdf'
    filtros?: FiltrosRelatorio
    usuario_criacao: string
    observacoes?: string
  }
  
  export interface RelatorioTemplate {
    id: string
    nome: string
    descricao?: string
    tipo_base: TipoRelatorio
    configuracao: FiltrosRelatorio
    ativo: boolean
    publico: boolean
    usuario_criacao: string
    created_at: string
    updated_at: string
  }
  
  export interface RelatorioResponse {
    success: boolean
    data?: Relatorio | Relatorio[]
    error?: string
  }
  
  export interface TemplateResponse {
    success: boolean
    data?: RelatorioTemplate | RelatorioTemplate[]
    error?: string
  }
  
  export interface DadosInventarioCompleto {
    inventario: {
      codigo: string
      status: string
      responsavel: string
      data_criacao: string
    }
    estatisticas: {
      total_contagens: number
      total_ativos_contados: number
      total_lojas_contadas: number
      total_setores_cd_contados: number
      total_quantidade_geral: number
    }
    contagens_por_tipo: {
      loja: number
      cd: number
      fornecedor: number
      transito: number
    }
    detalhes_contagens: any[]
  }
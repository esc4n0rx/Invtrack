// types/inventory-finalization.ts
export interface FinalizacaoInventario {
    id: string
    codigo_inventario: string
    data_finalizacao: string
    usuario_finalizacao: string
    arquivo_excel_url?: string
    total_hb_618: number
    total_hb_623: number
    total_hb_geral: number
    total_hnt_g: number
    total_hnt_p: number
    total_hnt_geral: number
    total_lojas_hb: number
    total_lojas_hnt: number
    total_cd_es_hb: number
    total_cd_es_hnt: number
    total_cd_sp_hb: number
    total_cd_sp_hnt: number
    total_cd_rj_hb: number
    total_cd_rj_hnt: number
    dados_completos: any
    created_at: string
  }
  
  export interface DadosFinalizacao {
    // Dados do inventário
    inventario: {
      codigo: string
      responsavel: string
      data_criacao: string
      data_finalizacao: string
    }
    
    // Dados HB
    inventario_hb: {
      lojas: Array<{
        nome: string
        total_618: number
        total_623: number
        total_geral: number
      }>
      cd_espirito_santo: {
        estoque: {
          total_618: number
          total_623: number
          total_geral: number
        }
        fornecedor: {
          total_618: number
          total_623: number
          total_geral: number
        }
        transito: {
          total_618: number
          total_623: number
          total_geral: number
        }
        total_cd: {
          total_618: number
          total_623: number
          total_geral: number
        }
      }
      cd_sao_paulo: {
        estoque: {
          total_618: number
          total_623: number
          total_geral: number
        }
        fornecedor: {
          total_618: number
          total_623: number
          total_geral: number
        }
        transito: {
          total_618: number
          total_623: number
          total_geral: number
        }
        total_cd: {
          total_618: number
          total_623: number
          total_geral: number
        }
      }
      cd_rio: {
        estoque: {
          setores_normais: {
            total_618: number
            total_623: number
            total_geral: number
          }
          central_producao: {
            total_618: number
            total_623: number
            total_geral: number
          }
          total_estoque: {
            total_618: number
            total_623: number
            total_geral: number
          }
        }
        fornecedor: {
          total_618: number
          total_623: number
          total_geral: number
        }
        total_cd: {
          total_618: number
          total_623: number
          total_geral: number
        }
      }
      totais_gerais: {
        total_618: number
        total_623: number
        total_geral: number
      }
    }
    
    // Dados HNT (mesma estrutura que HB)
    inventario_hnt: {
      lojas: Array<{
        nome: string
        total_g: number
        total_p: number
        total_geral: number
      }>
      cd_espirito_santo: {
        estoque: {
          total_g: number
          total_p: number
          total_geral: number
        }
        fornecedor: {
          total_g: number
          total_p: number
          total_geral: number
        }
        transito: {
          total_g: number
          total_p: number
          total_geral: number
        }
        total_cd: {
          total_g: number
          total_p: number
          total_geral: number
        }
      }
      cd_sao_paulo: {
        estoque: {
          total_g: number
          total_p: number
          total_geral: number
        }
        fornecedor: {
          total_g: number
          total_p: number
          total_geral: number
        }
        transito: {
          total_g: number
          total_p: number
          total_geral: number
        }
        total_cd: {
          total_g: number
          total_p: number
          total_geral: number
        }
      }
      cd_rio: {
        estoque: {
          setores_normais: {
            total_g: number
            total_p: number
            total_geral: number
          }
          central_producao: {
            total_g: number
            total_p: number
            total_geral: number
          }
          total_estoque: {
            total_g: number
            total_p: number
            total_geral: number
          }
        }
        fornecedor: {
          total_g: number
          total_p: number
          total_geral: number
        }
        total_cd: {
          total_g: number
          total_p: number
          total_geral: number
        }
      }
      totais_gerais: {
        total_g: number
        total_p: number
        total_geral: number
      }
    }
  }
  
  export interface FinalizacaoRequest {
    codigo_inventario: string
    usuario_finalizacao: string
    finalizar_inventario: boolean // true = finalizar, false = deixar aberto
  }
  
  export interface FinalizacaoResponse {
    success: boolean
    data?: {
      finalizacao: FinalizacaoInventario
      arquivo_excel_url: string
      nome_arquivo: string
    }
    error?: string
  }
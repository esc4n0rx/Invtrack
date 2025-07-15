// lib/integrator-webhook.ts
import { supabaseServer } from '@/lib/supabase'
import { ativos } from '@/data/ativos'

export interface WebhookContagem {
  email: string
  loja_nome?: string
  ativo_nome: string
  quantidade: number
  tipo?: 'loja' | 'cd' | 'fornecedor' | 'transito'
  setor_cd?: string
  cd_origem?: string
  cd_destino?: string
  fornecedor?: string
  obs?: string
}

export interface ProcessWebhookResult {
  processed: number
  duplicates: number
  errors: string[]
}

export async function processWebhookContagem(contagens: WebhookContagem[]): Promise<ProcessWebhookResult> {
  const result: ProcessWebhookResult = {
    processed: 0,
    duplicates: 0,
    errors: []
  }

  // Buscar inventário ativo
  const { data: inventario } = await supabaseServer
    .from('invtrack_inventarios')
    .select('codigo')
    .eq('status', 'ativo')
    .single()

  if (!inventario) {
    result.errors.push('Nenhum inventário ativo encontrado')
    return result
  }

  // Processar cada contagem
  for (let i = 0; i < contagens.length; i++) {
    const contagem = contagens[i]
    
    try {
      // Validar dados obrigatórios
      if (!contagem.email || !contagem.ativo_nome || contagem.quantidade === undefined) {
        result.errors.push(`Contagem ${i + 1}: Dados obrigatórios ausentes (email, ativo_nome, quantidade)`)
        continue
      }

      // Validar ativo
      const ativoEncontrado = ativos.find(a => a.nome === contagem.ativo_nome)
      if (!ativoEncontrado) {
        result.errors.push(`Contagem ${i + 1}: Ativo não encontrado: ${contagem.ativo_nome}`)
        continue
      }

      // Determinar tipo se não fornecido
      let tipo = contagem.tipo
      if (!tipo) {
        if (contagem.cd_origem && contagem.cd_destino) {
          tipo = 'transito'
        } else if (contagem.setor_cd) {
          tipo = 'cd'
        } else if (contagem.fornecedor) {
          tipo = 'fornecedor'
        } else {
          tipo = 'loja'
        }
      }

      // Preparar dados para inserção
      const dadosContagem: any = {
        tipo,
        ativo: ativoEncontrado.nome,
        quantidade: Math.max(0, Math.floor(contagem.quantidade)),
        codigo_inventario: inventario.codigo,
        responsavel: contagem.email,
        obs: contagem.obs || null,
        loja: contagem.loja_nome || null,
        setor_cd: contagem.setor_cd || null,
        cd_origem: contagem.cd_origem || null,
        cd_destino: contagem.cd_destino || null,
        fornecedor: contagem.fornecedor || null
      }

      // Verificar duplicata
      const { data: existing } = await supabaseServer
        .from('invtrack_contagens')
        .select('id')
        .eq('tipo', dadosContagem.tipo)
        .eq('ativo', dadosContagem.ativo)
        .eq('codigo_inventario', dadosContagem.codigo_inventario)
        .eq('responsavel', dadosContagem.responsavel)
        .eq('loja', dadosContagem.loja)
        .eq('setor_cd', dadosContagem.setor_cd)
        .eq('cd_origem', dadosContagem.cd_origem)
        .eq('cd_destino', dadosContagem.cd_destino)
        .eq('fornecedor', dadosContagem.fornecedor)
        .single()

      if (existing) {
        result.duplicates++
        continue
      }

      // Inserir contagem
      const { error: insertError } = await supabaseServer
        .from('invtrack_contagens')
        .insert(dadosContagem)

      if (insertError) {
        result.errors.push(`Contagem ${i + 1}: ${insertError.message}`)
        continue
      }

      result.processed++

    } catch (error) {
      result.errors.push(`Contagem ${i + 1}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  return result
}
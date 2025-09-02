// lib/integrator-webhook.ts
import { supabaseServer } from '@/lib/supabase'
import { processRecordWithDeduplication } from '@/lib/integrator-deduplication'

export interface WebhookProcessResult {
  processed: number
  duplicates: number
  errors: string[]
}

export async function processWebhookContagem(contagensData: any[]): Promise<WebhookProcessResult> {
  const result: WebhookProcessResult = {
    processed: 0,
    duplicates: 0,
    errors: []
  }

  // Buscar inventário ativo
  const { data: inventarioAtivo, error: errorInventario } = await supabaseServer
    .from('invtrack_inventarios')
    .select('codigo')
    .eq('status', 'ativo')
    .single()

  if (errorInventario || !inventarioAtivo) {
    result.errors.push('Nenhum inventário ativo encontrado')
    return result
  }

  for (let i = 0; i < contagensData.length; i++) {
    const contagemData = contagensData[i]

    try {
      // Validação básica
      if (!contagemData.tipo || !contagemData.ativo || typeof contagemData.quantidade !== 'number' || !contagemData.responsavel) {
        result.errors.push(`Contagem ${i + 1}: Dados obrigatórios não informados`)
        continue
      }

      // Preparar dados da contagem
      const dadosContagem = {
        tipo: contagemData.tipo,
        ativo: contagemData.ativo,
        quantidade: contagemData.quantidade,
        codigo_inventario: inventarioAtivo.codigo,
        responsavel: contagemData.responsavel.trim(),
        obs: contagemData.obs?.trim() || null,
        loja: contagemData.loja?.trim() || null,
        setor_cd: contagemData.setor_cd?.trim() || null,
        cd_origem: contagemData.cd_origem?.trim() || null,
        cd_destino: contagemData.cd_destino?.trim() || null,
        fornecedor: contagemData.fornecedor?.trim() || null
      }

      // Processar com deduplicação
      const processResult = await processRecordWithDeduplication(dadosContagem, 'webhook')

      if (processResult.success) {
        result.processed++
      } else if (processResult.isDuplicate) {
        result.duplicates++
      } else {
        result.errors.push(`Contagem ${i + 1}: ${processResult.error || 'Erro desconhecido'}`)
      }

    } catch (error) {
      result.errors.push(`Contagem ${i + 1}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  return result
}
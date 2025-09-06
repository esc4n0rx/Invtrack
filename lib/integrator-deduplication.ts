// lib/integrator-deduplication.ts
import { createHash } from 'crypto'
import { supabaseServer } from '@/lib/supabase'

export interface IntegrationRecord {
  tipo: string
  ativo: string
  quantidade: number
  loja?: string | null
  setor_cd?: string | null
  cd_origem?: string | null
  cd_destino?: string | null
  fornecedor?: string | null
  responsavel: string
  codigo_inventario: string
  obs?: string | null
}

export interface DeduplicationResult {
  isDuplicate: boolean
  recordHash: string
  reason?: string
}

/**
 * Gera uma chave única (hash) baseada nos campos principais de uma contagem
 * A chave combina: inventário + tipo + ativo + localização + responsável
 * A quantidade não é incluída para evitar que correções (mesmo item, quantidade diferente) sejam inseridas como duplicatas.
 * Em vez disso, a lógica deve ser de UPSERT. Se o registro já existe, ele é atualizado.
 */
export function generateRecordHash(record: IntegrationRecord): string {
  const normalize = (str: string | null | undefined): string => (str || '').trim().toLowerCase()

  const keyParts = [
    normalize(record.codigo_inventario),
    normalize(record.tipo),
    normalize(record.ativo),
    normalize(record.loja),
    normalize(record.setor_cd),
    normalize(record.cd_origem),
    normalize(record.cd_destino),
    normalize(record.fornecedor),
    normalize(record.responsavel)
  ].join('|')
  
  return createHash('sha256').update(keyParts, 'utf8').digest('hex')
}

/**
 * Verifica se um registro já foi processado baseado no hash
 */
export async function checkDuplicateRecord(
  recordHash: string
): Promise<DeduplicationResult> {
  try {
    const { data: existing, error } = await supabaseServer
      .from('invtrack_integrator_processed')
      .select('id, processed_at, source_table')
      .eq('record_hash', recordHash)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = não encontrado
      console.error('Erro ao verificar duplicata:', error)
      return { isDuplicate: false, recordHash, reason: 'Erro na verificação' }
    }

    if (existing) {
      return {
        isDuplicate: true,
        recordHash,
        reason: `Registro já processado em ${existing.processed_at} via ${existing.source_table}`
      }
    }

    return { isDuplicate: false, recordHash }
  } catch (error) {
    console.error('Erro ao verificar duplicata:', error)
    return { isDuplicate: false, recordHash, reason: 'Erro na verificação' }
  }
}

/**
 * Marca um registro como processado
 */
export async function markRecordAsProcessed(
  recordHash: string,
  sourceTable: 'contagens' | 'contagens_transito' | 'webhook',
  sourceId: number | null,
  codigoInventario: string,
  integrationDetails?: any
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabaseServer
      .from('invtrack_integrator_processed')
      .insert({
        record_hash: recordHash,
        source_table: sourceTable,
        source_id: sourceId,
        codigo_inventario: codigoInventario,
        integration_details: integrationDetails || null
      })

    if (error) {
      // Se for erro de duplicata no hash, não é problema (registro já marcado)
      if (error.code === '23505') {
        return { success: true }
      }
      console.error('Erro ao marcar como processado:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Erro ao marcar como processado:', error)
    return { success: false, error: 'Erro interno' }
  }
}

/**
 * Processa um registro, evitando duplicatas com uma lógica de UPSERT.
 */
export async function processRecordWithDeduplication(
  record: IntegrationRecord,
  sourceTable: 'contagens' | 'contagens_transito' | 'webhook',
  sourceId: number | null = null
): Promise<{
  success: boolean
  isDuplicate: boolean
  recordHash: string
  error?: string
  reason?: string
}> {
  const recordHash = generateRecordHash(record)

  // 1. Verificar na tabela de tracking se já processamos este hash
  const duplicationCheck = await checkDuplicateRecord(recordHash)
  if (duplicationCheck.isDuplicate) {
    return {
      success: false,
      isDuplicate: true,
      recordHash,
      reason: duplicationCheck.reason
    }
  }

  try {
    // 2. Tentar inserir ou atualizar (UPSERT) o registro na tabela principal
    const { error: upsertError } = await supabaseServer
      .from('invtrack_contagens')
      .upsert({
        codigo_inventario: record.codigo_inventario,
        tipo: record.tipo,
        ativo: record.ativo,
        loja: record.loja,
        setor_cd: record.setor_cd,
        cd_origem: record.cd_origem,
        cd_destino: record.cd_destino,
        fornecedor: record.fornecedor,
        responsavel: record.responsavel,
        quantidade: record.quantidade,
        obs: record.obs
      }, {
        onConflict: 'codigo_inventario, tipo, ativo, loja, setor_cd, cd_origem, cd_destino, fornecedor, responsavel',
      })

    if (upsertError) {
      return {
        success: false,
        isDuplicate: false,
        recordHash,
        error: upsertError.message
      }
    }

    // 3. Marcar como processado na tabela de tracking
    await markRecordAsProcessed(recordHash, sourceTable, sourceId, record.codigo_inventario, {
      inserted_at: new Date().toISOString(),
      record_data: record
    })

    return {
      success: true,
      isDuplicate: false,
      recordHash
    }

  } catch (error) {
    return {
      success: false,
      isDuplicate: false,
      recordHash,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

/**
 * Função utilitária para limpeza de registros antigos
 */
export async function cleanupOldProcessedRecords(): Promise<{
  success: boolean
  deletedCount?: number
  error?: string
}> {
  try {
    const { error } = await supabaseServer.rpc('cleanup_integrator_processed')
    
    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}
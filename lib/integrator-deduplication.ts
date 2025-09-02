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
 * A chave combina: tipo + ativo + quantidade + localização + responsável + inventário
 */
export function generateRecordHash(record: IntegrationRecord): string {
  // Normalizar campos para evitar diferenças por espaços ou case
  const normalizeString = (str: string | null | undefined): string => {
    if (!str) return ''
    return str.toString().trim().toLowerCase().replace(/\s+/g, ' ')
  }

  const normalizeNumber = (num: number | null | undefined): string => {
    if (num === null || num === undefined) return '0'
    return num.toString()
  }

  // Campos-chave para gerar o hash
  const keyParts = [
    normalizeString(record.codigo_inventario),
    normalizeString(record.tipo),
    normalizeString(record.ativo),
    normalizeNumber(record.quantidade),
    normalizeString(record.loja),
    normalizeString(record.setor_cd),
    normalizeString(record.cd_origem),
    normalizeString(record.cd_destino),
    normalizeString(record.fornecedor),
    normalizeString(record.responsavel)
  ]

  // Gerar chave única combinando todos os campos
  const combinedKey = keyParts.join('|')
  
  // Gerar hash SHA-256
  return createHash('sha256').update(combinedKey, 'utf8').digest('hex')
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
 * Verifica e processa um registro, evitando duplicatas
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

  // Verificar duplicata
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
    // Tentar inserir o registro na tabela principal
    const { error: insertError } = await supabaseServer
      .from('invtrack_contagens')
      .insert({
        tipo: record.tipo as any,
        ativo: record.ativo,
        quantidade: record.quantidade,
        codigo_inventario: record.codigo_inventario,
        responsavel: record.responsavel,
        obs: record.obs || null,
        loja: record.loja || null,
        setor_cd: record.setor_cd || null,
        cd_origem: record.cd_origem || null,
        cd_destino: record.cd_destino || null,
        fornecedor: record.fornecedor || null
      })

    if (insertError) {
      // Se for erro de constraint única, marcar como processado mesmo assim
      if (insertError.code === '23505') {
        await markRecordAsProcessed(recordHash, sourceTable, sourceId, record.codigo_inventario)
        return {
          success: false,
          isDuplicate: true,
          recordHash,
          reason: 'Registro já existe na tabela principal (constraint única)'
        }
      }
      
      return {
        success: false,
        isDuplicate: false,
        recordHash,
        error: insertError.message
      }
    }

    // Marcar como processado
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
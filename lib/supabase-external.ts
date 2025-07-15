// lib/supabase-external.ts (atualizado com função única)
import { createClient } from '@supabase/supabase-js'

const externalSupabaseUrl = process.env.EXTERNAL_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!
const externalSupabaseKey = process.env.EXTERNAL_SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabaseExternal = createClient(externalSupabaseUrl, externalSupabaseKey, {
  auth: {
    persistSession: false
  }
})

export interface ExternalContagem {
  id: number
  email: string
  loja_nome: string
  ativo_nome: string
  quantidade: number
  created_at: string
}

export interface ExternalContagemTransito {
  id: number
  email: string
  loja_nome: string
  ativo_nome: string
  quantidade: number
  created_at: string
}

export interface TableStatus {
  table_name: string
  total_records: number
  processed_records: number
  unprocessed_records: number
  last_id: number
  oldest_date: string
  newest_date: string
}

export interface RecordCheck {
  id: number
  email: string
  processado: boolean
  exists_in_table: boolean
}

/**
 * Busca novas contagens usando função RPC simplificada
 */
export async function fetchNewContagens(lastProcessedId: number = 0) {
  try {
    console.log(`Buscando contagens a partir do ID: ${lastProcessedId}`)
    
    const { data, error } = await supabaseExternal
      .rpc('fetch_contagens_simplified', { last_id: lastProcessedId })

    if (error) {
      console.error('Erro ao buscar contagens via RPC:', error)
      console.log('Tentando método fallback...')
      return await fetchExternalContagens()
    }

    console.log(`Encontradas ${data?.length || 0} contagens não processadas`)
    return { data: data as ExternalContagem[], error: null }
  } catch (error) {
    console.error('Erro na função fetchNewContagens:', error)
    return await fetchExternalContagens()
  }
}

/**
 * Busca novas contagens de trânsito usando função RPC simplificada
 */
export async function fetchNewContagensTransito(lastProcessedId: number = 0) {
  try {
    console.log(`Buscando contagens de trânsito a partir do ID: ${lastProcessedId}`)
    
    const { data, error } = await supabaseExternal
      .rpc('fetch_contagens_transito_simplified', { last_id: lastProcessedId })

    if (error) {
      console.error('Erro ao buscar contagens de trânsito via RPC:', error)
      console.log('Tentando método fallback...')
      return await fetchExternalContagensTransito()
    }

    console.log(`Encontradas ${data?.length || 0} contagens de trânsito não processadas`)
    return { data: data as ExternalContagemTransito[], error: null }
  } catch (error) {
    console.error('Erro na função fetchNewContagensTransito:', error)
    return await fetchExternalContagensTransito()
  }
}

/**
 * Verifica registros antes de marcar como processados
 */
export async function checkRecordsBeforeMark(tableName: 'contagens' | 'contagens_transito', recordIds: number[]) {
  try {
    console.log(`Verificando ${recordIds.length} registros na tabela ${tableName} antes de marcar`)
    
    const { data, error } = await supabaseExternal
      .rpc('check_records_before_mark', { 
        target_table_name: tableName, 
        ids_to_check: recordIds.slice(0, 10) // Verificar apenas primeiros 10 para debug
      })

    if (error) {
      console.error('Erro ao verificar registros:', error)
      return { data: null, error }
    }

    console.log(`Verificação concluída: ${data?.length || 0} registros encontrados`)
    return { data: data as RecordCheck[], error: null }
  } catch (error) {
    console.error('Erro na função checkRecordsBeforeMark:', error)
    return { data: null, error }
  }
}

/**
 * Marca registros como processados usando função única
 */
export async function markRecordsAsProcessed(tableName: 'contagens' | 'contagens_transito', recordIds: number[]) {
  try {
    console.log(`Marcando ${recordIds.length} registros como processados na tabela ${tableName}`)
    
    // Verificar alguns registros antes de marcar (para debug)
    const checkResult = await checkRecordsBeforeMark(tableName, recordIds.slice(0, 5))
    if (checkResult.data) {
      console.log('Amostra de registros a serem marcados:', checkResult.data)
    }
    
    // Marcar registros como processados
    const { data, error } = await supabaseExternal
      .rpc('integrator_mark_processed', { 
        target_table_name: tableName, 
        ids_to_mark: recordIds 
      })

    if (error) {
      console.error('Erro ao marcar registros como processados:', error)
      
      // Tentar método fallback (atualização direta)
      console.log('Tentando método fallback para marcação...')
      return await markRecordsDirectly(tableName, recordIds)
    }

    console.log(`${data} registros marcados como processados com sucesso`)
    return { success: true, updatedCount: data }
  } catch (error) {
    console.error('Erro na função markRecordsAsProcessed:', error)
    return await markRecordsDirectly(tableName, recordIds)
  }
}

/**
 * Fallback: marca registros diretamente sem RPC
 */
async function markRecordsDirectly(tableName: 'contagens' | 'contagens_transito', recordIds: number[]) {
  try {
    console.log(`Usando método direto para marcar ${recordIds.length} registros na tabela ${tableName}`)
    
    const { data, error } = await supabaseExternal
      .from(tableName)
      .update({ 
        processado: true, 
        processed_at: new Date().toISOString() 
      })
      .in('id', recordIds)

    if (error) {
      console.error('Erro no método direto:', error)
      return { success: false, error }
    }

    console.log(`Método direto: registros marcados com sucesso`)
    return { success: true, updatedCount: recordIds.length }
  } catch (error) {
    console.error('Erro no método direto:', error)
    return { success: false, error }
  }
}

/**
 * Testa a função de marcação sem executar mudanças
 */
export async function testMarkFunction(tableName: 'contagens' | 'contagens_transito', recordIds: number[]) {
  try {
    const { data, error } = await supabaseExternal
      .rpc('test_mark_function', { 
        test_table: tableName, 
        test_ids: recordIds.slice(0, 5) 
      })

    if (error) {
      console.error('Erro no teste da função:', error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Erro na função testMarkFunction:', error)
    return { data: null, error }
  }
}

/**
 * Busca status das tabelas
 */
export async function getTableStatus() {
  try {
    const { data, error } = await supabaseExternal
      .rpc('get_table_status')

    if (error) {
      console.error('Erro ao buscar status das tabelas:', error)
      return { data: null, error }
    }

    return { data: data as TableStatus[], error: null }
  } catch (error) {
    console.error('Erro na função getTableStatus:', error)
    return { data: null, error }
  }
}

/**
 * Fallback: busca contagens pelo método direto
 */
export async function fetchExternalContagens(lastSync?: Date) {
  console.log('Usando método fallback para buscar contagens')
  
  try {
    let query = supabaseExternal
      .from('contagens')
      .select('id, email, loja_nome, ativo_nome, quantidade, created_at')
      .order('id', { ascending: true })
      .limit(1000)

    query = query.or('processado.is.null,processado.eq.false')

    if (lastSync) {
      query = query.gte('created_at', lastSync.toISOString().split('T')[0])
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro no método fallback:', error)
      return { data: null, error }
    }

    console.log(`Método fallback encontrou ${data?.length || 0} contagens`)
    return { data: data as ExternalContagem[], error: null }
  } catch (error) {
    console.error('Erro no método fallback:', error)
    return { data: null, error }
  }
}

/**
 * Fallback: busca contagens de trânsito pelo método direto
 */
export async function fetchExternalContagensTransito(lastSync?: Date) {
  console.log('Usando método fallback para buscar contagens de trânsito')
  
  try {
    let query = supabaseExternal
      .from('contagens_transito')
      .select('id, email, loja_nome, ativo_nome, quantidade, created_at')
      .order('id', { ascending: true })
      .limit(1000)

    query = query.or('processado.is.null,processado.eq.false')

    if (lastSync) {
      query = query.gte('created_at', lastSync.toISOString().split('T')[0])
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro no método fallback:', error)
      return { data: null, error }
    }

    console.log(`Método fallback encontrou ${data?.length || 0} contagens de trânsito`)
    return { data: data as ExternalContagemTransito[], error: null }
  } catch (error) {
    console.error('Erro no método fallback:', error)
    return { data: null, error }
  }
}

/**
 * Função para testar todas as funcionalidades
 */
export async function testExternalConnection() {
  try {
    // Testar conexão básica
    const { data: contagens, error: contagensError } = await supabaseExternal
      .from('contagens')
      .select('count(*)')
      .limit(1)

    const { data: transit, error: transitError } = await supabaseExternal
      .from('contagens_transito')
      .select('count(*)')
      .limit(1)

    // Testar funções RPC
    const { data: statusData, error: statusError } = await getTableStatus()

    // Testar função de marcação
    const { data: testMarkData, error: testMarkError } = await testMarkFunction('contagens', [1, 2, 3])

    // Testar busca RPC
    const { data: rpcContagens, error: rpcError } = await fetchNewContagens(0)

    return {
      success: !contagensError && !transitError && !statusError,
      details: {
        contagens_accessible: !contagensError,
        transito_accessible: !transitError,
        rpc_functions_working: !statusError,
        mark_function_working: !testMarkError,
        rpc_fetch_working: !rpcError,
        status_data: statusData,
        test_mark_result: testMarkData,
        rpc_test_count: rpcContagens?.length || 0
      },
      errors: {
        contagens: contagensError,
        transito: transitError,
        status: statusError,
        test_mark: testMarkError,
        rpc_fetch: rpcError
      }
    }
  } catch (error) {
    return {
      success: false,
      details: null,
      errors: { general: error }
    }
  }
}
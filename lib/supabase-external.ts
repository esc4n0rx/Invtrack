// lib/supabase-external.ts
import { createClient } from '@supabase/supabase-js'

// Cliente específico para as tabelas externas
// Usar variáveis de ambiente específicas para o sistema externo
const externalSupabaseUrl = process.env.EXTERNAL_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!
const externalSupabaseKey = process.env.EXTERNAL_SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabaseExternal = createClient(externalSupabaseUrl, externalSupabaseKey, {
  auth: {
    persistSession: false
  }
})

/**
 * Busca novas contagens da tabela externa 'contagens'
 */
export async function fetchExternalContagens(lastSync?: Date) {
  let query = supabaseExternal
    .from('contagens')
    .select('email, loja_nome, ativo_nome, quantidade, created_at')
    .order('created_at', { ascending: true })

  if (lastSync) {
    query = query.gt('created_at', lastSync.toISOString())
  }

  return query
}

/**
 * Busca novas contagens de trânsito da tabela externa 'contagens_transito'
 */
export async function fetchExternalContagensTransito(lastSync?: Date) {
  let query = supabaseExternal
    .from('contagens_transito')
    .select('email, loja_nome, ativo_nome, quantidade, created_at')
    .order('created_at', { ascending: true })

  if (lastSync) {
    query = query.gt('created_at', lastSync.toISOString())
  }

  return query
}

/**
 * Marca contagens como processadas (opcional - pode adicionar campo 'processado')
 */
export async function markAsProcessed(tableName: string, ids: string[]) {
  return supabaseExternal
    .from(tableName)
    .update({ processado: true })
    .in('id', ids)
}
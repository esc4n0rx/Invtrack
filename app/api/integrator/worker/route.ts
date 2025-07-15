// app/api/integrator/worker/route.ts (corrigido)
import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'
import { startOptimizedSyncProcess } from '../sync/route'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Verificar se o integrador está ativo
    const { data: config } = await supabaseServer
      .from('invtrack_integrator_config')
      .select('*')
      .eq('id', 1)
      .single()

    if (!config || !config.is_active) {
      return NextResponse.json({
        success: false,
        message: 'Integrador não está ativo'
      })
    }

    // Verificar tempo da última sincronização
    const now = new Date()
    const lastSync = config.last_sync ? new Date(config.last_sync) : null
    const intervalMs = (config.interval_seconds || 30) * 1000

    if (lastSync && (now.getTime() - lastSync.getTime()) < intervalMs) {
      return NextResponse.json({
        success: false,
        message: 'Ainda não é hora da próxima sincronização'
      })
    }

    // Executar sincronização
    const result = await startOptimizedSyncProcess()
    const duration = Date.now() - startTime

    // Atualizar última sincronização e contadores
    await supabaseServer
      .from('invtrack_integrator_config')
      .update({
        last_sync: now.toISOString(),
        total_processed: (config.total_processed || 0) + result.processed,
        error_count: result.errors.length > 0 ? (config.error_count || 0) + 1 : config.error_count,
        updated_at: now.toISOString()
      })
      .eq('id', 1)

    // Atualizar estatísticas com duração real
    if (result.processed > 0) {
      await supabaseServer
        .from('invtrack_sync_stats')
        .update({ sync_duration_ms: duration })
        .eq('table_name', 'both')
        .order('sync_timestamp', { ascending: false })
        .limit(1)
    }

    return NextResponse.json({
      success: true,
      processed: result.processed,
      errors: result.errors.length,
      duration
    })

  } catch (error) {
    const duration = Date.now() - startTime
    console.error('Erro no worker do integrador:', error)
    
    // Log do erro
    await supabaseServer
      .from('invtrack_integrator_logs')
      .insert({
        type: 'error',
        message: 'Erro no worker do integrador',
        details: { 
          error: error?.message || error,
          duration 
        }
      })

    return NextResponse.json({
      success: false,
      error: 'Erro interno',
      duration
    }, { status: 500 })
  }
}
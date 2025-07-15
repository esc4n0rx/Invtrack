// app/api/integrator/worker/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'
import { startSyncProcess } from '../sync/route'

export async function POST(request: NextRequest) {
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
    const result = await startSyncProcess()

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

    // Disparar evento de atualização para frontends conectados
    if (result.processed > 0) {
      await supabaseServer
        .from('invtrack_integrator_events')
        .insert({
          event_type: 'new_integration',
          processed_count: result.processed,
          timestamp: now.toISOString()
        })
    }

    return NextResponse.json({
      success: true,
      processed: result.processed,
      errors: result.errors.length
    })

  } catch (error) {
    console.error('Erro no worker do integrador:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno'
    }, { status: 500 })
  }
}
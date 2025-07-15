// app/api/integrator/stats/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'

export async function GET() {
  try {
    // Buscar estatísticas dos logs de webhook
    const { data: webhookLogs, error } = await supabaseServer
      .from('invtrack_webhook_logs')
      .select('response_status, processing_time_ms, contagens_created')

    if (error) {
      return NextResponse.json({
        success: false,
        error: 'Erro ao buscar estatísticas'
      }, { status: 500 })
    }

    const totalRequests = webhookLogs.length
    const successfulRequests = webhookLogs.filter(log => log.response_status >= 200 && log.response_status < 300).length
    const failedRequests = totalRequests - successfulRequests
    const averageProcessingTime = totalRequests > 0 
      ? Math.round(webhookLogs.reduce((sum, log) => sum + (log.processing_time_ms || 0), 0) / totalRequests)
      : 0
    const totalContagensCreated = webhookLogs.reduce((sum, log) => sum + (log.contagens_created || 0), 0)

    const stats = {
      totalRequests,
      successfulRequests,
      failedRequests,
      averageProcessingTime,
      totalContagensCreated
    }

    return NextResponse.json({
      success: true,
      stats
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}
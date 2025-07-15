// app/api/integrator/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'
import { processWebhookContagem } from '@/lib/integrator-webhook'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  let tokenUsed = ''
  let requestData: any = {}
  
  try {
    // Verificar se integrador está ativo
    const { data: config } = await supabaseServer
      .from('invtrack_integrator_config')
      .select('is_active')
      .eq('id', 1)
      .single()

    if (!config?.is_active) {
      return NextResponse.json({
        success: false,
        error: 'Integrador não está ativo'
      }, { status: 403 })
    }

    // Verificar token de autorização
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      await logWebhookRequest('', request, {}, 401, Date.now() - startTime, 0, ['Token não fornecido'])
      return NextResponse.json({
        success: false,
        error: 'Token de autorização necessário'
      }, { status: 401 })
    }

    tokenUsed = authHeader.split(' ')[1]

    // Validar token
    const { data: tokenRecord } = await supabaseServer
      .from('invtrack_webhook_tokens')
      .select('*')
      .eq('token', tokenUsed)
      .eq('is_active', true)
      .single()

    if (!tokenRecord) {
      await logWebhookRequest(tokenUsed, request, {}, 401, Date.now() - startTime, 0, ['Token inválido'])
      return NextResponse.json({
        success: false,
        error: 'Token inválido'
      }, { status: 401 })
    }

    // Atualizar estatísticas do token
    await supabaseServer
      .from('invtrack_webhook_tokens')
      .update({
        last_used: new Date().toISOString(),
        requests_count: tokenRecord.requests_count + 1
      })
      .eq('id', tokenRecord.id)

    // Ler dados do corpo da requisição
    requestData = await request.json()

    // Validar estrutura dos dados
    if (!requestData.contagens || !Array.isArray(requestData.contagens)) {
      await logWebhookRequest(tokenUsed, request, requestData, 400, Date.now() - startTime, 0, ['Estrutura de dados inválida'])
      return NextResponse.json({
        success: false,
        error: 'Estrutura de dados inválida. Esperado: { contagens: [...] }'
      }, { status: 400 })
    }

    // Processar contagens
    const result = await processWebhookContagem(requestData.contagens)
    const processingTime = Date.now() - startTime

    // Log da requisição
    await logWebhookRequest(
      tokenUsed, 
      request, 
      requestData, 
      200, 
      processingTime, 
      result.processed,
      result.errors
    )

    // Log no integrador
    await supabaseServer
      .from('invtrack_integrator_logs')
      .insert({
        type: result.errors.length > 0 ? 'warning' : 'success',
        message: `Webhook processado: ${result.processed} contagens criadas`,
        details: {
          processed: result.processed,
          duplicates: result.duplicates,
          errors: result.errors,
          processing_time_ms: processingTime
        },
        processed_count: result.processed
      })

    // Atualizar estatísticas do integrador
    const { data: currentConfig } = await supabaseServer
      .from('invtrack_integrator_config')
      .select('total_processed, error_count')
      .eq('id', 1)
      .single()

    await supabaseServer
      .from('invtrack_integrator_config')
      .update({
        total_processed: (currentConfig?.total_processed || 0) + result.processed,
        error_count: (currentConfig?.error_count || 0) + result.errors.length,
        last_sync: new Date().toISOString()
      })
      .eq('id', 1)

    return NextResponse.json({
      success: true,
      processed: result.processed,
      duplicates: result.duplicates,
      errors: result.errors,
      processing_time_ms: processingTime
    })

  } catch (error) {
    const processingTime = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    
    await logWebhookRequest(
      tokenUsed, 
      request, 
      requestData, 
      500, 
      processingTime, 
      0, 
      [errorMessage]
    )

    console.error('Erro no webhook:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      processing_time_ms: processingTime
    }, { status: 500 })
  }
}

async function logWebhookRequest(
  token: string,
  request: NextRequest,
  data: any,
  status: number,
  processingTime: number,
  contagensCriadas: number,
  errors: string[]
) {
  try {
    await supabaseServer
      .from('invtrack_webhook_logs')
      .insert({
        token_used: token,
        request_ip: request.headers.get('x-forwarded-for') || 'unknown',
        request_data: data,
        response_status: status,
        processing_time_ms: processingTime,
        contagens_created: contagensCriadas,
        errors: errors.length > 0 ? errors : null
      })
  } catch (error) {
    console.error('Erro ao salvar log do webhook:', error)
  }
}
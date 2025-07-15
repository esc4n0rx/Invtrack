// app/api/integrator/reset-sequence/route.ts (corrigido)
import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Resetar os contadores de sequência para 0
    const { error } = await supabaseServer
      .from('invtrack_integrator_config')
      .update({
        last_contagem_id: 0,
        last_transito_id: 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', 1)

    if (error) {
      console.error('Erro ao resetar sequência:', error)
      return NextResponse.json({
        success: false,
        error: 'Erro ao resetar controle de sequência'
      }, { status: 500 })
    }

    // Log da ação
    await supabaseServer
      .from('invtrack_integrator_logs')
      .insert({
        type: 'info',
        message: 'Controle de sequência resetado manualmente',
        details: { 
          action: 'reset_sequence',
          timestamp: new Date().toISOString(),
          reset_values: {
            last_contagem_id: 0,
            last_transito_id: 0
          }
        }
      })

    return NextResponse.json({
      success: true,
      message: 'Controle de sequência resetado com sucesso'
    })

  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}
// app/api/inventarios/toggle-cleanup-cron/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { isActive } = await request.json()

    if (typeof isActive !== 'boolean') {
      return NextResponse.json({
        success: false,
        error: 'O estado "isActive" é obrigatório e deve ser um booleano.'
      }, { status: 400 })
    }

    const { error } = await supabaseServer
      .from('invtrack_integrator_config')
      .update({ is_cleanup_cron_active: isActive })
      .eq('id', 1)

    if (error) {
      console.error('Erro ao atualizar status do cron de limpeza:', error)
      return NextResponse.json({
        success: false,
        error: 'Erro ao atualizar a configuração do job de limpeza.'
      }, { status: 500 })
    }
    
    // Log da alteração
    await supabaseServer.from('invtrack_integrator_logs').insert({
        type: 'info',
        message: `Limpeza automática de duplicatas foi ${isActive ? 'ATIVADA' : 'DESATIVADA'}`,
        details: { toggledBy: 'user_action' }
    });

    return NextResponse.json({
      success: true,
      message: `Limpeza automática ${isActive ? 'ativada' : 'desativada'} com sucesso.`
    })

  } catch (error) {
    console.error('Erro interno na API:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}
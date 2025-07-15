// app/api/integrator/tokens/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabaseServer
      .from('invtrack_webhook_tokens')
      .update({ is_active: false })
      .eq('id', params.id)

    if (error) {
      return NextResponse.json({
        success: false,
        error: 'Erro ao revogar token'
      }, { status: 500 })
    }

    // Log da revogação
    await supabaseServer
      .from('invtrack_integrator_logs')
      .insert({
        type: 'warning',
        message: 'Token de webhook revogado',
        details: { token_id: params.id }
      })

    return NextResponse.json({
      success: true
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}
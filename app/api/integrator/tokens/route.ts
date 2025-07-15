// app/api/integrator/tokens/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'

export async function GET() {
  try {
    const { data: tokens, error } = await supabaseServer
      .from('invtrack_webhook_tokens')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({
        success: false,
        error: 'Erro ao buscar tokens'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      tokens: tokens || []
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}

export async function POST() {
  try {
    // Gerar novo token
    const newToken = require('crypto').randomBytes(32).toString('hex')

    const { data: token, error } = await supabaseServer
      .from('invtrack_webhook_tokens')
      .insert({
        token: newToken,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({
        success: false,
        error: 'Erro ao criar token'
      }, { status: 500 })
    }

    // Log da criação
    await supabaseServer
      .from('invtrack_integrator_logs')
      .insert({
        type: 'info',
        message: 'Novo token de webhook criado',
        details: { token_id: token.id }
      })

    return NextResponse.json({
      success: true,
      token
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}
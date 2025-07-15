// app/api/integrator/logs/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const type = searchParams.get('type')

    let query = supabaseServer
      .from('invtrack_integrator_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (type) {
      query = query.eq('type', type)
    }

    const { data: logs, error } = await query

    if (error) {
      return NextResponse.json({
        success: false,
        error: 'Erro ao buscar logs'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      logs: logs || []
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}
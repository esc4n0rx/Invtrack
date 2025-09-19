// app/api/inventarios/finalizacoes/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const inventario = searchParams.get('inventario')
    const limite = parseInt(searchParams.get('limite') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabaseServer
      .from('invtrack_finalizacoes_inventario')
      .select(`
        id,
        codigo_inventario,
        data_finalizacao,
        usuario_finalizacao,
        arquivo_excel_url,
        total_hb_618,
        total_hb_623,
        total_hb_geral,
        total_hnt_g,
        total_hnt_p,
        total_hnt_geral,
        total_lojas_hb,
        total_lojas_hnt,
        total_cd_es_hb,
        total_cd_es_hnt,
        total_cd_sp_hb,
        total_cd_sp_hnt,
        total_cd_rj_hb,
        total_cd_rj_hnt,
        invtrack_inventarios!inner(
          codigo,
          responsavel,
          created_at,
          status
        )
      `)
      .order('data_finalizacao', { ascending: false })
      .range(offset, offset + limite - 1)

    if (inventario) {
      query = query.eq('codigo_inventario', inventario)
    }

    const { data: finalizacoes, error } = await query

    if (error) {
      console.error('Erro ao buscar finalizações:', error)
      return NextResponse.json({
        success: false,
        error: 'Erro ao buscar finalizações'
      }, { status: 500 })
    }

    const finalizacoesTratadas = (finalizacoes || []).map(finalizacao => ({
      ...finalizacao,
      arquivo_excel_url: finalizacao.arquivo_excel_url && finalizacao.arquivo_excel_url.startsWith('/api/inventarios/download/')
        ? finalizacao.arquivo_excel_url
        : `/api/inventarios/download/${finalizacao.id}`
    }))

    return NextResponse.json({
      success: true,
      data: finalizacoesTratadas
    })

  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}
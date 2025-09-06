// app/api/inventarios/limpar-duplicatas/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { codigo_inventario } = await request.json()

    if (!codigo_inventario) {
      return NextResponse.json({
        success: false,
        error: 'Código do inventário é obrigatório'
      }, { status: 400 })
    }

    const { data, error } = await supabaseServer.rpc('limpar_contagens_duplicadas', {
      p_codigo_inventario: codigo_inventario
    })

    if (error) {
      console.error('Erro ao limpar duplicatas:', error)
      return NextResponse.json({
        success: false,
        error: 'Erro ao executar a limpeza de duplicatas no banco de dados.'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        deletedCount: data
      }
    })

  } catch (error) {
    console.error('Erro interno na API:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}
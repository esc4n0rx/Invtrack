// app/api/inventarios/ativo/route.ts
import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from('invtrack_inventarios')
      .select('*')
      .eq('status', 'ativo')
      .single()

    if (error) {
      if (error.code === 'PGRST116') { // Não encontrado
        return NextResponse.json({
          success: true,
          data: null
        })
      }

      console.error('Erro ao buscar inventário ativo:', error)
      return NextResponse.json({
        success: false,
        error: 'Erro ao buscar inventário ativo'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data
    })

  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}
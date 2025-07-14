// app/api/inventarios/[id]/finalizar/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'ID do inventário é obrigatório'
      }, { status: 400 })
    }

    const { data, error } = await supabaseServer
      .from('invtrack_inventarios')
      .update({
        status: 'finalizado'
      })
      .eq('id', id)
      .eq('status', 'ativo') // Só permite finalizar se estiver ativo
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') { // Não encontrado
        return NextResponse.json({
          success: false,
          error: 'Inventário não encontrado ou já finalizado'
        }, { status: 404 })
      }

      console.error('Erro ao finalizar inventário:', error)
      return NextResponse.json({
        success: false,
        error: 'Erro ao finalizar inventário'
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
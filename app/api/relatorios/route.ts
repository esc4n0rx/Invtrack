import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'
import { CreateRelatorioRequest } from '@/types/relatorio'

export async function POST(request: NextRequest) {
  try {
    const dados: CreateRelatorioRequest = await request.json()

    if (!dados.nome || !dados.tipo || !dados.usuario_criacao) {
      return NextResponse.json({
        success: false,
        error: 'Nome, tipo e usuário são obrigatórios'
      }, { status: 400 })
    }

    const { data: inventarioAtivo, error: errorInventario } = await supabaseServer
      .from('invtrack_inventarios')
      .select('codigo')
      .eq('status', 'ativo')
      .single()

    if (errorInventario || !inventarioAtivo) {
      return NextResponse.json({
        success: false,
        error: 'Nenhum inventário ativo encontrado'
      }, { status: 400 })
    }

    const { data: relatorio, error: errorRelatorio } = await supabaseServer
      .from('invtrack_relatorios')
      .insert({
        nome: dados.nome,
        tipo: dados.tipo,
        codigo_inventario: inventarioAtivo.codigo,
        filtros: dados.filtros || {},
        formato: dados.formato,
        usuario_criacao: dados.usuario_criacao,
        observacoes: dados.observacoes
      })
      .select()
      .single()

    if (errorRelatorio) {
      console.error('Erro ao criar relatório:', errorRelatorio)
      return NextResponse.json({
        success: false,
        error: 'Erro ao criar relatório'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: relatorio
    })

  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const inventario = searchParams.get('inventario')

    if (!inventario) {
      return NextResponse.json({
        success: false,
        error: 'Código do inventário é obrigatório'
      }, { status: 400 })
    }

    const { data, error } = await supabaseServer
      .from('invtrack_relatorios')
      .select('*')
      .eq('codigo_inventario', inventario)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar relatórios:', error)
      return NextResponse.json({
        success: false,
        error: 'Erro ao buscar relatórios'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: data || []
    })

  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabaseServer
      .from('invtrack_relatorio_templates')
      .select('*')
      .eq('ativo', true)
      .order('nome')

    if (error) {
      console.error('Erro ao buscar templates:', error)
      return NextResponse.json({
        success: false,
        error: 'Erro ao buscar templates'
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

export async function POST(request: NextRequest) {
  try {
    const dados = await request.json()

    if (!dados.nome || !dados.tipo_base || !dados.configuracao) {
      return NextResponse.json({
        success: false,
        error: 'Nome, tipo base e configuração são obrigatórios'
      }, { status: 400 })
    }

    const { data: template, error } = await supabaseServer
      .from('invtrack_relatorio_templates')
      .insert({
        nome: dados.nome,
        descricao: dados.descricao,
        tipo_base: dados.tipo_base,
        configuracao: dados.configuracao,
        publico: dados.publico || false,
        usuario_criacao: dados.usuario_criacao
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar template:', error)
      return NextResponse.json({
        success: false,
        error: 'Erro ao criar template'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: template
    })

  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}
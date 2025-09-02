// app/api/contagens/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'
import { CreateContagemRequest } from '@/types/contagem'

export async function POST(request: NextRequest) {
  try {
    const dados: CreateContagemRequest = await request.json()

    // Validação básica
    if (!dados.tipo || !dados.ativo || dados.quantidade < 0 || !dados.responsavel) {
      return NextResponse.json({
        success: false,
        error: 'Dados obrigatórios não informados'
      }, { status: 400 })
    }

    const tiposValidos = ['loja', 'cd', 'fornecedor', 'transito']
    if (!tiposValidos.includes(dados.tipo)) {
      return NextResponse.json({
        success: false,
        error: 'Tipo de contagem inválido'
      }, { status: 400 })
    }


    // Buscar inventário ativo para vincular
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

    // Preparar dados para inserção
    const dadosContagem = {
      tipo: dados.tipo,
      ativo: dados.ativo,
      quantidade: dados.quantidade,
      codigo_inventario: inventarioAtivo.codigo,
      responsavel: dados.responsavel.trim(),
      obs: dados.obs?.trim() || null,
      loja: dados.loja || null,
      setor_cd: dados.setor_cd || null,
      cd_origem: dados.cd_origem || null,
      cd_destino: dados.cd_destino || null,
      fornecedor: dados.fornecedor || null,
    }

    // Tentar inserir no banco
    const { data, error } = await supabaseServer
      .from('invtrack_contagens')
      .insert(dadosContagem)
      .select()
      .single()

    if (error) {
      // Verificar se é erro de duplicata
      if (error.code === '23505') { // UNIQUE constraint violation
        return NextResponse.json({
          success: false,
          error: 'Já existe uma contagem para este ativo neste local/contexto'
        }, { status: 409 })
      }

      console.error('Erro ao criar contagem:', error)
      return NextResponse.json({
        success: false,
        error: 'Erro ao criar contagem'
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const inventario = searchParams.get('inventario')
    const tipo = searchParams.get('tipo')
 
    if (!inventario) {
      return NextResponse.json({
        success: false,
        error: 'Código do inventário é obrigatório'
      }, { status: 400 })
    }
 
    let query = supabaseServer
      .from('invtrack_contagens')
      .select('*')
      .eq('codigo_inventario', inventario)
 
    if (tipo) {
      query = query.eq('tipo', tipo)
    }
 
    const { data, error } = await query.order('data_contagem', { ascending: false })
 
    if (error) {
      console.error('Erro ao buscar contagens:', error)
      return NextResponse.json({
        success: false,
        error: 'Erro ao buscar contagens'
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
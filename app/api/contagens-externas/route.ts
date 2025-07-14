// app/api/contagens-externas/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'
import { CreateContagemExternaRequest } from '@/types/contagem-externa'

export async function POST(request: NextRequest) {
  try {
    const dados: CreateContagemExternaRequest = await request.json()

    // Validação básica
    if (!dados.setor_cd || !dados.contador || !dados.itens || dados.itens.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Dados obrigatórios não informados'
      }, { status: 400 })
    }

    // Validar itens
    for (const item of dados.itens) {
      if (!item.ativo || item.quantidade < 0) {
        return NextResponse.json({
          success: false,
          error: 'Todos os itens devem ter ativo e quantidade válida'
        }, { status: 400 })
      }
    }

    // Buscar inventário ativo
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

    // Verificar quantas contagens já existem para este setor
    const { data: contagensExistentes } = await supabaseServer
      .from('invtrack_contagens_externas')
      .select('numero_contagem')
      .eq('codigo_inventario', inventarioAtivo.codigo)
      .eq('setor_cd', dados.setor_cd)
      .order('numero_contagem', { ascending: false })

    const proximoNumero = contagensExistentes && contagensExistentes.length > 0 
      ? contagensExistentes[0].numero_contagem + 1 
      : 1

    if (proximoNumero > 5) {
      return NextResponse.json({
        success: false,
        error: 'Limite máximo de 5 contagens por setor atingido'
      }, { status: 400 })
    }

    // Verificar se o mesmo contador já fez contagem neste setor
    const { data: contadorExistente } = await supabaseServer
      .from('invtrack_contagens_externas')
      .select('id')
      .eq('codigo_inventario', inventarioAtivo.codigo)
      .eq('setor_cd', dados.setor_cd)
      .eq('contador', dados.contador.trim())
      .single()

    if (contadorExistente) {
      return NextResponse.json({
        success: false,
        error: 'Este contador já realizou uma contagem neste setor'
      }, { status: 409 })
    }

    // Criar contagem externa
    const { data: contagemCriada, error: errorContagem } = await supabaseServer
      .from('invtrack_contagens_externas')
      .insert({
        codigo_inventario: inventarioAtivo.codigo,
        setor_cd: dados.setor_cd,
        contador: dados.contador.trim(),
        obs: dados.obs?.trim() || null,
        numero_contagem: proximoNumero
      })
      .select()
      .single()

    if (errorContagem) {
      console.error('Erro ao criar contagem externa:', errorContagem)
      return NextResponse.json({
        success: false,
        error: 'Erro ao criar contagem externa'
      }, { status: 500 })
    }

    // Criar itens da contagem
    const itensParaInserir = dados.itens.map(item => ({
      contagem_externa_id: contagemCriada.id,
      ativo: item.ativo,
      quantidade: item.quantidade
    }))

    const { error: errorItens } = await supabaseServer
      .from('invtrack_itens_contagem_externa')
      .insert(itensParaInserir)

    if (errorItens) {
      // Rollback: deletar a contagem criada
      await supabaseServer
        .from('invtrack_contagens_externas')
        .delete()
        .eq('id', contagemCriada.id)

      console.error('Erro ao criar itens da contagem:', errorItens)
      return NextResponse.json({
        success: false,
        error: 'Erro ao criar itens da contagem'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: { ...contagemCriada, itens: itensParaInserir }
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
    const setor = searchParams.get('setor')

    if (!inventario) {
      return NextResponse.json({
        success: false,
        error: 'Código do inventário é obrigatório'
      }, { status: 400 })
    }

    let query = supabaseServer
      .from('invtrack_contagens_externas')
      .select(`
        *,
        itens:invtrack_itens_contagem_externa(*)
      `)
      .eq('codigo_inventario', inventario)

    if (setor) {
      query = query.eq('setor_cd', setor)
    }

    const { data, error } = await query.order('setor_cd').order('numero_contagem')

    if (error) {
      console.error('Erro ao buscar contagens externas:', error)
      return NextResponse.json({
        success: false,
        error: 'Erro ao buscar contagens externas'
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
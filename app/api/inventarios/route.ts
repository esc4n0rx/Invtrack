// app/api/inventarios/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'
import { CreateInventarioRequest } from '@/types/inventario'

function gerarCodigoInventario(): string {
  const meses = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ']
  const agora = new Date()
  const mesAtual = meses[agora.getMonth()]
  const numeroAleatorio = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  
  return `INV${mesAtual}-${numeroAleatorio}`
}

export async function POST(request: NextRequest) {
  try {
    const { responsavel }: CreateInventarioRequest = await request.json()

    if (!responsavel || responsavel.trim() === '') {
      return NextResponse.json({
        success: false,
        error: 'Nome do responsável é obrigatório'
      }, { status: 400 })
    }

    // Verificar se já existe um inventário ativo
    const { data: inventarioAtivo, error: errorAtivo } = await supabaseServer
      .from('invtrack_inventarios')
      .select('*')
      .eq('status', 'ativo')
      .single()

    if (errorAtivo && errorAtivo.code !== 'PGRST116') { // PGRST116 = não encontrado
      console.error('Erro ao verificar inventário ativo:', errorAtivo)
      return NextResponse.json({
        success: false,
        error: 'Erro interno do servidor'
      }, { status: 500 })
    }

    if (inventarioAtivo) {
      return NextResponse.json({
        success: false,
        error: 'Já existe um inventário ativo. Finalize-o antes de criar um novo.'
      }, { status: 409 })
    }

    // Gerar código único
    let codigo = gerarCodigoInventario()
    let tentativas = 0
    const maxTentativas = 10

    while (tentativas < maxTentativas) {
      const { data: existeCodigo } = await supabaseServer
        .from('invtrack_inventarios')
        .select('codigo')
        .eq('codigo', codigo)
        .single()

      if (!existeCodigo) {
        break
      }

      codigo = gerarCodigoInventario()
      tentativas++
    }

    if (tentativas >= maxTentativas) {
      return NextResponse.json({
        success: false,
        error: 'Não foi possível gerar um código único. Tente novamente.'
      }, { status: 500 })
    }

    // Criar novo inventário
    const { data, error } = await supabaseServer
      .from('invtrack_inventarios')
      .insert({
        codigo,
        responsavel: responsavel.trim(),
        status: 'ativo'
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar inventário:', error)
      return NextResponse.json({
        success: false,
        error: 'Erro ao criar inventário'
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
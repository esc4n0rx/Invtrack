// app/api/contagens-externas/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const { responsavel } = await request.json()

    if (!responsavel?.trim()) {
      return NextResponse.json({
        success: false,
        error: 'Responsável é obrigatório'
      }, { status: 400 })
    }

    // Buscar contagem externa com itens
    const { data: contagemExterna, error: errorBusca } = await supabaseServer
      .from('invtrack_contagens_externas')
      .select(`
        *,
        itens:invtrack_itens_contagem_externa(*)
      `)
      .eq('id', id)
      .single()

    if (errorBusca || !contagemExterna) {
      return NextResponse.json({
        success: false,
        error: 'Contagem externa não encontrada'
      }, { status: 404 })
    }

    if (contagemExterna.status === 'lançada') {
      return NextResponse.json({
        success: false,
        error: 'Esta contagem já foi lançada'
      }, { status: 400 })
    }

    // Criar contagens na tabela principal
    const contagensParaCriar = contagemExterna.itens.map((item: any) => ({
      tipo: 'cd',
      ativo: item.ativo,
      quantidade: item.quantidade,
      codigo_inventario: contagemExterna.codigo_inventario,
      responsavel: responsavel.trim(),
      obs: contagemExterna.obs || `Contagem externa #${contagemExterna.numero_contagem} por ${contagemExterna.contador}`,
      setor_cd: contagemExterna.setor_cd
    }))

    // Inserir na tabela principal (invtrack_contagens)
    const { error: errorInsert } = await supabaseServer
      .from('invtrack_contagens')
      .insert(contagensParaCriar)

    if (errorInsert) {
      console.error('Erro ao aprovar contagem:', errorInsert)
      return NextResponse.json({
        success: false,
        error: 'Erro ao registrar contagens na tabela principal'
      }, { status: 500 })
    }

    // Marcar contagem externa como aprovada
    const { error: errorUpdate } = await supabaseServer
      .from('invtrack_contagens_externas')
      .update({ status: 'lançada' })
      .eq('id', contagemExterna.id)
    
    if (errorUpdate) {
        console.error('Erro ao atualizar status da contagem externa:', errorUpdate)
        // Mesmo com erro aqui, a operação principal foi um sucesso. Apenas logamos.
    }

    return NextResponse.json({
      success: true,
      message: 'Contagem aprovada e registrada com sucesso'
    })

  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}
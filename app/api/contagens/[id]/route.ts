// app/api/contagens/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'
import { EditContagemRequest, DeleteContagemRequest } from '@/types/contagem'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const { usuario_edicao, motivo_edicao, dados }: EditContagemRequest = await request.json()

    if (!usuario_edicao || !motivo_edicao) {
      return NextResponse.json({
        success: false,
        error: 'Usuário e motivo da edição são obrigatórios'
      }, { status: 400 })
    }

    // Buscar dados atuais para auditoria
    const { data: contagemAtual, error: errorBusca } = await supabaseServer
      .from('invtrack_contagens')
      .select('*')
      .eq('id', id)
      .single()

    if (errorBusca || !contagemAtual) {
      return NextResponse.json({
        success: false,
        error: 'Contagem não encontrada'
      }, { status: 404 })
    }

    // Preparar dados para atualização
    const dadosAtualizacao = dados ? {
      ativo: dados.ativo || contagemAtual.ativo,
      quantidade: dados.quantidade !== undefined ? dados.quantidade : contagemAtual.quantidade,
      responsavel: dados.responsavel || contagemAtual.responsavel,
      obs: dados.obs !== undefined ? dados.obs : contagemAtual.obs,
      loja: dados.loja !== undefined ? dados.loja : contagemAtual.loja,
      setor_cd: dados.setor_cd !== undefined ? dados.setor_cd : contagemAtual.setor_cd,
      cd_origem: dados.cd_origem !== undefined ? dados.cd_origem : contagemAtual.cd_origem,
      cd_destino: dados.cd_destino !== undefined ? dados.cd_destino : contagemAtual.cd_destino,
      fornecedor: dados.fornecedor !== undefined ? dados.fornecedor : contagemAtual.fornecedor,
    } : contagemAtual

    // Atualizar contagem
    const { data: contagemAtualizada, error: errorUpdate } = await supabaseServer
      .from('invtrack_contagens')
      .update(dadosAtualizacao)
      .eq('id', id)
      .select()
      .single()

    if (errorUpdate) {
      console.error('Erro ao atualizar contagem:', errorUpdate)
      return NextResponse.json({
        success: false,
        error: 'Erro ao atualizar contagem'
      }, { status: 500 })
    }

    // Registrar auditoria
    await supabaseServer
      .from('invtrack_contagens_auditoria')
      .insert({
        contagem_id: id,
        acao: 'edicao',
        usuario: usuario_edicao,
        motivo: motivo_edicao,
        dados_anteriores: contagemAtual,
        dados_novos: contagemAtualizada
      })

    return NextResponse.json({
      success: true,
      data: contagemAtualizada
    })

  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const { usuario_exclusao, motivo_exclusao }: DeleteContagemRequest = await request.json()

    if (!usuario_exclusao || !motivo_exclusao) {
      return NextResponse.json({
        success: false,
        error: 'Usuário e motivo da exclusão são obrigatórios'
      }, { status: 400 })
    }

    // Buscar dados atuais para auditoria
    const { data: contagemAtual, error: errorBusca } = await supabaseServer
      .from('invtrack_contagens')
      .select('*')
      .eq('id', id)
      .single()

    if (errorBusca || !contagemAtual) {
      return NextResponse.json({
        success: false,
        error: 'Contagem não encontrada'
      }, { status: 404 })
    }

    // Registrar auditoria antes de deletar
    await supabaseServer
      .from('invtrack_contagens_auditoria')
      .insert({
        contagem_id: id,
        acao: 'exclusao',
        usuario: usuario_exclusao,
        motivo: motivo_exclusao,
        dados_anteriores: contagemAtual,
        dados_novos: null
      })

    // Deletar contagem
    const { error: errorDelete } = await supabaseServer
      .from('invtrack_contagens')
      .delete()
      .eq('id', id)

    if (errorDelete) {
      console.error('Erro ao deletar contagem:', errorDelete)
      return NextResponse.json({
        success: false,
        error: 'Erro ao deletar contagem'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true
    })

  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}
// app/api/inventarios/finalizar-completo/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'
import { processarDadosInventario } from '@/lib/inventory-finalizer'
import { gerarExcelInventario } from '@/lib/excel-generator'
import { FinalizacaoRequest, FinalizacaoResponse } from '@/types/inventory-finalization'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const dados: FinalizacaoRequest = await request.json()
    
    const { codigo_inventario, usuario_finalizacao, finalizar_inventario } = dados

    // Validações
    if (!codigo_inventario || !usuario_finalizacao) {
      return NextResponse.json({
        success: false,
        error: 'Código do inventário e usuário são obrigatórios'
      }, { status: 400 })
    }

    // Verificar se inventário existe e está ativo
    const { data: inventario, error: errorInventario } = await supabaseServer
      .from('invtrack_inventarios')
      .select('*')
      .eq('codigo', codigo_inventario)
      .eq('status', 'ativo')
      .single()

    if (errorInventario || !inventario) {
      return NextResponse.json({
        success: false,
        error: 'Inventário não encontrado ou já finalizado'
      }, { status: 404 })
    }

    // Processar dados do inventário
    const dadosFinalizacao = await processarDadosInventario(codigo_inventario)

    // Gerar Excel (garante que o processo ocorre sem erros)
    await gerarExcelInventario(dadosFinalizacao)

    // Informações do arquivo
    const timestamp = new Date().toISOString().split('T')[0]
    const nomeArquivo = `inventario_${codigo_inventario}_${timestamp}.xlsx`
    const finalizacaoId = randomUUID()
    const arquivoUrl = `/api/inventarios/download/${finalizacaoId}`

    // Calcular totais para salvar no banco
    const totaisHB = dadosFinalizacao.inventario_hb.totais_gerais
    const totaisHNT = dadosFinalizacao.inventario_hnt.totais_gerais
    const totalLojasHB = dadosFinalizacao.inventario_hb.lojas.reduce((acc, loja) => acc + loja.total_geral, 0)
    const totalLojasHNT = dadosFinalizacao.inventario_hnt.lojas.reduce((acc, loja) => acc + loja.total_geral, 0)

    // Salvar finalização no banco
    const { data: finalizacao, error: errorFinalizacao } = await supabaseServer
      .from('invtrack_finalizacoes_inventario')
      .insert({
        id: finalizacaoId,
        codigo_inventario,
        usuario_finalizacao,
        arquivo_excel_url: arquivoUrl,
        total_hb_618: totaisHB.total_618,
        total_hb_623: totaisHB.total_623,
        total_hb_geral: totaisHB.total_geral,
        total_hnt_g: totaisHNT.total_g,
        total_hnt_p: totaisHNT.total_p,
        total_hnt_geral: totaisHNT.total_geral,
        total_lojas_hb: totalLojasHB,
        total_lojas_hnt: totalLojasHNT,
        total_cd_es_hb: dadosFinalizacao.inventario_hb.cd_espirito_santo.total_cd.total_geral,
        total_cd_es_hnt: dadosFinalizacao.inventario_hnt.cd_espirito_santo.total_cd.total_geral,
        total_cd_sp_hb: dadosFinalizacao.inventario_hb.cd_sao_paulo.total_cd.total_geral,
        total_cd_sp_hnt: dadosFinalizacao.inventario_hnt.cd_sao_paulo.total_cd.total_geral,
        total_cd_rj_hb: dadosFinalizacao.inventario_hb.cd_rio.total_cd.total_geral,
        total_cd_rj_hnt: dadosFinalizacao.inventario_hnt.cd_rio.total_cd.total_geral,
        dados_completos: dadosFinalizacao
      })
      .select()
      .single()

    if (errorFinalizacao) {
      console.error('Erro ao salvar finalização:', errorFinalizacao)
      return NextResponse.json({
        success: false,
        error: 'Erro ao salvar dados de finalização'
      }, { status: 500 })
    }

    // Finalizar inventário se solicitado
    if (finalizar_inventario) {
      const { error: errorFinalizar } = await supabaseServer
        .from('invtrack_inventarios')
        .update({ status: 'finalizado' })
        .eq('codigo', codigo_inventario)

      if (errorFinalizar) {
        console.error('Erro ao finalizar inventário:', errorFinalizar)
        return NextResponse.json({
          success: false,
          error: 'Erro ao finalizar inventário'
        }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        finalizacao,
        arquivo_excel_url: arquivoUrl,
        nome_arquivo: nomeArquivo
      }
    } as FinalizacaoResponse)

  } catch (error) {
    console.error('Erro na finalização:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor'
    }, { status: 500 })
  }
}
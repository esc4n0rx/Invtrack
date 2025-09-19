// app/api/inventarios/download/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'
import { gerarExcelInventario } from '@/lib/excel-generator'
import { DadosFinalizacao } from '@/types/inventory-finalization'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id || !/^[0-9a-fA-F-]{36}$/.test(id)) {
      return NextResponse.json({
        success: false,
        error: 'Identificador inválido'
      }, { status: 400 })
    }

    const { data: finalizacao, error } = await supabaseServer
      .from('invtrack_finalizacoes_inventario')
      .select('id, codigo_inventario, data_finalizacao, dados_completos')
      .eq('id', id)
      .single()

    if (error || !finalizacao) {
      return NextResponse.json({
        success: false,
        error: 'Finalização não encontrada'
      }, { status: 404 })
    }

    if (!finalizacao.dados_completos) {
      return NextResponse.json({
        success: false,
        error: 'Dados da finalização indisponíveis'
      }, { status: 400 })
    }

    const dadosFinalizacao = finalizacao.dados_completos as DadosFinalizacao
    const excelBuffer = await gerarExcelInventario(dadosFinalizacao)

    const dataFinalizacao = finalizacao.data_finalizacao
      ? new Date(finalizacao.data_finalizacao)
      : new Date()
    const dataValida = isNaN(dataFinalizacao.getTime()) ? new Date() : dataFinalizacao
    const dataFormatada = dataValida.toISOString().split('T')[0]
    const nomeArquivo = `inventario_${finalizacao.codigo_inventario}_${dataFormatada}.xlsx`

    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${nomeArquivo}"`,
        'Content-Length': excelBuffer.length.toString(),
        'Cache-Control': 'no-store'
      }
    })

  } catch (error) {
    console.error('Erro no download:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}

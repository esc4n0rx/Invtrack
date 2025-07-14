// app/api/relatorios/[id]/download/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json({
        error: 'ID do relatório é obrigatório'
      }, { status: 400 })
    }

    // Buscar relatório
    const { data: relatorio, error } = await supabaseServer
      .from('invtrack_relatorios')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !relatorio) {
      return NextResponse.json({
        error: 'Relatório não encontrado'
      }, { status: 404 })
    }

    if (relatorio.status !== 'concluido') {
      return NextResponse.json({
        error: 'Relatório ainda não foi processado'
      }, { status: 400 })
    }

    if (!relatorio.dados) {
      return NextResponse.json({
        error: 'Dados do relatório não disponíveis'
      }, { status: 400 })
    }

    // Gerar arquivo baseado no formato
    let conteudo: string | Buffer
    let contentType: string
    let nomeArquivo: string

    switch (relatorio.formato) {
      case 'json':
        conteudo = JSON.stringify(relatorio.dados, null, 2)
        contentType = 'application/json'
        nomeArquivo = `${relatorio.nome}.json`
        break

      case 'csv':
        conteudo = await gerarCSV(relatorio.dados, relatorio.tipo)
        contentType = 'text/csv'
        nomeArquivo = `${relatorio.nome}.csv`
        break

      case 'excel':
        // Implementar geração de Excel se necessário
        conteudo = JSON.stringify(relatorio.dados, null, 2)
        contentType = 'application/json'
        nomeArquivo = `${relatorio.nome}.json`
        break

      case 'pdf':
        // Implementar geração de PDF se necessário
        conteudo = JSON.stringify(relatorio.dados, null, 2)
        contentType = 'application/json'
        nomeArquivo = `${relatorio.nome}.json`
        break

      default:
        conteudo = JSON.stringify(relatorio.dados, null, 2)
        contentType = 'application/json'
        nomeArquivo = `${relatorio.nome}.json`
    }

    return new NextResponse(conteudo, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${nomeArquivo}"`,
        'Content-Length': Buffer.byteLength(conteudo).toString()
      }
    })

  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json({
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}

async function gerarCSV(dados: any, tipo: string): Promise<string> {
  // Implementar conversão para CSV baseado no tipo de relatório
  
  if (tipo === 'inventario_completo' && dados.detalhes_contagens) {
    const headers = ['Tipo', 'Ativo', 'Quantidade', 'Data Contagem', 'Responsável', 'Local', 'Observações']
    const linhas = [headers.join(',')]
    
    dados.detalhes_contagens.forEach((contagem: any) => {
      const local = contagem.loja || contagem.setor_cd || contagem.fornecedor || 
                   `${contagem.cd_origem || ''} → ${contagem.cd_destino || ''}` || 'N/A'
      
      const linha = [
        contagem.tipo,
        `"${contagem.ativo}"`,
        contagem.quantidade,
        new Date(contagem.data_contagem).toLocaleDateString('pt-BR'),
        `"${contagem.responsavel}"`,
        `"${local}"`,
        `"${contagem.obs || ''}"`
      ]
      linhas.push(linha.join(','))
    })
    
    return linhas.join('\n')
  }

  if (tipo === 'contagens_por_loja' && dados.resumo) {
    const headers = ['Loja', 'Total Itens', 'Quantidade Total', 'Ativos Distintos']
    const linhas = [headers.join(',')]
    
    dados.resumo.forEach((item: any) => {
      const linha = [
        `"${item.loja}"`,
        item.total_itens,
        item.quantidade_total,
        item.ativos_distintos
      ]
      linhas.push(linha.join(','))
    })
    
    return linhas.join('\n')
  }

  if (tipo === 'contagens_por_cd' && dados.resumo) {
    const headers = ['Setor', 'Total Itens', 'Quantidade Total', 'Ativos Distintos']
    const linhas = [headers.join(',')]
    
    dados.resumo.forEach((item: any) => {
      const linha = [
        `"${item.setor}"`,
        item.total_itens,
        item.quantidade_total,
        item.ativos_distintos
      ]
      linhas.push(linha.join(','))
    })
    
    return linhas.join('\n')
  }

  // Para outros tipos, retornar JSON como fallback
  return JSON.stringify(dados, null, 2)
}
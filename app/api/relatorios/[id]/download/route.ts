import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'
import PDFDocument from 'pdfkit'
import ExcelJS from 'exceljs'

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
        conteudo = await gerarExcel(relatorio.dados, relatorio.tipo)
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        nomeArquivo = `${relatorio.nome}.xlsx`
        break

      case 'pdf':
        conteudo = await gerarPDF(relatorio.dados, relatorio.tipo, relatorio.nome)
        contentType = 'application/pdf'
        nomeArquivo = `${relatorio.nome}.pdf`
        break

      default:
        conteudo = JSON.stringify(relatorio.dados, null, 2)
        contentType = 'application/json'
        nomeArquivo = `${relatorio.nome}.json`
    }

    // Se for PDF ou Excel, conteudo é Buffer
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

  return JSON.stringify(dados, null, 2)
}

// Função para gerar Excel (.xlsx)
async function gerarExcel(dados: any, tipo: string): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Relatório')

  if (tipo === 'inventario_completo' && dados.detalhes_contagens) {
    sheet.addRow(['Tipo', 'Ativo', 'Quantidade', 'Data Contagem', 'Responsável', 'Local', 'Observações'])
    dados.detalhes_contagens.forEach((contagem: any) => {
      const local = contagem.loja || contagem.setor_cd || contagem.fornecedor || `${contagem.cd_origem || ''} → ${contagem.cd_destino || ''}` || 'N/A'
      sheet.addRow([
        contagem.tipo,
        contagem.ativo,
        contagem.quantidade,
        new Date(contagem.data_contagem).toLocaleDateString('pt-BR'),
        contagem.responsavel,
        local,
        contagem.obs || ''
      ])
    })
  } else if (tipo === 'contagens_por_loja' && dados.resumo) {
    sheet.addRow(['Loja', 'Total Itens', 'Quantidade Total', 'Ativos Distintos'])
    dados.resumo.forEach((item: any) => {
      sheet.addRow([
        item.loja,
        item.total_itens,
        item.quantidade_total,
        item.ativos_distintos
      ])
    })
  } else if (tipo === 'contagens_por_cd' && dados.resumo) {
    sheet.addRow(['Setor', 'Total Itens', 'Quantidade Total', 'Ativos Distintos'])
    dados.resumo.forEach((item: any) => {
      sheet.addRow([
        item.setor,
        item.total_itens,
        item.quantidade_total,
        item.ativos_distintos
      ])
    })
  } else {
    // fallback: dump json
    sheet.addRow(['Dados'])
    sheet.addRow([JSON.stringify(dados)])
  }

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

// Função para gerar PDF
async function gerarPDF(dados: any, tipo: string, nome: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 30 })
    const buffers: Buffer[] = []

    doc.on('data', buffers.push.bind(buffers))
    doc.on('end', () => {
      resolve(Buffer.concat(buffers))
    })
    doc.on('error', reject)

    doc.fontSize(18).text(`Relatório: ${nome}`, { align: 'center' })
    doc.moveDown()

    if (tipo === 'inventario_completo' && dados.detalhes_contagens) {
      doc.fontSize(12).text('Tipo | Ativo | Quantidade | Data Contagem | Responsável | Local | Observações')
      doc.moveDown(0.5)
      dados.detalhes_contagens.forEach((contagem: any) => {
        const local = contagem.loja || contagem.setor_cd || contagem.fornecedor || `${contagem.cd_origem || ''} → ${contagem.cd_destino || ''}` || 'N/A'
        doc.text(`${contagem.tipo} | ${contagem.ativo} | ${contagem.quantidade} | ${new Date(contagem.data_contagem).toLocaleDateString('pt-BR')} | ${contagem.responsavel} | ${local} | ${contagem.obs || ''}`)
      })
    } else if (tipo === 'contagens_por_loja' && dados.resumo) {
      doc.fontSize(12).text('Loja | Total Itens | Quantidade Total | Ativos Distintos')
      doc.moveDown(0.5)
      dados.resumo.forEach((item: any) => {
        doc.text(`${item.loja} | ${item.total_itens} | ${item.quantidade_total} | ${item.ativos_distintos}`)
      })
    } else if (tipo === 'contagens_por_cd' && dados.resumo) {
      doc.fontSize(12).text('Setor | Total Itens | Quantidade Total | Ativos Distintos')
      doc.moveDown(0.5)
      dados.resumo.forEach((item: any) => {
        doc.text(`${item.setor} | ${item.total_itens} | ${item.quantidade_total} | ${item.ativos_distintos}`)
      })
    } else {
      doc.fontSize(12).text('Dados:')
      doc.moveDown(0.5)
      doc.text(JSON.stringify(dados, null, 2))
    }

    doc.end()
  })
}
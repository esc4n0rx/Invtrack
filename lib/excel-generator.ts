// lib/excel-generator.ts (corrigido)
import * as ExcelJS from 'exceljs'
import { DadosFinalizacao } from '@/types/inventory-finalization'

export async function gerarExcelInventario(dados: DadosFinalizacao): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  
  // Configurar metadados do workbook
  workbook.creator = 'Sistema InvTrack'
  workbook.lastModifiedBy = 'Sistema InvTrack'
  workbook.created = new Date()
  workbook.modified = new Date()

  // Criar abas
  await criarAbaResumo(workbook, dados)
  await criarAbaInventarioHB(workbook, dados)
  await criarAbaInventarioHNT(workbook, dados)

  // Gerar buffer
  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

async function criarAbaResumo(workbook: ExcelJS.Workbook, dados: DadosFinalizacao) {
  const worksheet = workbook.addWorksheet('RESUMO GERAL')
  
  // Configurar largura das colunas
  worksheet.columns = [
    { key: 'A', width: 25 },
    { key: 'B', width: 15 },
    { key: 'C', width: 15 },
    { key: 'D', width: 15 },
    { key: 'E', width: 15 }
  ]

  // Cabeçalho principal
  worksheet.mergeCells('A1:E1')
  const headerCell = worksheet.getCell('A1')
  headerCell.value = 'RELATÓRIO DE FINALIZAÇÃO DE INVENTÁRIO'
  headerCell.style = {
    font: { bold: true, size: 16, color: { argb: 'FFFFFF' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '2F5496' } },
    alignment: { horizontal: 'center', vertical: 'middle' }
  }
  worksheet.getRow(1).height = 25

  // Informações do inventário
  let currentRow = 3
  
  worksheet.getCell(`A${currentRow}`).value = 'INFORMAÇÕES DO INVENTÁRIO'
  worksheet.getCell(`A${currentRow}`).style = {
    font: { bold: true, size: 12 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D9E1F2' } }
  }
  worksheet.mergeCells(`A${currentRow}:E${currentRow}`)
  currentRow++

  // Dados do inventário
  const infoInventario = [
    ['Código do Inventário:', dados.inventario.codigo],
    ['Responsável:', dados.inventario.responsavel],
    ['Data de Criação:', new Date(dados.inventario.data_criacao).toLocaleDateString('pt-BR')],
    ['Data de Finalização:', new Date(dados.inventario.data_finalizacao).toLocaleDateString('pt-BR')],
    ['Sistema Gerador:', 'InvTrack - Sistema de Gestão de Inventário']
  ]

  infoInventario.forEach((item) => {
    const [label, value] = item as [string, any]
    worksheet.getCell(`A${currentRow}`).value = label
    worksheet.getCell(`A${currentRow}`).style = { font: { bold: true } }
    worksheet.getCell(`B${currentRow}`).value = value
    currentRow++
  })

  currentRow += 2

  // Totais HB
  worksheet.getCell(`A${currentRow}`).value = 'TOTAIS INVENTÁRIO HB'
  worksheet.getCell(`A${currentRow}`).style = {
    font: { bold: true, size: 12 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E2EFDA' } }
  }
  worksheet.mergeCells(`A${currentRow}:E${currentRow}`)
  currentRow++

  // Cabeçalho da tabela HB
  const headerHB = ['Categoria', 'HB 618', 'HB 623', 'Total HB']
  headerHB.forEach((header: string, index: number) => {
    const cell = worksheet.getCell(`${String.fromCharCode(65 + index)}${currentRow}`)
    cell.value = header
    cell.style = {
      font: { bold: true },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'C6E0B4' } },
      alignment: { horizontal: 'center' }
    }
  })
  currentRow++

  // Dados HB - Calcular totais das lojas
  const totalLojasHB = dados.inventario_hb.lojas.reduce((acc, loja) => ({
    total_618: acc.total_618 + loja.total_618,
    total_623: acc.total_623 + loja.total_623,
    total_geral: acc.total_geral + loja.total_geral
  }), { total_618: 0, total_623: 0, total_geral: 0 })

  const dadosHB = [
    ['Total Lojas', totalLojasHB.total_618, totalLojasHB.total_623, totalLojasHB.total_geral],
    ['CD Espírito Santo', dados.inventario_hb.cd_espirito_santo.total_cd.total_618, dados.inventario_hb.cd_espirito_santo.total_cd.total_623, dados.inventario_hb.cd_espirito_santo.total_cd.total_geral],
    ['CD São Paulo', dados.inventario_hb.cd_sao_paulo.total_cd.total_618, dados.inventario_hb.cd_sao_paulo.total_cd.total_623, dados.inventario_hb.cd_sao_paulo.total_cd.total_geral],
    ['CD Rio de Janeiro', dados.inventario_hb.cd_rio.total_cd.total_618, dados.inventario_hb.cd_rio.total_cd.total_623, dados.inventario_hb.cd_rio.total_cd.total_geral]
  ]

  dadosHB.forEach((item) => {
    const [categoria, hb618, hb623, totalHB] = item as [string, number, number, number]
    worksheet.getCell(`A${currentRow}`).value = categoria
    worksheet.getCell(`B${currentRow}`).value = Number(hb618) || 0
    worksheet.getCell(`C${currentRow}`).value = Number(hb623) || 0
    worksheet.getCell(`D${currentRow}`).value = Number(totalHB) || 0
    ;(['B', 'C', 'D'] as const).forEach((col) => {
      worksheet.getCell(`${col}${currentRow}`).style = {
        numFmt: '#,##0',
        alignment: { horizontal: 'right' }
      }
    })
    currentRow++
  })

  // Linha de total geral HB
  const totalGeralHB = dadosHB.reduce((acc, [_, val618, val623, valTotal]) => ({
    total_618: acc.total_618 + (Number(val618) || 0),
    total_623: acc.total_623 + (Number(val623) || 0),
    total_geral: acc.total_geral + (Number(valTotal) || 0)
  }), { total_618: 0, total_623: 0, total_geral: 0 })

  worksheet.getCell(`A${currentRow}`).value = 'TOTAL GERAL HB'
  worksheet.getCell(`A${currentRow}`).style = { font: { bold: true } }
  worksheet.getCell(`B${currentRow}`).value = totalGeralHB.total_618
  worksheet.getCell(`C${currentRow}`).value = totalGeralHB.total_623
  worksheet.getCell(`D${currentRow}`).value = totalGeralHB.total_geral

  // Aplicar estilo na linha total
  ;(['A', 'B', 'C', 'D'] as const).forEach((col) => {
    const cell = worksheet.getCell(`${col}${currentRow}`)
    cell.style = {
      font: { bold: true },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'A9D08E' } },
      numFmt: col !== 'A' ? '#,##0' : undefined,
      alignment: { horizontal: col === 'A' ? 'left' : 'right' }
    }
  })

  currentRow += 3

  // Totais HNT
  worksheet.getCell(`A${currentRow}`).value = 'TOTAIS INVENTÁRIO HNT'
  worksheet.getCell(`A${currentRow}`).style = {
    font: { bold: true, size: 12 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2CC' } }
  }
  worksheet.mergeCells(`A${currentRow}:E${currentRow}`)
  currentRow++

  // Cabeçalho da tabela HNT
  const headerHNT = ['Categoria', 'HNT G', 'HNT P', 'Total HNT']
  headerHNT.forEach((header: string, index: number) => {
    const cell = worksheet.getCell(`${String.fromCharCode(65 + index)}${currentRow}`)
    cell.value = header
    cell.style = {
      font: { bold: true },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE699' } },
      alignment: { horizontal: 'center' }
    }
  })
  currentRow++

  // Dados HNT - Calcular totais das lojas
  const totalLojasHNT = dados.inventario_hnt.lojas.reduce((acc, loja) => ({
    total_g: acc.total_g + loja.total_g,
    total_p: acc.total_p + loja.total_p,
    total_geral: acc.total_geral + loja.total_geral
  }), { total_g: 0, total_p: 0, total_geral: 0 })

  const dadosHNT = [
    ['Total Lojas', totalLojasHNT.total_g, totalLojasHNT.total_p, totalLojasHNT.total_geral],
    ['CD Espírito Santo', dados.inventario_hnt.cd_espirito_santo.total_cd.total_g, dados.inventario_hnt.cd_espirito_santo.total_cd.total_p, dados.inventario_hnt.cd_espirito_santo.total_cd.total_geral],
    ['CD São Paulo', dados.inventario_hnt.cd_sao_paulo.total_cd.total_g, dados.inventario_hnt.cd_sao_paulo.total_cd.total_p, dados.inventario_hnt.cd_sao_paulo.total_cd.total_geral],
    ['CD Rio de Janeiro', dados.inventario_hnt.cd_rio.total_cd.total_g, dados.inventario_hnt.cd_rio.total_cd.total_p, dados.inventario_hnt.cd_rio.total_cd.total_geral]
  ]

  dadosHNT.forEach((item) => {
    const [categoria, hntG, hntP, totalHNT] = item as [string, number, number, number]
    worksheet.getCell(`A${currentRow}`).value = categoria
    worksheet.getCell(`B${currentRow}`).value = Number(hntG) || 0
    worksheet.getCell(`C${currentRow}`).value = Number(hntP) || 0
    worksheet.getCell(`D${currentRow}`).value = Number(totalHNT) || 0
    ;(['B', 'C', 'D'] as const).forEach((col) => {
      worksheet.getCell(`${col}${currentRow}`).style = {
        numFmt: '#,##0',
        alignment: { horizontal: 'right' }
      }
    })
    currentRow++
  })

  // Linha de total geral HNT
  const totalGeralHNT = dadosHNT.reduce((acc, [_, valG, valP, valTotal]) => ({
    total_g: acc.total_g + (Number(valG) || 0),
    total_p: acc.total_p + (Number(valP) || 0),
    total_geral: acc.total_geral + (Number(valTotal) || 0)
  }), { total_g: 0, total_p: 0, total_geral: 0 })

  worksheet.getCell(`A${currentRow}`).value = 'TOTAL GERAL HNT'
  worksheet.getCell(`A${currentRow}`).style = { font: { bold: true } }
  worksheet.getCell(`B${currentRow}`).value = totalGeralHNT.total_g
  worksheet.getCell(`C${currentRow}`).value = totalGeralHNT.total_p
  worksheet.getCell(`D${currentRow}`).value = totalGeralHNT.total_geral

  // Aplicar estilo na linha total
  ;(['A', 'B', 'C', 'D'] as const).forEach((col) => {
    const cell = worksheet.getCell(`${col}${currentRow}`)
    cell.style = {
      font: { bold: true },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F4B942' } },
      numFmt: col !== 'A' ? '#,##0' : undefined,
      alignment: { horizontal: col === 'A' ? 'left' : 'right' }
    }
  })

  // Adicionar bordas a toda a planilha
  const range = worksheet.getRows(1, currentRow)
  range?.forEach(row => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
    })
  })
}

async function criarAbaInventarioHB(workbook: ExcelJS.Workbook, dados: DadosFinalizacao) {
  const worksheet = workbook.addWorksheet('INVENTÁRIO HB')
  
  // Configurar largura das colunas
  worksheet.columns = [
    { key: 'A', width: 30 },
    { key: 'B', width: 15 },
    { key: 'C', width: 15 },
    { key: 'D', width: 15 }
  ]

  // Cabeçalho principal
  worksheet.mergeCells('A1:D1')
  const headerCell = worksheet.getCell('A1')
  headerCell.value = 'INVENTÁRIO HB (Ativos HB 618 e HB 623)'
  headerCell.style = {
    font: { bold: true, size: 16, color: { argb: 'FFFFFF' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '70AD47' } },
    alignment: { horizontal: 'center', vertical: 'middle' }
  }
  worksheet.getRow(1).height = 25

  let currentRow = 3

  // LOJAS
  worksheet.getCell(`A${currentRow}`).value = 'LOJAS'
  worksheet.getCell(`A${currentRow}`).style = {
    font: { bold: true, size: 14 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'A9D08E' } }
  }
  worksheet.mergeCells(`A${currentRow}:D${currentRow}`)
  currentRow++

  // Cabeçalho das lojas
  const headerLojas = ['Nome da Loja', 'HB 618', 'HB 623', 'Total']
  headerLojas.forEach((header: string, index: number) => {
    const cell = worksheet.getCell(`${String.fromCharCode(65 + index)}${currentRow}`)
    cell.value = header
    cell.style = {
      font: { bold: true },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'C6E0B4' } },
      alignment: { horizontal: 'center' }
    }
  })
  currentRow++

  // Dados das lojas
  dados.inventario_hb.lojas.forEach((loja: any) => {
    worksheet.getCell(`A${currentRow}`).value = loja.nome
    worksheet.getCell(`B${currentRow}`).value = Number(loja.total_618) || 0
    worksheet.getCell(`C${currentRow}`).value = Number(loja.total_623) || 0
    worksheet.getCell(`D${currentRow}`).value = Number(loja.total_geral) || 0
    ;(['B', 'C', 'D'] as const).forEach((col) => {
      worksheet.getCell(`${col}${currentRow}`).style = {
        numFmt: '#,##0',
        alignment: { horizontal: 'right' }
      }
    })
    currentRow++
  })

  // Total das lojas
  const totalLojas = dados.inventario_hb.lojas.reduce((acc, loja) => ({
    total_618: acc.total_618 + (Number(loja.total_618) || 0),
    total_623: acc.total_623 + (Number(loja.total_623) || 0),
    total_geral: acc.total_geral + (Number(loja.total_geral) || 0)
  }), { total_618: 0, total_623: 0, total_geral: 0 })

  worksheet.getCell(`A${currentRow}`).value = 'TOTAL LOJAS'
  worksheet.getCell(`A${currentRow}`).style = { font: { bold: true } }
  worksheet.getCell(`B${currentRow}`).value = totalLojas.total_618
  worksheet.getCell(`C${currentRow}`).value = totalLojas.total_623
  worksheet.getCell(`D${currentRow}`).value = totalLojas.total_geral

  ;(['A', 'B', 'C', 'D'] as const).forEach((col) => {
    const cell = worksheet.getCell(`${col}${currentRow}`)
    cell.style = {
      font: { bold: true },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'A9D08E' } },
      numFmt: col !== 'A' ? '#,##0' : undefined,
      alignment: { horizontal: col === 'A' ? 'left' : 'right' }
    }
  })

  currentRow += 3

  // CD ESPÍRITO SANTO
  await criarSecaoCD(worksheet, currentRow, 'CD ESPÍRITO SANTO', dados.inventario_hb.cd_espirito_santo)
  currentRow += 9

  // CD SÃO PAULO
  await criarSecaoCD(worksheet, currentRow, 'CD SÃO PAULO', dados.inventario_hb.cd_sao_paulo)
  currentRow += 9

  // CD RIO DE JANEIRO
  await criarSecaoCDRio(worksheet, currentRow, 'CD RIO DE JANEIRO', dados.inventario_hb.cd_rio)

  // Adicionar bordas
  const totalRows = worksheet.rowCount
  const range = worksheet.getRows(1, totalRows)
  range?.forEach(row => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
    })
  })
}

async function criarSecaoCD(worksheet: ExcelJS.Worksheet, startRow: number, titulo: string, dadosCD: any) {
  let currentRow = startRow

  // Título do CD
  worksheet.getCell(`A${currentRow}`).value = titulo
  worksheet.getCell(`A${currentRow}`).style = {
    font: { bold: true, size: 14 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '5B9BD5' } }
  }
  worksheet.mergeCells(`A${currentRow}:D${currentRow}`)
  currentRow++

  // Cabeçalho
  const header = ['Categoria', 'HB 618', 'HB 623', 'Total']
  header.forEach((h: string, index: number) => {
    const cell = worksheet.getCell(`${String.fromCharCode(65 + index)}${currentRow}`)
    cell.value = h
    cell.style = {
      font: { bold: true },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'B4C6E7' } },
      alignment: { horizontal: 'center' }
    }
  })
  currentRow++

  // Dados
  const categorias = [
    ['Estoque', dadosCD.estoque.total_618, dadosCD.estoque.total_623, dadosCD.estoque.total_geral],
    ['Fornecedor', dadosCD.fornecedor.total_618, dadosCD.fornecedor.total_623, dadosCD.fornecedor.total_geral],
    ['Trânsito', dadosCD.transito.total_618, dadosCD.transito.total_623, dadosCD.transito.total_geral]
  ]

  categorias.forEach((item) => {
    const [categoria, hb618, hb623, totalCD] = item as [string, number, number, number]
    worksheet.getCell(`A${currentRow}`).value = categoria
    worksheet.getCell(`B${currentRow}`).value = Number(hb618) || 0
    worksheet.getCell(`C${currentRow}`).value = Number(hb623) || 0
    worksheet.getCell(`D${currentRow}`).value = Number(totalCD) || 0
    ;(['B', 'C', 'D'] as const).forEach((col) => {
      worksheet.getCell(`${col}${currentRow}`).style = {
        numFmt: '#,##0',
        alignment: { horizontal: 'right' }
      }
    })
    currentRow++
  })

  // Total do CD
  worksheet.getCell(`A${currentRow}`).value = `TOTAL ${titulo}`
  worksheet.getCell(`A${currentRow}`).style = { font: { bold: true } }
  worksheet.getCell(`B${currentRow}`).value = Number(dadosCD.total_cd.total_618) || 0
  worksheet.getCell(`C${currentRow}`).value = Number(dadosCD.total_cd.total_623) || 0
  worksheet.getCell(`D${currentRow}`).value = Number(dadosCD.total_cd.total_geral) || 0

  ;(['A', 'B', 'C', 'D'] as const).forEach((col) => {
    const cell = worksheet.getCell(`${col}${currentRow}`)
    cell.style = {
      font: { bold: true },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '5B9BD5' } },
      numFmt: col !== 'A' ? '#,##0' : undefined,
      alignment: { horizontal: col === 'A' ? 'left' : 'right' }
    }
  })
}

async function criarSecaoCDRio(worksheet: ExcelJS.Worksheet, startRow: number, titulo: string, dadosCD: any) {
  let currentRow = startRow

  // Título do CD
  worksheet.getCell(`A${currentRow}`).value = titulo
  worksheet.getCell(`A${currentRow}`).style = {
    font: { bold: true, size: 14 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC000' } }
  }
  worksheet.mergeCells(`A${currentRow}:D${currentRow}`)
  currentRow++

  // Cabeçalho
  const header = ['Categoria', 'HB 618', 'HB 623', 'Total']
  header.forEach((h: string, index: number) => {
    const cell = worksheet.getCell(`${String.fromCharCode(65 + index)}${currentRow}`)
    cell.value = h
    cell.style = {
      font: { bold: true },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE699' } },
      alignment: { horizontal: 'center' }
    }
  })
  currentRow++

  // Dados específicos do CD RIO
  const categorias = [
    ['Estoque (Setores Normais)', dadosCD.estoque.setores_normais.total_618, dadosCD.estoque.setores_normais.total_623, dadosCD.estoque.setores_normais.total_geral],
    ['Central de Produção', dadosCD.estoque.central_producao.total_618, dadosCD.estoque.central_producao.total_623, dadosCD.estoque.central_producao.total_geral],
    ['Total Estoque', dadosCD.estoque.total_estoque.total_618, dadosCD.estoque.total_estoque.total_623, dadosCD.estoque.total_estoque.total_geral],
    ['Fornecedor', dadosCD.fornecedor.total_618, dadosCD.fornecedor.total_623, dadosCD.fornecedor.total_geral]
  ]

  categorias.forEach((item) => {
    const [categoria, hb618, hb623, totalCD] = item as [string, number, number, number]
    worksheet.getCell(`A${currentRow}`).value = categoria
    worksheet.getCell(`B${currentRow}`).value = Number(hb618) || 0
    worksheet.getCell(`C${currentRow}`).value = Number(hb623) || 0
    worksheet.getCell(`D${currentRow}`).value = Number(totalCD) || 0
    
    const isTotal = categoria === 'Total Estoque'
    
    ;(['A', 'B', 'C', 'D'] as const).forEach((col) => {
      const cell = worksheet.getCell(`${col}${currentRow}`)
      cell.style = {
        font: { bold: isTotal },
        fill: isTotal ? { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F4B942' } } : undefined,
        numFmt: col !== 'A' ? '#,##0' : undefined,
        alignment: { horizontal: col === 'A' ? 'left' : 'right' }
      }
    })
    currentRow++
  })

  // Total do CD Rio
  worksheet.getCell(`A${currentRow}`).value = 'TOTAL CD RIO DE JANEIRO'
  worksheet.getCell(`A${currentRow}`).style = { font: { bold: true } }
  worksheet.getCell(`B${currentRow}`).value = Number(dadosCD.total_cd.total_618) || 0
  worksheet.getCell(`C${currentRow}`).value = Number(dadosCD.total_cd.total_623) || 0
  worksheet.getCell(`D${currentRow}`).value = Number(dadosCD.total_cd.total_geral) || 0

  ;(['A', 'B', 'C', 'D'] as const).forEach((col) => {
    const cell = worksheet.getCell(`${col}${currentRow}`)
    cell.style = {
      font: { bold: true },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC000' } },
      numFmt: col !== 'A' ? '#,##0' : undefined,
      alignment: { horizontal: col === 'A' ? 'left' : 'right' }
    }
  })
}

async function criarAbaInventarioHNT(workbook: ExcelJS.Workbook, dados: DadosFinalizacao) {
  const worksheet = workbook.addWorksheet('INVENTÁRIO HNT')
  
  // Configurar largura das colunas
  worksheet.columns = [
    { key: 'A', width: 30 },
    { key: 'B', width: 15 },
    { key: 'C', width: 15 },
    { key: 'D', width: 15 }
  ]

  // Cabeçalho principal
  worksheet.mergeCells('A1:D1')
  const headerCell = worksheet.getCell('A1')
  headerCell.value = 'INVENTÁRIO HNT (Ativos HNT G e HNT P)'
  headerCell.style = {
    font: { bold: true, size: 16, color: { argb: 'FFFFFF' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F4B942' } },
    alignment: { horizontal: 'center', vertical: 'middle' }
  }
  worksheet.getRow(1).height = 25

  let currentRow = 3

  // LOJAS
  worksheet.getCell(`A${currentRow}`).value = 'LOJAS'
  worksheet.getCell(`A${currentRow}`).style = {
    font: { bold: true, size: 14 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE699' } }
  }
  worksheet.mergeCells(`A${currentRow}:D${currentRow}`)
  currentRow++

  // Cabeçalho das lojas
  const headerLojas = ['Nome da Loja', 'HNT G', 'HNT P', 'Total']
  headerLojas.forEach((header: string, index: number) => {
    const cell = worksheet.getCell(`${String.fromCharCode(65 + index)}${currentRow}`)
    cell.value = header
    cell.style = {
      font: { bold: true },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2CC' } },
      alignment: { horizontal: 'center' }
    }
  })
  currentRow++

  // Dados das lojas
  dados.inventario_hnt.lojas.forEach((loja: any) => {
    worksheet.getCell(`A${currentRow}`).value = loja.nome
    worksheet.getCell(`B${currentRow}`).value = Number(loja.total_g) || 0
    worksheet.getCell(`C${currentRow}`).value = Number(loja.total_p) || 0
    worksheet.getCell(`D${currentRow}`).value = Number(loja.total_geral) || 0
    ;(['B', 'C', 'D'] as const).forEach((col) => {
      worksheet.getCell(`${col}${currentRow}`).style = {
        numFmt: '#,##0',
        alignment: { horizontal: 'right' }
      }
    })
    currentRow++
  })

  // Total das lojas
  const totalLojas = dados.inventario_hnt.lojas.reduce((acc, loja) => ({
    total_g: acc.total_g + (Number(loja.total_g ) || 0),
    total_p: acc.total_p + (Number(loja.total_p) || 0),
   total_geral: acc.total_geral + (Number(loja.total_geral) || 0)
 }), { total_g: 0, total_p: 0, total_geral: 0 })

 worksheet.getCell(`A${currentRow}`).value = 'TOTAL LOJAS'
 worksheet.getCell(`A${currentRow}`).style = { font: { bold: true } }
 worksheet.getCell(`B${currentRow}`).value = totalLojas.total_g
 worksheet.getCell(`C${currentRow}`).value = totalLojas.total_p
 worksheet.getCell(`D${currentRow}`).value = totalLojas.total_geral

 ;(['A', 'B', 'C', 'D'] as const).forEach((col) => {
   const cell = worksheet.getCell(`${col}${currentRow}`)
   cell.style = {
     font: { bold: true },
     fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE699' } },
     numFmt: col !== 'A' ? '#,##0' : undefined,
     alignment: { horizontal: col === 'A' ? 'left' : 'right' }
   }
 })

 currentRow += 3

 // CD ESPÍRITO SANTO
 await criarSecaoCDHNT(worksheet, currentRow, 'CD ESPÍRITO SANTO', dados.inventario_hnt.cd_espirito_santo)
 currentRow += 9

 // CD SÃO PAULO
 await criarSecaoCDHNT(worksheet, currentRow, 'CD SÃO PAULO', dados.inventario_hnt.cd_sao_paulo)
 currentRow += 9

 // CD RIO DE JANEIRO
 await criarSecaoCDRioHNT(worksheet, currentRow, 'CD RIO DE JANEIRO', dados.inventario_hnt.cd_rio)

 // Adicionar bordas
 const totalRows = worksheet.rowCount
 const range = worksheet.getRows(1, totalRows)
 range?.forEach(row => {
   row.eachCell((cell) => {
     cell.border = {
       top: { style: 'thin' },
       left: { style: 'thin' },
       bottom: { style: 'thin' },
       right: { style: 'thin' }
     }
   })
 })
}

async function criarSecaoCDHNT(worksheet: ExcelJS.Worksheet, startRow: number, titulo: string, dadosCD: any) {
 let currentRow = startRow

 // Título do CD
 worksheet.getCell(`A${currentRow}`).value = titulo
 worksheet.getCell(`A${currentRow}`).style = {
   font: { bold: true, size: 14 },
   fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E7E6E6' } }
 }
 worksheet.mergeCells(`A${currentRow}:D${currentRow}`)
 currentRow++

 // Cabeçalho
 const header = ['Categoria', 'HNT G', 'HNT P', 'Total']
 header.forEach((h: string, index: number) => {
   const cell = worksheet.getCell(`${String.fromCharCode(65 + index)}${currentRow}`)
   cell.value = h
   cell.style = {
     font: { bold: true },
     fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F2F2F2' } },
     alignment: { horizontal: 'center' }
   }
 })
 currentRow++

 // Dados
 const categorias = [
   ['Estoque', dadosCD.estoque.total_g, dadosCD.estoque.total_p, dadosCD.estoque.total_geral],
   ['Fornecedor', dadosCD.fornecedor.total_g, dadosCD.fornecedor.total_p, dadosCD.fornecedor.total_geral],
   ['Trânsito', dadosCD.transito.total_g, dadosCD.transito.total_p, dadosCD.transito.total_geral]
 ]

 categorias.forEach((item) => {
   const [categoria, hntG, hntP, totalCD] = item as [string, number, number, number]
   worksheet.getCell(`A${currentRow}`).value = categoria
   worksheet.getCell(`B${currentRow}`).value = Number(hntG) || 0
   worksheet.getCell(`C${currentRow}`).value = Number(hntP) || 0
   worksheet.getCell(`D${currentRow}`).value = Number(totalCD) || 0
   
   ;(['B', 'C', 'D'] as const).forEach((col) => {
     worksheet.getCell(`${col}${currentRow}`).style = {
       numFmt: '#,##0',
       alignment: { horizontal: 'right' }
     }
   })
   currentRow++
 })

 // Total do CD
 worksheet.getCell(`A${currentRow}`).value = `TOTAL ${titulo}`
 worksheet.getCell(`A${currentRow}`).style = { font: { bold: true } }
 worksheet.getCell(`B${currentRow}`).value = Number(dadosCD.total_cd.total_g) || 0
 worksheet.getCell(`C${currentRow}`).value = Number(dadosCD.total_cd.total_p) || 0
 worksheet.getCell(`D${currentRow}`).value = Number(dadosCD.total_cd.total_geral) || 0

 ;(['A', 'B', 'C', 'D'] as const).forEach((col) => {
   const cell = worksheet.getCell(`${col}${currentRow}`)
   cell.style = {
     font: { bold: true },
     fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E7E6E6' } },
     numFmt: col !== 'A' ? '#,##0' : undefined,
     alignment: { horizontal: col === 'A' ? 'left' : 'right' }
   }
 })
}

async function criarSecaoCDRioHNT(worksheet: ExcelJS.Worksheet, startRow: number, titulo: string, dadosCD: any) {
 let currentRow = startRow

 // Título do CD
 worksheet.getCell(`A${currentRow}`).value = titulo
 worksheet.getCell(`A${currentRow}`).style = {
   font: { bold: true, size: 14 },
   fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'BDD7EE' } }
 }
 worksheet.mergeCells(`A${currentRow}:D${currentRow}`)
 currentRow++

 // Cabeçalho
 const header = ['Categoria', 'HNT G', 'HNT P', 'Total']
 header.forEach((h: string, index: number) => {
   const cell = worksheet.getCell(`${String.fromCharCode(65 + index)}${currentRow}`)
   cell.value = h
   cell.style = {
     font: { bold: true },
     fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DDEBF7' } },
     alignment: { horizontal: 'center' }
   }
 })
 currentRow++

 // Dados específicos do CD RIO
 const categorias = [
   ['Estoque (Setores Normais)', dadosCD.estoque.setores_normais.total_g, dadosCD.estoque.setores_normais.total_p, dadosCD.estoque.setores_normais.total_geral],
   ['Central de Produção', dadosCD.estoque.central_producao.total_g, dadosCD.estoque.central_producao.total_p, dadosCD.estoque.central_producao.total_geral],
   ['Total Estoque', dadosCD.estoque.total_estoque.total_g, dadosCD.estoque.total_estoque.total_p, dadosCD.estoque.total_estoque.total_geral],
   ['Fornecedor', dadosCD.fornecedor.total_g, dadosCD.fornecedor.total_p, dadosCD.fornecedor.total_geral]
 ]

 categorias.forEach((item) => {
   const [categoria, hntG, hntP, totalCD] = item as [string, number, number, number]
   worksheet.getCell(`A${currentRow}`).value = categoria
   worksheet.getCell(`B${currentRow}`).value = Number(hntG) || 0
   worksheet.getCell(`C${currentRow}`).value = Number(hntP) || 0
   worksheet.getCell(`D${currentRow}`).value = Number(totalCD) || 0
   
   const isTotal = categoria === 'Total Estoque'
   
   ;(['A', 'B', 'C', 'D'] as const).forEach((col) => {
     const cell = worksheet.getCell(`${col}${currentRow}`)
     cell.style = {
       font: { bold: isTotal },
       fill: isTotal ? { type: 'pattern', pattern: 'solid', fgColor: { argb: '9BC2E6' } } : undefined,
       numFmt: col !== 'A' ? '#,##0' : undefined,
       alignment: { horizontal: col === 'A' ? 'left' : 'right' }
     }
   })
   currentRow++
 })

 // Total do CD Rio
 worksheet.getCell(`A${currentRow}`).value = 'TOTAL CD RIO DE JANEIRO'
 worksheet.getCell(`A${currentRow}`).style = { font: { bold: true } }
 worksheet.getCell(`B${currentRow}`).value = Number(dadosCD.total_cd.total_g) || 0
 worksheet.getCell(`C${currentRow}`).value = Number(dadosCD.total_cd.total_p) || 0
 worksheet.getCell(`D${currentRow}`).value = Number(dadosCD.total_cd.total_geral) || 0

 ;(['A', 'B', 'C', 'D'] as const).forEach((col) => {
   const cell = worksheet.getCell(`${col}${currentRow}`)
   cell.style = {
     font: { bold: true },
     fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'BDD7EE' } },
     numFmt: col !== 'A' ? '#,##0' : undefined,
     alignment: { horizontal: col === 'A' ? 'left' : 'right' }
   }
 })
}
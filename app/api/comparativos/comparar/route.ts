// app/api/comparativos/comparar/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'
import { ComparativoRequest, ComparativoResultado, ComparativoDetalhe, ComparativoTipo } from '@/types/comparativo'

export async function POST(request: NextRequest) {
  try {
    const body: ComparativoRequest = await request.json()
    
    const { inventario_1, inventario_2, tipo_comparacao, incluir_zerados = false, apenas_divergencias = false, filtros } = body

    // Validações básicas
    if (!inventario_1 || !inventario_2) {
      return NextResponse.json({
        success: false,
        error: 'Códigos dos inventários são obrigatórios'
      }, { status: 400 })
    }

    if (inventario_1 === inventario_2) {
      return NextResponse.json({
        success: false,
        error: 'Os inventários devem ser diferentes'
      }, { status: 400 })
    }

    // Buscar dados dos inventários
    const { data: inventarios, error: errorInventarios } = await supabaseServer
      .from('invtrack_inventarios')
      .select('*')
      .in('codigo', [inventario_1, inventario_2])

    if (errorInventarios || !inventarios || inventarios.length !== 2) {
      return NextResponse.json({
        success: false,
        error: 'Erro ao encontrar os inventários especificados'
      }, { status: 404 })
    }

    const inv1 = inventarios.find(i => i.codigo === inventario_1)!
    const inv2 = inventarios.find(i => i.codigo === inventario_2)!

    // Buscar contagens de ambos os inventários
    let queryContagens1 = supabaseServer
      .from('invtrack_contagens')
      .select('*')
      .eq('codigo_inventario', inventario_1)

    let queryContagens2 = supabaseServer
      .from('invtrack_contagens')
      .select('*')
      .eq('codigo_inventario', inventario_2)

    // Aplicar filtros se especificados
    if (filtros?.lojas?.length) {
      queryContagens1 = queryContagens1.in('loja', filtros.lojas)
      queryContagens2 = queryContagens2.in('loja', filtros.lojas)
    }

    if (filtros?.setores?.length) {
      queryContagens1 = queryContagens1.in('setor_cd', filtros.setores)
      queryContagens2 = queryContagens2.in('setor_cd', filtros.setores)
    }

    if (filtros?.ativos?.length) {
      queryContagens1 = queryContagens1.in('ativo', filtros.ativos)
      queryContagens2 = queryContagens2.in('ativo', filtros.ativos)
    }

    const [{ data: contagens1 }, { data: contagens2 }] = await Promise.all([
      queryContagens1,
      queryContagens2
    ])

    // Processar comparação
    const resultado = await processarComparacao(
      inv1, inv2,
      contagens1 || [],
      contagens2 || [],
      { incluir_zerados, apenas_divergencias, tipo_comparacao }
    )

    return NextResponse.json({
      success: true,
      data: resultado
    })

  } catch (error) {
    console.error('Erro interno na comparação:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}

async function processarComparacao(
  inv1: any, inv2: any,
  contagens1: any[], contagens2: any[],
  opcoes: { incluir_zerados: boolean, apenas_divergencias: boolean, tipo_comparacao: string }
): Promise<ComparativoResultado> {
  
  // Criar mapa de contagens por inventário
  const mapaContagens1 = new Map<string, any>()
  const mapaContagens2 = new Map<string, any>()

  // Processar contagens do inventário 1
  contagens1.forEach(contagem => {
    const chave = criarChaveComparacao(contagem)
    mapaContagens1.set(chave, contagem)
  })

  // Processar contagens do inventário 2
  contagens2.forEach(contagem => {
    const chave = criarChaveComparacao(contagem)
    mapaContagens2.set(chave, contagem)
  })

  // Obter todas as chaves únicas
  const todasChaves = new Set([...mapaContagens1.keys(), ...mapaContagens2.keys()])

  // Criar detalhes da comparação
  const detalhes: ComparativoDetalhe[] = []

  for (const chave of todasChaves) {
    const contagem1 = mapaContagens1.get(chave)
    const contagem2 = mapaContagens2.get(chave)

    const quantidade1 = contagem1?.quantidade || 0
    const quantidade2 = contagem2?.quantidade || 0
    const diferenca = quantidade1 - quantidade2
    const divergencia = diferenca !== 0

    // Filtrar zerados se necessário
    if (!opcoes.incluir_zerados && quantidade1 === 0 && quantidade2 === 0) {
      continue
    }

    // Filtrar apenas divergências se necessário
    if (opcoes.apenas_divergencias && !divergencia) {
      continue
    }

    const ativo = contagem1?.ativo || contagem2?.ativo
    const tipo = contagem1?.tipo || contagem2?.tipo
    const localizacao = obterLocalizacao(contagem1 || contagem2)

    const percentualDiferenca = quantidade2 !== 0 ? 
      ((diferenca / quantidade2) * 100) : 
      (quantidade1 > 0 ? 100 : 0)

    detalhes.push({
      ativo,
      tipo,
      localizacao,
      quantidade_inv1: quantidade1,
      quantidade_inv2: quantidade2,
      diferenca,
      percentual_diferenca: percentualDiferenca,
      divergencia
    })
  }

  // Calcular estatísticas gerais
  const ativosInv1 = new Set(contagens1.map(c => c.ativo))
  const ativosInv2 = new Set(contagens2.map(c => c.ativo))
  const ativosEmAmbos = new Set([...ativosInv1].filter(a => ativosInv2.has(a)))
  const divergenciasEncontradas = detalhes.filter(d => d.divergencia).length

  const estatisticas_comparacao = {
    total_ativos_comparados: detalhes.length,
    ativos_apenas_inv1: ativosInv1.size - ativosEmAmbos.size,
    ativos_apenas_inv2: ativosInv2.size - ativosEmAmbos.size,
    ativos_em_ambos: ativosEmAmbos.size,
    divergencias_encontradas: divergenciasEncontradas,
    percentual_divergencia: detalhes.length > 0 ? (divergenciasEncontradas / detalhes.length) * 100 : 0
  }

  // Calcular resumo por tipo
  const resumo_por_tipo = {
    loja: calcularResumoTipo(detalhes, 'loja'),
    cd: calcularResumoTipo(detalhes, 'cd'),
    fornecedor: calcularResumoTipo(detalhes, 'fornecedor'),
    transito: calcularResumoTipo(detalhes, 'transito')
  }

  // Calcular estatísticas dos inventários
  const estatisticasInv1 = await calcularEstatisticasInventario(contagens1)
  const estatisticasInv2 = await calcularEstatisticasInventario(contagens2)

  return {
    inventario_1: {
      id: inv1.id,
      codigo: inv1.codigo,
      responsavel: inv1.responsavel,
      status: inv1.status,
      data_criacao: inv1.created_at,
      ...estatisticasInv1
    },
    inventario_2: {
      id: inv2.id,
      codigo: inv2.codigo,
      responsavel: inv2.responsavel,
      status: inv2.status,
      data_criacao: inv2.created_at,
      ...estatisticasInv2
    },
    estatisticas_comparacao,
    detalhes_comparacao: detalhes,
    resumo_por_tipo
  }
}

function criarChaveComparacao(contagem: any): string {
  const { ativo, tipo, loja, setor_cd, fornecedor, cd_origem, cd_destino } = contagem
  
  switch (tipo) {
    case 'loja':
      return `${ativo}|${tipo}|${loja || ''}`
    case 'cd':
      return `${ativo}|${tipo}|${setor_cd || ''}`
    case 'fornecedor':
      return `${ativo}|${tipo}|${fornecedor || ''}`
    case 'transito':
      return `${ativo}|${tipo}|${cd_origem || ''}|${cd_destino || ''}`
    default:
      return `${ativo}|${tipo}`
  }
}

function obterLocalizacao(contagem: any): string {
  const { tipo, loja, setor_cd, fornecedor, cd_origem, cd_destino } = contagem
  
  switch (tipo) {
    case 'loja':
      return loja || 'Não especificada'
    case 'cd':
      return setor_cd || 'Não especificado'
    case 'fornecedor':
      return fornecedor || 'Não especificado'
    case 'transito':
      return `${cd_origem || '?'} → ${cd_destino || '?'}`
    default:
      return 'Não especificada'
  }
}

function calcularResumoTipo(detalhes: ComparativoDetalhe[], tipo: string): ComparativoTipo {
  const detalhesTipo = detalhes.filter(d => d.tipo === tipo)
  
  const totalContagens1 = detalhesTipo.filter(d => d.quantidade_inv1 > 0).length
  const totalContagens2 = detalhesTipo.filter(d => d.quantidade_inv2 > 0).length
  const totalQuantidade1 = detalhesTipo.reduce((acc, d) => acc + d.quantidade_inv1, 0)
  const totalQuantidade2 = detalhesTipo.reduce((acc, d) => acc + d.quantidade_inv2, 0)
  const diferencaQuantidade = totalQuantidade1 - totalQuantidade2
  const divergencias = detalhesTipo.filter(d => d.divergencia).length
  
  const percentualDiferenca = totalQuantidade2 !== 0 ? 
    ((diferencaQuantidade / totalQuantidade2) * 100) : 
    (totalQuantidade1 > 0 ? 100 : 0)

  return {
    total_contagens_inv1: totalContagens1,
    total_contagens_inv2: totalContagens2,
    total_quantidade_inv1: totalQuantidade1,
    total_quantidade_inv2: totalQuantidade2,
    diferenca_quantidade: diferencaQuantidade,
    percentual_diferenca: percentualDiferenca,
    divergencias
  }
}

async function calcularEstatisticasInventario(contagens: any[]) {
  const totalContagens = contagens.length
  const ativosUnicos = new Set(contagens.map(c => c.ativo))
  const lojasUnicas = new Set(contagens.filter(c => c.tipo === 'loja' && c.loja).map(c => c.loja))
  const setoresUnicosCd = new Set(contagens.filter(c => c.tipo === 'cd' && c.setor_cd).map(c => c.setor_cd))

  return {
    total_contagens: totalContagens,
    total_ativos: ativosUnicos.size,
    total_lojas: lojasUnicas.size,
    total_setores_cd: setoresUnicosCd.size
  }
}
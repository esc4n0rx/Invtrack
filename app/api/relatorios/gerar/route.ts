import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'
import { DadosInventarioCompleto } from '@/types/relatorio'

export async function POST(request: NextRequest) {
  try {
    const { relatorio_id } = await request.json()

    if (!relatorio_id) {
      return NextResponse.json({
        success: false,
        error: 'ID do relatório é obrigatório'
      }, { status: 400 })
    }

    const { data: relatorio, error: errorRelatorio } = await supabaseServer
      .from('invtrack_relatorios')
      .select('*')
      .eq('id', relatorio_id)
      .single()

    if (errorRelatorio || !relatorio) {
      return NextResponse.json({
        success: false,
        error: 'Relatório não encontrado'
      }, { status: 404 })
    }

    if (relatorio.status === 'concluido') {
      return NextResponse.json({
        success: false,
        error: 'Relatório já foi processado'
      }, { status: 400 })
    }

    const dataInicio = new Date()

    await supabaseServer
      .from('invtrack_relatorios')
      .update({ 
        status: 'processando',
        data_inicio: dataInicio.toISOString()
      })
      .eq('id', relatorio_id)

    try {
      const dados = await gerarDadosRelatorio(relatorio)
      
      const dataFim = new Date()
      const tempoProcessamento = dataFim.getTime() - dataInicio.getTime()

      const { data: relatorioAtualizado, error: errorUpdate } = await supabaseServer
        .from('invtrack_relatorios')
        .update({
          status: 'concluido',
          dados: dados,
          total_registros: calcularTotalRegistros(dados, relatorio.tipo),
          data_conclusao: dataFim.toISOString(),
          tempo_processamento_ms: tempoProcessamento
        })
        .eq('id', relatorio_id)
        .select()
        .single()

      if (errorUpdate) {
        throw new Error('Erro ao atualizar relatório')
      }

      return NextResponse.json({
        success: true,
        data: relatorioAtualizado
      })

    } catch (error) {
      await supabaseServer
        .from('invtrack_relatorios')
        .update({ 
          status: 'erro',
          observacoes: `Erro durante processamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
        })
        .eq('id', relatorio_id)

      throw error
    }

  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}

async function gerarDadosRelatorio(relatorio: any): Promise<any> {
  const { tipo, codigo_inventario, filtros } = relatorio

  switch (tipo) {
    case 'inventario_completo':
      return await gerarInventarioCompleto(codigo_inventario, filtros)
    
    case 'contagens_por_loja':
      return await gerarContagensPorLoja(codigo_inventario, filtros)
    
    case 'contagens_por_cd':
      return await gerarContagensPorCD(codigo_inventario, filtros)
    
    case 'ativos_em_transito':
      return await gerarAtivosEmTransito(codigo_inventario, filtros)
    
    case 'comparativo_contagens':
      return await gerarComparativoContagens(codigo_inventario, filtros)
    
    case 'divergencias':
      return await gerarRelatorioDivergencias(codigo_inventario, filtros)
    
    case 'resumo_executivo':
      return await gerarResumoExecutivo(codigo_inventario, filtros)
    
    default:
      throw new Error(`Tipo de relatório não suportado: ${tipo}`)
  }
}

async function gerarInventarioCompleto(codigoInventario: string, filtros: any): Promise<DadosInventarioCompleto> {
  const { data: inventario } = await supabaseServer
    .from('invtrack_inventarios')
    .select('*')
    .eq('codigo', codigoInventario)
    .single()

  let queryContagens = supabaseServer
    .from('invtrack_contagens')
    .select('*')
    .eq('codigo_inventario', codigoInventario)

  if (filtros?.tipo_contagem && filtros.tipo_contagem !== 'todos') {
    queryContagens = queryContagens.eq('tipo', filtros.tipo_contagem)
  }

  if (filtros?.data_inicio) {
    queryContagens = queryContagens.gte('data_contagem', filtros.data_inicio)
  }

  if (filtros?.data_fim) {
    queryContagens = queryContagens.lte('data_contagem', filtros.data_fim)
  }

  const { data: contagens } = await queryContagens.order('data_contagem', { ascending: false })

  const totalContagens = contagens?.length || 0
  const ativosUnicos = new Set(contagens?.map(c => c.ativo) || [])
  const lojasUnicas = new Set(contagens?.filter(c => c.tipo === 'loja' && c.loja).map(c => c.loja) || [])
  const setoresUnicosCd = new Set(contagens?.filter(c => c.tipo === 'cd' && c.setor_cd).map(c => c.setor_cd) || [])
  const quantidadeTotal = contagens?.reduce((acc, c) => acc + (c.quantidade || 0), 0) || 0

  const contagensPorTipo = {
    loja: contagens?.filter(c => c.tipo === 'loja').length || 0,
    cd: contagens?.filter(c => c.tipo === 'cd').length || 0,
    fornecedor: contagens?.filter(c => c.tipo === 'fornecedor').length || 0,
    transito: contagens?.filter(c => c.tipo === 'transito').length || 0
  }

  return {
    inventario: {
      codigo: inventario?.codigo || '',
      status: inventario?.status || '',
      responsavel: inventario?.responsavel || '',
      data_criacao: inventario?.created_at || ''
    },
    estatisticas: {
      total_contagens: totalContagens,
      total_ativos_contados: ativosUnicos.size,
      total_lojas_contadas: lojasUnicas.size,
      total_setores_cd_contados: setoresUnicosCd.size,
      total_quantidade_geral: quantidadeTotal
    },
    contagens_por_tipo: contagensPorTipo,
    detalhes_contagens: contagens || []
  }
}

async function gerarContagensPorLoja(codigoInventario: string, filtros: any) {
  let query = supabaseServer
    .from('invtrack_contagens')
    .select('*')
    .eq('codigo_inventario', codigoInventario)
    .eq('tipo', 'loja')

  if (filtros?.loja_especifica?.length) {
    query = query.in('loja', filtros.loja_especifica)
  }

  const { data: contagens } = await query.order('loja').order('ativo')

  const contagensPorLoja = contagens?.reduce((acc, contagem) => {
    const loja = contagem.loja || 'Não especificada'
    if (!acc[loja]) {
      acc[loja] = []
    }
    acc[loja].push(contagem)
    return acc
  }, {} as Record<string, any[]>) || {}

  return {
    total_lojas: Object.keys(contagensPorLoja).length,
    contagens_por_loja: contagensPorLoja,
    resumo: Object.entries(contagensPorLoja).map(([loja, contagens]) => {
      const lista = contagens as any[];
      return {
        loja,
        total_itens: lista.length,
        quantidade_total: lista.reduce((acc, c) => acc + (c.quantidade || 0), 0),
        ativos_distintos: new Set(lista.map(c => c.ativo)).size
      }
    })
 }
}

async function gerarContagensPorCD(codigoInventario: string, filtros: any) {
 let query = supabaseServer
   .from('invtrack_contagens')
   .select('*')
   .eq('codigo_inventario', codigoInventario)
   .eq('tipo', 'cd')

 if (filtros?.setor_cd_especifico?.length) {
   query = query.in('setor_cd', filtros.setor_cd_especifico)
 }

 const { data: contagens } = await query.order('setor_cd').order('ativo')

 const contagensPorSetor = contagens?.reduce((acc, contagem) => {
   const setor = contagem.setor_cd || 'Não especificado'
   if (!acc[setor]) {
     acc[setor] = []
   }
   acc[setor].push(contagem)
   return acc
 }, {} as Record<string, any[]>) || {}

 return {
   total_setores: Object.keys(contagensPorSetor).length,
   contagens_por_setor: contagensPorSetor,
   resumo: Object.entries(contagensPorSetor).map(([setor, contagens]) => {
    const lista = contagens as any[];
    return {
      setor,
      total_itens: lista.length,
      quantidade_total: lista.reduce((acc, c) => acc + (c.quantidade || 0), 0),
      ativos_distintos: new Set(lista.map(c => c.ativo)).size
    }
  })
 }
}

async function gerarAtivosEmTransito(codigoInventario: string, filtros: any) {
 const { data: contagens } = await supabaseServer
   .from('invtrack_contagens')
   .select('*')
   .eq('codigo_inventario', codigoInventario)
   .eq('tipo', 'transito')
   .order('data_contagem', { ascending: false })

 return {
   total_registros: contagens?.length || 0,
   contagens: contagens || [],
   resumo_por_rota: contagens?.reduce((acc, c) => {
     const rota = `${c.cd_origem || 'N/A'} → ${c.cd_destino || 'N/A'}`
     if (!acc[rota]) {
       acc[rota] = {
         total_itens: 0,
         quantidade_total: 0,
         ativos: new Set()
       }
     }
     acc[rota].total_itens++
     acc[rota].quantidade_total += c.quantidade || 0
     acc[rota].ativos.add(c.ativo)
     return acc
   }, {} as Record<string, any>) || {}
 }
}

async function gerarComparativoContagens(codigoInventario: string, filtros: any) {
 const { data: contagensInternas } = await supabaseServer
   .from('invtrack_contagens')
   .select('*')
   .eq('codigo_inventario', codigoInventario)

 const { data: contagensExternas } = await supabaseServer
   .from('invtrack_contagens_externas')
   .select(`
     *,
     itens:invtrack_itens_contagem_externa(*)
   `)
   .eq('codigo_inventario', codigoInventario)


 const comparacoes: any[] = []
 
 const setoresCd = new Set([
   ...(contagensInternas?.filter(c => c.tipo === 'cd').map(c => c.setor_cd) || []),
   ...(contagensExternas?.map(c => c.setor_cd) || [])
 ])

 setoresCd.forEach(setor => {
   if (!setor) return

   const internasSetor = contagensInternas?.filter(c => c.tipo === 'cd' && c.setor_cd === setor) || []
   const externasSetor = contagensExternas?.filter(c => c.setor_cd === setor) || []

   const ativosMapeados = new Map<string, any>()

   internasSetor.forEach(c => {
     ativosMapeados.set(c.ativo, {
       ativo: c.ativo,
       interna: c.quantidade,
       externa: 0,
       divergencia: false
     })
   })

   externasSetor.forEach(contagem => {
     contagem.itens?.forEach((item: any) => {
       const existing = ativosMapeados.get(item.ativo) || {
         ativo: item.ativo,
         interna: 0,
         externa: 0,
         divergencia: false
       }
       existing.externa += item.quantidade
       existing.divergencia = existing.interna !== existing.externa
       ativosMapeados.set(item.ativo, existing)
     })
   })

   comparacoes.push({
     setor,
     ativos: Array.from(ativosMapeados.values()),
     total_divergencias: Array.from(ativosMapeados.values()).filter(a => a.divergencia).length
   })
 })

 return {
   setores_comparados: comparacoes.length,
   comparacoes,
   resumo_geral: {
     total_ativos_comparados: comparacoes.reduce((acc, s) => acc + s.ativos.length, 0),
     total_divergencias: comparacoes.reduce((acc, s) => acc + s.total_divergencias, 0)
   }
 }
}

async function gerarRelatorioDivergencias(codigoInventario: string, filtros: any) {
 const comparativo = await gerarComparativoContagens(codigoInventario, filtros)
 
 const divergencias = comparativo.comparacoes
   .map(setor => ({
     setor: setor.setor,
     divergencias: setor.ativos.filter((a: any) => a.divergencia)
   }))
   .filter(s => s.divergencias.length > 0)

 return {
   total_setores_com_divergencias: divergencias.length,
   divergencias,
   resumo: {
     total_divergencias: divergencias.reduce((acc, s) => acc + s.divergencias.length, 0),
     maior_diferenca: divergencias
       .flatMap(s => s.divergencias)
       .reduce((max, d) => {
         const diff = Math.abs(d.interna - d.externa)
         return diff > max.diferenca ? { ativo: d.ativo, diferenca: diff } : max
       }, { ativo: '', diferenca: 0 })
   }
 }
}

async function gerarResumoExecutivo(codigoInventario: string, filtros: any) {
 const inventarioCompleto = await gerarInventarioCompleto(codigoInventario, filtros)
 const comparativo = await gerarComparativoContagens(codigoInventario, filtros)

 return {
   inventario: inventarioCompleto.inventario,
   estatisticas_gerais: inventarioCompleto.estatisticas,
   contagens_por_tipo: inventarioCompleto.contagens_por_tipo,
   qualidade_dados: {
     taxa_cobertura_lojas: (inventarioCompleto.estatisticas.total_lojas_contadas / 100) * 100, // Assumindo 100 lojas totais
     taxa_cobertura_cd: (inventarioCompleto.estatisticas.total_setores_cd_contados / 50) * 100, // Assumindo 50 setores totais
     divergencias_encontradas: comparativo.resumo_geral?.total_divergencias || 0
   },
   recomendacoes: gerarRecomendacoes(inventarioCompleto, comparativo)
 }
}

function gerarRecomendacoes(inventario: any, comparativo: any): string[] {
 const recomendacoes: string[] = []

 if (inventario.estatisticas.total_contagens < 100) {
   recomendacoes.push('Aumentar o número de contagens para melhor cobertura do inventário')
 }

 if (comparativo.resumo_geral?.total_divergencias > 10) {
   recomendacoes.push('Investigar divergências encontradas entre contagens internas e externas')
 }

 if (inventario.estatisticas.total_lojas_contadas < 80) {
   recomendacoes.push('Intensificar contagens nas lojas pendentes')
 }

 return recomendacoes
}

function calcularTotalRegistros(dados: any, tipo: string): number {
 switch (tipo) {
   case 'inventario_completo':
     return dados.detalhes_contagens?.length || 0
   case 'contagens_por_loja':
     return dados.resumo?.reduce((acc: number, r: any) => acc + r.total_itens, 0) || 0
   case 'contagens_por_cd':
     return dados.resumo?.reduce((acc: number, r: any) => acc + r.total_itens, 0) || 0
   default:
     return dados.total_registros || 0
 }
}
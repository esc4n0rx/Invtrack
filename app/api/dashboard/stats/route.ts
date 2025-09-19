// app/api/dashboard/stats/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'
import { setoresCD } from '@/data/setores'
import { ativos } from '@/data/ativos'
import { DashboardStats, LojaContagem, AreaCDContagem, LojasPendentesPorResponsavel } from '@/types/dashboard'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const inventario = searchParams.get('inventario')

    if (!inventario) {
      return NextResponse.json({
        success: false,
        error: 'Código do inventário é obrigatório'
      }, { status: 400 })
    }

    // Buscar todas as contagens do inventário
    const { data: contagens, error: errorContagens } = await supabaseServer
      .from('invtrack_contagens')
      .select('tipo, ativo, quantidade, loja, setor_cd')
      .eq('codigo_inventario', inventario)

    if (errorContagens) {
      console.error('Erro ao buscar contagens:', errorContagens)
      return NextResponse.json({
        success: false,
        error: 'Erro ao buscar contagens'
      }, { status: 500 })
    }

    const todasContagens = contagens || []

    // Buscar relação de lojas x responsáveis
    const { data: lojasData, error: errorLojas } = await supabaseServer
      .from('invtrack_lojas_regionais')
      .select('id, nome_loja, responsavel')
      .order('responsavel', { ascending: true })
      .order('nome_loja', { ascending: true })

    if (errorLojas) {
      console.error('Erro ao buscar lojas cadastradas:', errorLojas)
      return NextResponse.json({
        success: false,
        error: 'Erro ao buscar lojas cadastradas'
      }, { status: 500 })
    }

    const lojasRegistradas = (lojasData ?? []).map(loja => ({
      id: loja.id,
      nome: loja.nome_loja?.trim() ?? '',
      responsavel: loja.responsavel?.trim() ?? ''
    })).filter(loja => loja.nome)

    // Processar estatísticas de lojas
    const lojasContadas = new Set(
      todasContagens
        .filter(c => c.tipo === 'loja' && c.loja)
        .map(c => (c.loja as string).trim())
    )

    const lojasDetalhes: LojaContagem[] = lojasRegistradas.map(loja => ({
      loja: loja.nome,
      contada: lojasContadas.has(loja.nome),
      responsavel: loja.responsavel
    }))

    // Processar estatísticas de áreas CD
    const areasCDContadas = new Set(
      todasContagens
        .filter(c => c.tipo === 'cd' && c.setor_cd)
        .map(c => c.setor_cd)
    )

    const areasCDDetalhes: AreaCDContagem[] = setoresCD.map(setor => ({
      setor,
      contada: areasCDContadas.has(setor)
    }))

    // Processar estatísticas de ativos
    const ativosEspecificos = ['HB 623', 'HB 618', 'HNT P', 'HNT G']
    const ativosStats: { [key: string]: number } = {}

    ativosEspecificos.forEach(ativo => {
      const quantidadeTotal = todasContagens
        .filter(c => c.ativo === ativo)
        .reduce((acc, c) => acc + (c.quantidade || 0), 0)
      ativosStats[ativo] = quantidadeTotal
    })

    // Processar lojas pendentes por responsável
    const pendentesPorResponsavel = new Map<string, string[]>()

    lojasDetalhes.forEach(loja => {
      if (!loja.contada) {
        const responsavel = loja.responsavel || 'Sem responsável'
        const lista = pendentesPorResponsavel.get(responsavel) ?? []
        lista.push(loja.loja)
        pendentesPorResponsavel.set(responsavel, lista)
      }
    })

    const lojasPendentesPorResponsavel: LojasPendentesPorResponsavel[] = Array.from(pendentesPorResponsavel.entries())
      .map(([responsavel, lojasPendentes]) => ({
        responsavel,
        lojasPendentes,
        totalPendentes: lojasPendentes.length
      }))
      .filter(item => item.totalPendentes > 0)
      .sort((a, b) => a.responsavel.localeCompare(b.responsavel, 'pt-BR'))

    const totalLojas = lojasDetalhes.length
    const totalLojasContadas = lojasDetalhes.filter(loja => loja.contada).length
    const totalLojasPendentes = totalLojas - totalLojasContadas

    const stats: DashboardStats = {
      lojas: {
        total: totalLojas,
        contadas: totalLojasContadas,
        pendentes: totalLojasPendentes,
        detalhes: lojasDetalhes
      },
      areasCD: {
        total: setoresCD.length,
        contadas: areasCDContadas.size,
        pendentes: setoresCD.length - areasCDContadas.size,
        detalhes: areasCDDetalhes
      },
      ativos: ativosStats,
      lojasPendentes: lojasPendentesPorResponsavel
    }

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}
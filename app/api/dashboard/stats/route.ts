// app/api/dashboard/stats/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'
import { lojas } from '@/data/loja'
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

    // Processar estatísticas de lojas
    const todasAsLojas = Object.values(lojas).flat()
    const lojasContadas = new Set(
      todasContagens
        .filter(c => c.tipo === 'loja' && c.loja)
        .map(c => c.loja)
    )

    const lojasDetalhes: LojaContagem[] = todasAsLojas.map(loja => ({
      loja,
      contada: lojasContadas.has(loja)
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
    const lojasPendentesPorResponsavel: LojasPendentesPorResponsavel[] = Object.entries(lojas).map(([responsavel, lojasResponsavel]) => {
      const lojasPendentes = lojasResponsavel.filter(loja => !lojasContadas.has(loja))
      return {
        responsavel,
        lojasPendentes,
        totalPendentes: lojasPendentes.length
      }
    }).filter(item => item.totalPendentes > 0)

    const stats: DashboardStats = {
      lojas: {
        total: todasAsLojas.length,
        contadas: lojasContadas.size,
        pendentes: todasAsLojas.length - lojasContadas.size,
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
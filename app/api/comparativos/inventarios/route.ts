// app/api/comparativos/inventarios/route.ts
import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'
import { ComparativoInventario } from '@/types/comparativo'

export async function GET() {
  try {
    // Buscar todos os inventários finalizados e o ativo
    const { data: inventarios, error } = await supabaseServer
      .from('invtrack_inventarios')
      .select('*')
      .in('status', ['ativo', 'finalizado'])
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar inventários:', error)
      return NextResponse.json({
        success: false,
        error: 'Erro ao buscar inventários'
      }, { status: 500 })
    }

    // Para cada inventário, buscar estatísticas básicas
    const inventariosComStats: ComparativoInventario[] = []

    for (const inv of inventarios || []) {
      const { data: contagens } = await supabaseServer
        .from('invtrack_contagens')
        .select('*')
        .eq('codigo_inventario', inv.codigo)

      const totalContagens = contagens?.length || 0
      const ativosUnicos = new Set(contagens?.map(c => c.ativo) || [])
      const lojasUnicas = new Set(contagens?.filter(c => c.tipo === 'loja' && c.loja).map(c => c.loja) || [])
      const setoresUnicosCd = new Set(contagens?.filter(c => c.tipo === 'cd' && c.setor_cd).map(c => c.setor_cd) || [])

      inventariosComStats.push({
        id: inv.id,
        codigo: inv.codigo,
        responsavel: inv.responsavel,
        status: inv.status,
        data_criacao: inv.created_at,
        total_contagens: totalContagens,
        total_ativos: ativosUnicos.size,
        total_lojas: lojasUnicas.size,
        total_setores_cd: setoresUnicosCd.size
      })
    }

    return NextResponse.json({
      success: true,
      data: inventariosComStats
    })

  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}
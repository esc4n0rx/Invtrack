// app/api/integrator/monitor/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { integratorMonitor } from '@/lib/integrator-monitor'
import { integratorScheduler } from '@/lib/integrator-scheduler'
import { supabaseServer } from '@/lib/supabase'

export async function GET() {
  try {
    const { data: config } = await supabaseServer
      .from('invtrack_integrator_config')
      .select('*')
      .eq('id', 1)
      .single()

    return NextResponse.json({
      success: true,
      config: {
        isActive: config?.is_active || false,
        intervalSeconds: config?.interval_seconds || 30,
        lastCheck: config?.last_sync || null,
        totalProcessed: config?.total_processed || 0,
        errorCount: config?.error_count || 0
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Erro ao buscar configuração'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, intervalSeconds = 30 } = await request.json()

    if (action === 'start') {
      // Verificar se há inventário ativo
      const { data: inventarioAtivo } = await supabaseServer
        .from('invtrack_inventarios')
        .select('codigo')
        .eq('status', 'ativo')
        .single()

      if (!inventarioAtivo) {
        return NextResponse.json({
          success: false,
          error: 'Nenhum inventário ativo encontrado. Crie um inventário antes de ativar o monitor.'
        }, { status: 400 })
      }

      // Ativar na configuração
      await supabaseServer
        .from('invtrack_integrator_config')
        .upsert({
          id: 1,
          is_active: true,
          interval_seconds: intervalSeconds,
          updated_at: new Date().toISOString()
        })

      // O scheduler vai detectar a mudança e iniciar o monitor automaticamente
      return NextResponse.json({
        success: true,
        message: 'Monitor ativado com sucesso'
      })

    } else if (action === 'stop') {
      // Desativar na configuração
      await supabaseServer
        .from('invtrack_integrator_config')
        .upsert({
          id: 1,
          is_active: false,
          updated_at: new Date().toISOString()
        })

      // O scheduler vai detectar a mudança e parar o monitor automaticamente
      return NextResponse.json({
        success: true,
        message: 'Monitor desativado com sucesso'
      })

    } else if (action === 'check') {
      // Executar verificação manual
      const result = await integratorMonitor.checkTables()
      
      return NextResponse.json({
        success: true,
        result
      })

    } else if (action === 'update_interval') {
      // Atualizar intervalo
      await supabaseServer
        .from('invtrack_integrator_config')
        .update({
          interval_seconds: intervalSeconds,
          updated_at: new Date().toISOString()
        })
        .eq('id', 1)

      // O scheduler vai detectar a mudança e reiniciar o monitor com novo intervalo
      return NextResponse.json({
        success: true,
        message: 'Intervalo atualizado com sucesso'
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Ação não reconhecida'
    }, { status: 400 })

  } catch (error) {
    console.error('Erro na API do monitor:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}
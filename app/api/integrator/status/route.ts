// app/api/integrator/status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'

export async function GET() {
  try {
    // Buscar configuração atual do banco
    const { data: config, error } = await supabaseServer
      .from('invtrack_integrator_config')
      .select('*')
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao buscar config:', error)
      return NextResponse.json({
        success: false,
        error: 'Erro ao buscar status do integrador'
      }, { status: 500 })
    }

    // Configuração padrão se não existir
    const defaultConfig = {
      isActive: false,
      interval: 30,
      lastSync: null,
      totalProcessed: 0,
      errorCount: 0
    }

    const responseConfig = config ? {
      isActive: config.is_active || false,
      interval: config.interval_seconds || 30,
      lastSync: config.last_sync || null,
      totalProcessed: config.total_processed || 0,
      errorCount: config.error_count || 0
    } : defaultConfig

    return NextResponse.json({
      success: true,
      config: responseConfig
    })
  } catch (error) {
    console.error('Erro geral:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, interval } = await request.json()

    if (action === 'start') {
      // Verificar se há inventário ativo
      const { data: inventario } = await supabaseServer
        .from('invtrack_inventarios')
        .select('codigo')
        .eq('status', 'ativo')
        .single()

      if (!inventario) {
        return NextResponse.json({
          success: false,
          error: 'Não há inventário ativo. Crie um inventário antes de iniciar o integrador.'
        }, { status: 400 })
      }

      // Salvar configuração ativa no banco
      const { error: configError } = await supabaseServer
        .from('invtrack_integrator_config')
        .upsert({
          id: 1,
          is_active: true,
          interval_seconds: interval || 30,
          last_sync: null,
          total_processed: 0,
          error_count: 0,
          updated_at: new Date().toISOString()
        })

      if (configError) {
        console.error('Erro ao salvar config:', configError)
        return NextResponse.json({
          success: false,
          error: 'Erro ao salvar configuração'
        }, { status: 500 })
      }

      // Criar função que executará a sincronização via Supabase Edge Functions
      // Aqui usaremos um approach diferente: marcar como ativo e deixar um cron job externo gerenciar
      await logInfo(`Integrador iniciado com intervalo de ${interval || 30}s`)

      return NextResponse.json({
        success: true,
        config: {
          isActive: true,
          interval: interval || 30,
          lastSync: null,
          totalProcessed: 0,
          errorCount: 0
        }
      })

    } else if (action === 'stop') {
      // Marcar como inativo
      const { error: configError } = await supabaseServer
        .from('invtrack_integrator_config')
        .upsert({
          id: 1,
          is_active: false,
          updated_at: new Date().toISOString()
        })

      if (configError) {
        console.error('Erro ao parar integrador:', configError)
        return NextResponse.json({
          success: false,
          error: 'Erro ao parar integrador'
        }, { status: 500 })
      }

      await logInfo('Integrador parado')

      return NextResponse.json({
        success: true,
        config: {
          isActive: false,
          interval: 30,
          lastSync: null,
          totalProcessed: 0,
          errorCount: 0
        }
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Ação não reconhecida'
    }, { status: 400 })

  } catch (error) {
    console.error('Erro no controle do integrador:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}

async function logInfo(message: string, details?: any) {
  try {
    await supabaseServer
      .from('invtrack_integrator_logs')
      .insert({
        type: 'info',
        message,
        details: details || {}
      })
  } catch (error) {
    console.error('Erro ao criar log:', error)
  }
}
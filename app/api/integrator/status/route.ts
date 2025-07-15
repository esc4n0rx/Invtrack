// app/api/integrator/status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'

export async function GET() {
  try {
    const { data: config, error } = await supabaseServer
      .from('invtrack_integrator_config')
      .select('*')
      .eq('id', 1)
      .single()

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({
        success: false,
        error: 'Erro ao buscar status do integrador'
      }, { status: 500 })
    }

    const responseConfig = config ? {
      isActive: config.is_active || false,
      interval: 30, // Mantido para compatibilidade
      lastSync: config.last_sync || null,
      totalProcessed: config.total_processed || 0,
      errorCount: config.error_count || 0
    } : {
      isActive: false,
      interval: 30,
      lastSync: null,
      totalProcessed: 0,
      errorCount: 0
    }

    return NextResponse.json({
      success: true,
      config: responseConfig
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()

    if (action === 'start') {
      // Verificar inventário ativo
      const { data: inventario } = await supabaseServer
        .from('invtrack_inventarios')
        .select('codigo')
        .eq('status', 'ativo')
        .single()

      if (!inventario) {
        return NextResponse.json({
          success: false,
          error: 'Não há inventário ativo. Crie um inventário antes de ativar o integrador.'
        }, { status: 400 })
      }

      // Ativar integrador
      const { error } = await supabaseServer
        .from('invtrack_integrator_config')
        .upsert({
          id: 1,
          is_active: true,
          updated_at: new Date().toISOString()
        })

      if (error) {
        return NextResponse.json({
          success: false,
          error: 'Erro ao ativar integrador'
        }, { status: 500 })
      }

      await logInfo('Integrador ativado - API webhook liberada')

      return NextResponse.json({
        success: true,
        config: {
          isActive: true,
          interval: 30,
          lastSync: null,
          totalProcessed: 0,
          errorCount: 0
        }
      })

    } else if (action === 'stop') {
      // Desativar integrador
      const { error } = await supabaseServer
        .from('invtrack_integrator_config')
        .upsert({
          id: 1,
          is_active: false,
          updated_at: new Date().toISOString()
        })

      if (error) {
        return NextResponse.json({
          success: false,
          error: 'Erro ao desativar integrador'
        }, { status: 500 })
      }

      await logInfo('Integrador desativado - API webhook bloqueada')

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
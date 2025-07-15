// app/api/integrator/status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'

// Estado global do integrador (em produção, usar Redis ou banco)
let integratorState = {
  isActive: false,
  interval: 30,
  lastSync: null as Date | null,
  totalProcessed: 0,
  errorCount: 0,
  intervalId: null as NodeJS.Timeout | null
}

export async function GET() {
  try {
    // Buscar configuração do banco se existir
    const { data: config } = await supabaseServer
      .from('invtrack_integrator_config')
      .select('*')
      .single()

    if (config) {
      integratorState = {
        ...integratorState,
        ...config,
        lastSync: config.last_sync ? new Date(config.last_sync) : null
      }
    }

    // Remover propriedades não serializáveis
    const { intervalId, ...safeState } = integratorState
    return NextResponse.json({
      success: true,
      config: safeState
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Erro ao buscar status do integrador'
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

      // Parar integrador anterior se existir
      if (integratorState.intervalId) {
        clearInterval(integratorState.intervalId)
      }

      // Iniciar novo integrador
      integratorState.isActive = true
      integratorState.interval = interval || 30

      // Configurar intervalo de sincronização
      // Certifique-se de que startSyncProcess está exportado corretamente em ../sync/route
      const { startSyncProcess } = await import('../sync/route')
      integratorState.intervalId = setInterval(async () => {
        try {
          await startSyncProcess()
        } catch (error) {
          console.error('Erro na sincronização automática:', error)
          await logError('Erro na sincronização automática', error)
        }
      }, integratorState.interval * 1000)

      // Salvar configuração no banco
      await saveConfig()

      // Log de início
      await logInfo(`Integrador iniciado com intervalo de ${integratorState.interval}s`)

    } else if (action === 'stop') {
      // Parar integrador
      if (integratorState.intervalId) {
        clearInterval(integratorState.intervalId)
        integratorState.intervalId = null
      }

      integratorState.isActive = false

      // Salvar configuração no banco
      await saveConfig()

      // Log de parada
      await logInfo('Integrador parado')
    }

    return NextResponse.json({
      success: true,
      config: (({ intervalId, ...rest }) => rest)(integratorState)
    })

  } catch (error) {
    console.error('Erro no controle do integrador:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}

async function saveConfig() {
  await supabaseServer
    .from('invtrack_integrator_config')
    .upsert({
      id: 1,
      is_active: integratorState.isActive,
      interval_seconds: integratorState.interval,
      last_sync: integratorState.lastSync?.toISOString(),
      total_processed: integratorState.totalProcessed,
      error_count: integratorState.errorCount
    })
}

async function logInfo(message: string, details?: any) {
  await supabaseServer
    .from('invtrack_integrator_logs')
    .insert({
      type: 'info',
      message,
      details
    })
}

async function logError(message: string, error: any) {
  integratorState.errorCount++
  await supabaseServer
    .from('invtrack_integrator_logs')
    .insert({
      type: 'error',
      message,
      details: { error: error?.message || error }
    })
}
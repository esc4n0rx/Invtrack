// app/api/integrator/init/route.ts
import { NextResponse } from 'next/server'
import { integratorScheduler } from '@/lib/integrator-scheduler'
import { supabaseServer } from '@/lib/supabase'

export async function POST() {
  try {
    // Primeiro, verificar se conseguimos conectar no Supabase
    const { data: healthCheck, error: healthError } = await supabaseServer
      .from('invtrack_integrator_config')
      .select('id')
      .limit(1)

    if (healthError) {
      console.error('Erro de conectividade com Supabase:', healthError)
      return NextResponse.json({
        success: false,
        error: 'Erro de conectividade com o banco de dados',
        details: healthError.message
      }, { status: 503 })
    }

    // Garantir que a tabela de configuração existe e tem dados
    const { data: config, error: configError } = await supabaseServer
      .from('invtrack_integrator_config')
      .select('*')
      .eq('id', 1)
      .single()

    if (configError && configError.code === 'PGRST116') {
      // Configuração não existe, criar
      console.log('Criando configuração inicial do integrator...')
      const { error: insertError } = await supabaseServer
        .from('invtrack_integrator_config')
        .insert({
          id: 1,
          is_active: false,
          interval_seconds: 30,
          total_processed: 0,
          error_count: 0
        })

      if (insertError) {
        console.error('Erro ao criar configuração inicial:', insertError)
        return NextResponse.json({
          success: false,
          error: 'Erro ao criar configuração inicial',
          details: insertError.message
        }, { status: 500 })
      }
    } else if (configError) {
      console.error('Erro ao verificar configuração:', configError)
      return NextResponse.json({
        success: false,
        error: 'Erro ao verificar configuração',
        details: configError.message
      }, { status: 500 })
    }

    // Inicializar o scheduler
    await integratorScheduler.initialize()
    
    console.log('Integrator inicializado com sucesso')
    
    return NextResponse.json({
      success: true,
      message: 'Integrator inicializado com sucesso',
      config: config || { is_active: false, interval_seconds: 30 }
    })
    
  } catch (error) {
    console.error('Erro crítico ao inicializar integrator:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    const errorStack = error instanceof Error ? error.stack : undefined
    
    return NextResponse.json({
      success: false,
      error: 'Erro crítico ao inicializar integrator',
      details: errorMessage,
      stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
    }, { status: 500 })
  }
}
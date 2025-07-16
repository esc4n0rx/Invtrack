// app/api/integrator/init/route.ts
import { NextResponse } from 'next/server'
import { integratorScheduler } from '@/lib/integrator-scheduler'

export async function POST() {
  try {
    await integratorScheduler.initialize()
    
    return NextResponse.json({
      success: true,
      message: 'Scheduler inicializado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao inicializar scheduler:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao inicializar scheduler'
    }, { status: 500 })
  }
}
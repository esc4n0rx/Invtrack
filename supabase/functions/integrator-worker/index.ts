// @ts-nocheck
/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  try {
    // Esta função será chamada por um cron job externo a cada 10 segundos
    const response = await fetch(`${Deno.env.get('NEXT_PUBLIC_SITE_URL')}/api/integrator/worker`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('INTEGRATOR_SECRET_KEY')}`
      }
    })

    const result = await response.json()

    return new Response(JSON.stringify({
      success: true,
      message: 'Worker executado',
      result
    }), {
      headers: { "Content-Type": "application/json" },
    })

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})
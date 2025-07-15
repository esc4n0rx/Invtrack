// components/integrator/IntegratorControl.tsx
"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Play, Square, RefreshCw, Settings, Clock, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useIntegrator } from '@/hooks/useIntegrator'

export function IntegratorControl() {
  const { config, loading, startIntegrator, stopIntegrator, forcSync } = useIntegrator()
  const [selectedInterval, setSelectedInterval] = useState(30)

  const intervalOptions = [
    { value: 5, label: '5 segundos' },
    { value: 10, label: '10 segundos' },
    { value: 30, label: '30 segundos' },
    { value: 60, label: '1 minuto' }
  ]

  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-gray-100 flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Controle do Integrador
          </CardTitle>
          <Badge 
            variant={config.isActive ? "default" : "secondary"}
            className={config.isActive 
              ? "bg-green-900 text-green-300 border-green-700"
              : "bg-gray-800 text-gray-400 border-gray-600"
            }
          >
            {config.isActive ? 'Ativo' : 'Parado'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Intervalo:</span>
            <p className="text-gray-200 font-medium">{config.interval}s</p>
          </div>
          <div>
            <span className="text-gray-400">Processados:</span>
            <p className="text-gray-200 font-medium">{config.totalProcessed}</p>
          </div>
          <div>
            <span className="text-gray-400">Erros:</span>
            <p className="text-gray-200 font-medium">{config.errorCount}</p>
          </div>
          <div>
            <span className="text-gray-400">Última Sync:</span>
            <p className="text-gray-200 font-medium">
              {config.lastSync
                ? new Date(config.lastSync).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })
                : 'Nunca'
              }
            </p>
          </div>
        </div>

        {/* Controles */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-700">
          {!config.isActive ? (
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              <Select value={selectedInterval.toString()} onValueChange={(value) => setSelectedInterval(parseInt(value))}>
                <SelectTrigger className="w-full sm:w-48 bg-gray-800 border-gray-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  {intervalOptions.map(option => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={() => startIntegrator(selectedInterval)}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Play className="h-4 w-4 mr-2" />
                Iniciar
              </Button>
            </div>
          ) : (
            <Button
              onClick={stopIntegrator}
              disabled={loading}
              variant="destructive"
              className="bg-red-600 hover:bg-red-700"
            >
              <Square className="h-4 w-4 mr-2" />
             Parar
           </Button>
         )}

         <Button
           onClick={forcSync}
           disabled={loading}
           variant="outline"
           className="border-gray-600 text-gray-300 hover:bg-gray-800"
         >
           <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
           Sincronizar Agora
         </Button>
       </div>

       {/* Aviso sobre inventário */}
       {!config.isActive && (
         <div className="text-sm text-gray-400 bg-gray-800/50 p-3 rounded-lg">
           <Clock className="h-4 w-4 inline mr-2" />
           O integrador só funciona quando há um inventário ativo no sistema.
         </div>
       )}
     </CardContent>
   </Card>
 )
}
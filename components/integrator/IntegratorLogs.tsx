// components/integrator/IntegratorLogs.tsx
"use client"

import { motion } from "framer-motion"
import { FileText, CheckCircle, XCircle, AlertTriangle, Info, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { IntegratorLog } from "@/types/integrator"

interface IntegratorLogsProps {
  logs: IntegratorLog[]
}

export function IntegratorLogs({ logs }: IntegratorLogsProps) {
  const getLogIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-400" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-400" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-400" />
      default:
        return <Info className="h-4 w-4 text-blue-400" />
    }
  }

  const getLogVariant = (type: string) => {
    switch (type) {
      case 'success':
        return 'default'
      case 'error':
        return 'destructive'
      case 'warning':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader>
        <CardTitle className="text-gray-100 flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-400" />
          Logs do Integrador
          <Badge variant="outline" className="ml-auto">
            {logs.length} registros
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-3">
            {logs.map((log, index) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start gap-3 p-3 bg-gray-800 rounded-lg"
              >
                <div className="mt-1">
                  {getLogIcon(log.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={getLogVariant(log.type)} className="text-xs">
                      {log.type.toUpperCase()}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="h-3 w-3" />
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                    {log.processed_count && log.processed_count > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {log.processed_count} processados
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-gray-200 text-sm mb-2">{log.message}</p>
                  
                  {log.details && (
                    <details className="text-xs">
                      <summary className="text-gray-400 cursor-pointer hover:text-gray-300">
                        Detalhes
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-900 rounded text-gray-300 overflow-x-auto">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </motion.div>
            ))}
            
            {logs.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum log encontrado</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
// components/integrator/IntegratorLogs.tsx
"use client"

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, AlertTriangle, Info, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { IntegratorLog } from '@/types/integrator'

interface IntegratorLogsProps {
  logs: IntegratorLog[]
  onRefresh: () => void
}

export function IntegratorLogs({ logs, onRefresh }: IntegratorLogsProps) {
  const [filter, setFilter] = useState<'all' | 'success' | 'error' | 'warning' | 'info'>('all')

  const filteredLogs = logs.filter(log => 
    filter === 'all' || log.type === filter
  )

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-400" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-400" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-400" />
      case 'info':
        return <Info className="h-4 w-4 text-blue-400" />
      default:
        return <Info className="h-4 w-4 text-gray-400" />
    }
  }

  const getLogBadgeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-900 text-green-300 border-green-700'
      case 'error':
        return 'bg-red-900 text-red-300 border-red-700'
      case 'warning':
        return 'bg-yellow-900 text-yellow-300 border-yellow-700'
      case 'info':
        return 'bg-blue-900 text-blue-300 border-blue-700'
      default:
        return 'bg-gray-800 text-gray-400 border-gray-600'
    }
  }

  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-gray-100">Logs do Integrador</CardTitle>
          <div className="flex gap-2">
            <Button
              onClick={onRefresh}
              variant="outline"
              size="sm"
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Atualizar
            </Button>
          </div>
        </div>
        
        {/* Filtros */}
        <div className="flex flex-wrap gap-2 pt-2">
          {['all', 'success', 'error', 'warning', 'info'].map(type => (
            <Button
              key={type}
              onClick={() => setFilter(type as any)}
              variant={filter === type ? 'default' : 'ghost'}
              size="sm"
              className={filter === type 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
              }
            >
              {type === 'all' ? 'Todos' : type.charAt(0).toUpperCase() + type.slice(1)}
              <Badge variant="secondary" className="ml-2 bg-gray-700 text-gray-300">
                {type === 'all' ? logs.length : logs.filter(l => l.type === type).length}
              </Badge>
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <AnimatePresence>
            {filteredLogs.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhum log encontrado</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredLogs.map((log, index) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-3 rounded-lg bg-gray-800/50 border border-gray-700"
                  >
                    <div className="flex items-start gap-3">
                      {getLogIcon(log.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getLogBadgeColor(log.type)}>
                            {log.type}
                          </Badge>
                          <span className="text-xs text-gray-400">
                            {new Date(log.timestamp).toLocaleString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })}
                          </span>
                          {log.processed_count && (
                            <Badge variant="secondary" className="bg-gray-700 text-gray-300">
                              {log.processed_count} processados
                            </Badge>
                          )}
                        </div>
                        <p className="text-gray-200 text-sm">{log.message}</p>
                        {log.details && (
                          <details className="mt-2">
                            <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-300">
                              Ver detalhes
                            </summary>
                            <pre className="text-xs text-gray-500 mt-1 bg-gray-900 p-2 rounded overflow-x-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
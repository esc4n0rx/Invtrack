// components/pages/integrator-page.tsx (atualizado)
"use client"

import { motion } from "framer-motion"
import { Activity, Zap, Database, AlertCircle, Bell, Settings2, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { IntegratorControl } from "@/components/integrator/IntegratorControl"
import { IntegratorLogs } from "@/components/integrator/IntegratorLogs"
import { IntegratorNotifications } from "@/components/integrator/IntegratorNotifications"
import { useIntegrator } from "@/hooks/useIntegrator"
import { useInventario } from "@/hooks/useInventario"

export function IntegratorPage() {
  const { 
    config, 
    logs, 
    syncProgress, 
    notifications, 
    unreadCount, 
    fetchLogs, 
    markNotificationsAsRead,
    resetSequenceControl 
  } = useIntegrator()
  const { inventarioAtivo, loading } = useInventario()

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-100 flex items-center gap-3">
              <Zap className="h-8 w-8 text-blue-400" />
              Integrador de Contagens
              <Badge 
                variant={config.syncStrategy === 'sequence' ? 'default' : 'secondary'}
                className="ml-2"
              >
                {config.syncStrategy === 'sequence' ? 'Sequencial' : 'Temporal'}
              </Badge>
            </h1>
            <p className="text-gray-400 mt-1">
              Monitora e importa contagens do sistema externo automaticamente com controle de sequência
            </p>
          </div>
          
          {/* Notificações */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={markNotificationsAsRead}
              className="relative"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center text-xs"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={resetSequenceControl}
              className="border-yellow-600 text-yellow-300 hover:bg-yellow-900/20"
            >
              <Settings2 className="h-4 w-4 mr-2" />
              Reset Sequência
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Status do Inventário */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {loading ? (
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="flex items-center gap-2 py-4">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
              <span className="text-gray-400">Verificando inventário ativo...</span>
            </CardContent>
          </Card>
        ) : inventarioAtivo ? (
          <Alert className="bg-green-900/20 border-green-700">
            <Database className="h-4 w-4" />
            <AlertDescription className="text-green-300">
              <strong>Inventário Ativo:</strong> {inventarioAtivo.codigo} - {inventarioAtivo.responsavel}
              <br />
              <span className="text-sm text-green-400">
                O integrador pode ser usado para importar contagens automaticamente.
              </span>
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="bg-red-900/20 border-red-700">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-300">
              <strong>Nenhum inventário ativo encontrado.</strong>
              <br />
              <span className="text-sm text-red-400">
                Crie um inventário ativo na página inicial antes de usar o integrador.
              </span>
            </AlertDescription>
          </Alert>
        )}
      </motion.div>

      {/* Progress de Sincronização */}
      {syncProgress.isRunning && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
        >
          <Card className="bg-blue-900/20 border-blue-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-300 font-medium">Sincronização em andamento...</span>
                <span className="text-blue-400 text-sm">
                  {syncProgress.recordsProcessed} / {syncProgress.recordsFound}
                </span>
              </div>
              <Progress 
                value={(syncProgress.recordsProcessed / syncProgress.recordsFound) * 100} 
                className="h-2"
              />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Controle do Integrador */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <IntegratorControl />
      </motion.div>

      {/* Informações das Tabelas Monitoradas */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-100 flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-400" />
              Contagens de Lojas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">
              <p className="text-gray-400">Tabela monitorada:</p>
              <code className="text-green-400 bg-gray-800 px-2 py-1 rounded">contagens</code>
            </div>
            <div className="text-sm">
              <p className="text-gray-400">Método de sincronização:</p>
              <Badge variant="outline" className="text-blue-400 border-blue-600">
                RPC + Controle de Sequência
              </Badge>
            </div>
            <div className="text-sm">
              <p className="text-gray-400">Último ID processado:</p>
              <code className="text-yellow-400 bg-gray-800 px-2 py-1 rounded">
                {config.lastContagemId || 0}
              </code>
            </div>
            <div className="text-sm">
              <p className="text-gray-400">Estrutura esperada:</p>
              <ul className="text-gray-300 space-y-1 ml-4">
                <li>• <code>id</code> - ID sequencial (controle)</li>
                <li>• <code>email</code> - Email do responsável</li>
                <li>• <code>loja_nome</code> - Nome da loja</li>
                <li>• <code>ativo_nome</code> - Nome do ativo</li>
                <li>• <code>quantidade</code> - Quantidade contada</li>
                <li>• <code>processado</code> - Flag de processamento</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-100 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-400" />
              Contagens de Trânsito
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">
              <p className="text-gray-400">Tabela monitorada:</p>
              <code className="text-green-400 bg-gray-800 px-2 py-1 rounded">contagens_transito</code>
            </div>
            <div className="text-sm">
              <p className="text-gray-400">Método de sincronização:</p>
              <Badge variant="outline" className="text-purple-400 border-purple-600">
                RPC + Controle de Sequência
              </Badge>
            </div>
            <div className="text-sm">
              <p className="text-gray-400">Último ID processado:</p>
              <code className="text-yellow-400 bg-gray-800 px-2 py-1 rounded">
                {config.lastTransitoId || 0}
              </code>
            </div>
            <div className="text-sm">
              <p className="text-gray-400">CDs monitorados:</p>
              <div className="flex gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">CD SP → CD RIO</Badge>
                <Badge variant="secondary" className="text-xs">CD ES → CD RIO</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Notificações */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <IntegratorNotifications notifications={notifications} />
      </motion.div>

      {/* Logs do Integrador */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <IntegratorLogs logs={logs} onRefresh={fetchLogs} />
      </motion.div>

      {/* Estatísticas Avançadas */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-2 md:grid-cols-5 gap-4"
      >
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{config.totalProcessed}</div>
            <div className="text-sm text-gray-400">Total Processados</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-400">{config.errorCount}</div>
            <div className="text-sm text-gray-400">Erros</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{config.interval}s</div>
            <div className="text-sm text-gray-400">Intervalo</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">{unreadCount}</div>
            <div className="text-sm text-gray-400">Notificações</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-4 text-center">
            <div className={`text-2xl font-bold ${config.isActive ? 'text-green-400' : 'text-gray-400'}`}>
              {config.isActive ? 'ON' : 'OFF'}
            </div>
            <div className="text-sm text-gray-400">Status</div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
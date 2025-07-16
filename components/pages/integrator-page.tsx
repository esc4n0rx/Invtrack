// components/pages/integrator-page.tsx
"use client"

import { motion } from "framer-motion"
import { Zap, Globe, Key, Activity, Clock, AlertCircle, Copy, Trash2, Plus, Play, Pause, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { IntegratorLogs } from "@/components/integrator/IntegratorLogs"
import { useIntegrator } from "@/hooks/useIntegrator"
import { useInventario } from "@/hooks/useInventario"
import { toast } from "sonner"

export function IntegratorPage() {
  const { 
    config, 
    logs, 
    webhookTokens, 
    webhookStats, 
    loading,
    toggleIntegrator,
    executeManualCheck,
    generateNewToken,
    revokeToken
  } = useIntegrator()

  const { inventarioAtivo } = useInventario()

  const webhookUrl = `${window.location.origin}/api/integrator/webhook`

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copiado para área de transferência!')
  }

  const handleManualCheck = async () => {
    await executeManualCheck()
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-100 flex items-center gap-3">
              <Zap className="h-8 w-8 text-blue-400" />
              Integrador de Contagens
              <Badge variant={config.isActive ? 'default' : 'secondary'}>
                {config.isActive ? 'Ativo' : 'Inativo'}
              </Badge>
            </h1>
            <p className="text-gray-400 mt-1">
              Monitora automaticamente as tabelas externas e processa novas contagens
            </p>
            {inventarioAtivo && (
              <p className="text-sm text-blue-400 mt-1">
                Inventário ativo: {inventarioAtivo.codigo} - {inventarioAtivo.responsavel}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              onClick={handleManualCheck}
              disabled={loading}
              variant="outline"
              className="border-blue-600 text-blue-400 hover:bg-blue-600/10"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Verificar Agora
            </Button>
            
            <Button
              onClick={toggleIntegrator}
              disabled={loading}
              variant={config.isActive ? 'destructive' : 'default'}
              size="lg"
            >
              {config.isActive ? (
              <>
              <Pause className="h-4 w-4 mr-2" />
              Parar Monitor
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Iniciar Monitor
            </>
          )}
        </Button>
      </div>
    </div>
  </motion.div>

    {/* Alerta se não há inventário ativo */}
    {!inventarioAtivo && (
      <Alert className="border-yellow-700 bg-yellow-900/20">
        <AlertCircle className="h-4 w-4 text-yellow-400" />
        <AlertDescription className="text-yellow-300">
          Nenhum inventário ativo encontrado. É necessário ter um inventário ativo para usar o integrador.
        </AlertDescription>
      </Alert>
    )}

    {/* Estatísticas */}
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Status</p>
                <p className="text-lg font-semibold text-gray-100">
                  {config.isActive ? 'Monitorando' : 'Parado'}
                </p>
              </div>
              <Activity className={`h-8 w-8 ${config.isActive ? 'text-green-400' : 'text-gray-400'}`} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Processado</p>
                <p className="text-lg font-semibold text-gray-100">
                  {config.totalProcessed.toLocaleString()}
                </p>
              </div>
              <Globe className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Última Verificação</p>
                <p className="text-lg font-semibold text-gray-100">
                  {config.lastSync ? new Date(config.lastSync).toLocaleTimeString() : 'Nunca'}
                </p>
              </div>
              <Clock className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Erros</p>
                <p className="text-lg font-semibold text-gray-100">
                  {config.errorCount}
                </p>
              </div>
              <AlertCircle className={`h-8 w-8 ${config.errorCount > 0 ? 'text-red-400' : 'text-gray-400'}`} />
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>

    {/* Configuração do Monitor */}
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-100 flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-400" />
            Configuração do Monitor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-200 mb-2">Tabelas Monitoradas</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-gray-800 rounded">
                  <span className="text-sm text-gray-300">contagens (Lojas)</span>
                  <Badge variant="outline">Ativo</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-800 rounded">
                  <span className="text-sm text-gray-300">contagens_transito (Trânsito)</span>
                  <Badge variant="outline">Ativo</Badge>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-200 mb-2">Mapeamento de Dados</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <div>• Contagens → tipo: 'loja'</div>
                <div>• Contagens Trânsito → tipo: 'transito'</div>
                <div>• CD SP → CD SÃO PAULO</div>
                <div>• CD ES → CD ESPIRITO SANTO</div>
                <div>• Destino padrão → CD RIO</div>
              </div>
            </div>
          </div>

          <Alert className="border-blue-700 bg-blue-900/20">
            <AlertCircle className="h-4 w-4 text-blue-400" />
            <AlertDescription className="text-blue-300">
              O monitor verifica automaticamente as tabelas externas a cada 30 segundos quando ativo.
              Novas contagens são processadas e gravadas na tabela principal com a observação "Capturado pelo integrator".
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </motion.div>

    {/* Seção de Webhooks (mantida para compatibilidade) */}
    {/* REMOVIDO: Seção de Webhook API */}

    {/* Logs */}
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <IntegratorLogs logs={logs} />
    </motion.div>
  </div>
)
}
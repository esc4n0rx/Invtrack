// components/pages/integrator-page.tsx
"use client"

import { motion } from "framer-motion"
import { Activity, Zap, Database, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { IntegratorControl } from "@/components/integrator/IntegratorControl"
import { IntegratorLogs } from "@/components/integrator/IntegratorLogs"
import { useIntegrator } from "@/hooks/useIntegrator"
import { useInventario } from "@/hooks/useInventario"

export function IntegratorPage() {
  const { config, logs, fetchLogs } = useIntegrator()
  const { inventarioAtivo, loading } = useInventario()

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-gray-100 flex items-center gap-3">
          <Zap className="h-8 w-8 text-blue-400" />
          Integrador de Contagens
        </h1>
        <p className="text-gray-400 mt-1">
          Monitora e importa contagens do sistema externo automaticamente
        </p>
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
              <p className="text-gray-400">Estrutura esperada:</p>
              <ul className="text-gray-300 space-y-1 ml-4">
                <li>• <code>email</code> - Email do responsável</li>
                <li>• <code>loja_nome</code> - Nome da loja</li>
                <li>• <code>ativo_nome</code> - Nome do ativo (deve estar na lista oficial)</li>
                <li>• <code>quantidade</code> - Quantidade contada</li>
              </ul>
            </div>
            <div className="text-sm">
              <p className="text-gray-400">Destino:</p>
              <p className="text-gray-300">Tabela <code className="bg-gray-800 px-1 rounded">invtrack_contagens</code> como tipo <code className="text-blue-400">'loja'</code></p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-100 flex items-center gap-2">
              <Database className="h-5 w-5 text-orange-400" />
              Contagens de Trânsito
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">
              <p className="text-gray-400">Tabela monitorada:</p>
              <code className="text-green-400 bg-gray-800 px-2 py-1 rounded">contagens_transito</code>
            </div>
            <div className="text-sm">
              <p className="text-gray-400">Estrutura esperada:</p>
              <ul className="text-gray-300 space-y-1 ml-4">
                <li>• <code>email</code> - Email do responsável</li>
                <li>• <code>loja_nome</code> - CD SP ou CD ES</li>
                <li>• <code>ativo_nome</code> - Nome do ativo</li>
                <li>• <code>quantidade</code> - Quantidade em trânsito</li>
              </ul>
            </div>
            <div className="text-sm">
              <p className="text-gray-400">Mapeamento:</p>
              <ul className="text-gray-300 space-y-1 ml-4">
                <li>• CD SP → CD SÃO PAULO</li>
                <li>• CD ES → CD ESPIRITO SANTO</li>
                <li>• Destino sempre: CD RIO</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Logs do Integrador */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <IntegratorLogs logs={logs} onRefresh={fetchLogs} />
      </motion.div>

      {/* Estatísticas */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
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
            <div className="text-sm text-gray-400">Intervalo Atual</div>
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
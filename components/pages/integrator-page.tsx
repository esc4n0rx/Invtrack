// components/pages/integrator-page.tsx
"use client"

import { motion } from "framer-motion"
import { Zap, Globe, Key, Activity, Clock, AlertCircle, Copy, Trash2, Plus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { IntegratorLogs } from "@/components/integrator/IntegratorLogs"
import { useIntegrator } from "@/hooks/useIntegrator"
import { toast } from "sonner"

export function IntegratorPage() {
  const { 
    config, 
    logs, 
    webhookTokens, 
    webhookStats, 
    loading,
    toggleIntegrator,
    generateNewToken,
    revokeToken
  } = useIntegrator()

  const webhookUrl = `${window.location.origin}/api/integrator/webhook`

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copiado para área de transferência!')
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
              Recebe contagens via webhook de sistemas externos em tempo real
            </p>
          </div>
          
          <Button
            onClick={toggleIntegrator}
            disabled={loading}
            variant={config.isActive ? 'destructive' : 'default'}
            size="lg"
          >
            {config.isActive ? 'Desativar' : 'Ativar'} Integrador
          </Button>
        </div>
      </motion.div>

      {/* Status do Webhook */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-100 flex items-center gap-2">
              <Globe className="h-5 w-5 text-green-400" />
              API Webhook
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400 mb-2">Endpoint:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-gray-800 text-green-400 px-3 py-2 rounded text-sm">
                    {webhookUrl}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(webhookUrl)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-400 mb-2">Método:</p>
                <Badge variant="outline" className="text-blue-400 border-blue-600">
                  POST
                </Badge>
              </div>
            </div>

            <Alert className="border-blue-600 bg-blue-950/20">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Estrutura JSON esperada:</strong>
                <pre className="mt-2 text-xs bg-gray-800 p-3 rounded overflow-x-auto">
{`{
  "contagens": [
    {
      "email": "usuario@empresa.com",
      "ativo_nome": "Nome do Ativo",
      "quantidade": 10,
      "loja_nome": "Nome da Loja", // opcional
      "tipo": "loja", // opcional: loja, cd, fornecedor, transito
      "obs": "Observações" // opcional
    }
  ]
}`}
                </pre>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tokens de Acesso */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-gray-100 flex items-center gap-2">
                <Key className="h-5 w-5 text-yellow-400" />
                Tokens de Acesso
              </CardTitle>
              <Button
                onClick={generateNewToken}
                disabled={loading}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Gerar Token
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {webhookTokens.map((token) => (
                <div
                  key={token.id}
                  className="flex items-center justify-between p-3 bg-gray-800 rounded">
                  <div className="flex-1">
                   <div className="flex items-center gap-2 mb-1">
                     <code className="text-yellow-400 text-sm">
                       {token.token.slice(0, 16)}...
                     </code>
                     <Badge variant={token.is_active ? 'default' : 'secondary'}>
                       {token.is_active ? 'Ativo' : 'Inativo'}
                     </Badge>
                   </div>
                   <div className="text-xs text-gray-400 space-x-4">
                     <span>Criado: {new Date(token.created_at).toLocaleDateString()}</span>
                     <span>Uso: {token.requests_count} requisições</span>
                     {token.last_used && (
                       <span>Último uso: {new Date(token.last_used).toLocaleString()}</span>
                     )}
                   </div>
                 </div>
                 <div className="flex items-center gap-2">
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={() => copyToClipboard(token.token)}
                   >
                     <Copy className="h-4 w-4" />
                   </Button>
                   <Button
                     variant="destructive"
                     size="sm"
                     onClick={() => revokeToken(token.id)}
                     disabled={loading}
                   >
                     <Trash2 className="h-4 w-4" />
                   </Button>
                 </div>
               </div>
             ))}
             
             {webhookTokens.length === 0 && (
               <p className="text-gray-400 text-center py-4">
                 Nenhum token de acesso encontrado
               </p>
             )}
           </div>
         </CardContent>
       </Card>
     </motion.div>

     {/* Estatísticas */}
     <motion.div
       initial={{ opacity: 0, y: 20 }}
       animate={{ opacity: 1, y: 0 }}
       transition={{ delay: 0.3 }}
     >
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         <Card className="bg-gray-900 border-gray-700">
           <CardContent className="p-4">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-gray-400 text-sm">Total Processado</p>
                 <p className="text-2xl font-bold text-gray-100">{config.totalProcessed}</p>
               </div>
               <Activity className="h-8 w-8 text-blue-400" />
             </div>
           </CardContent>
         </Card>

         <Card className="bg-gray-900 border-gray-700">
           <CardContent className="p-4">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-gray-400 text-sm">Requisições Total</p>
                 <p className="text-2xl font-bold text-gray-100">{webhookStats.totalRequests}</p>
               </div>
               <Globe className="h-8 w-8 text-green-400" />
             </div>
           </CardContent>
         </Card>

         <Card className="bg-gray-900 border-gray-700">
           <CardContent className="p-4">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-gray-400 text-sm">Taxa de Sucesso</p>
                 <p className="text-2xl font-bold text-gray-100">
                   {webhookStats.totalRequests > 0 
                     ? Math.round((webhookStats.successfulRequests / webhookStats.totalRequests) * 100)
                     : 0
                   }%
                 </p>
               </div>
               <Badge variant="default" className="text-green-400">
                 {webhookStats.successfulRequests}/{webhookStats.totalRequests}
               </Badge>
             </div>
           </CardContent>
         </Card>

         <Card className="bg-gray-900 border-gray-700">
           <CardContent className="p-4">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-gray-400 text-sm">Tempo Médio</p>
                 <p className="text-2xl font-bold text-gray-100">
                   {webhookStats.averageProcessingTime}ms
                 </p>
               </div>
               <Clock className="h-8 w-8 text-yellow-400" />
             </div>
           </CardContent>
         </Card>
       </div>
     </motion.div>

     {/* Última Sincronização */}
     {config.lastSync && (
       <motion.div
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ delay: 0.4 }}
       >
         <Card className="bg-gray-900 border-gray-700">
           <CardContent className="p-4">
             <div className="flex items-center gap-3">
               <Clock className="h-5 w-5 text-blue-400" />
               <div>
                 <p className="text-gray-400 text-sm">Última atividade</p>
                 <p className="text-gray-100 font-medium">
                   {new Date(config.lastSync).toLocaleString()}
                 </p>
               </div>
             </div>
           </CardContent>
         </Card>
       </motion.div>
     )}

     {/* Logs do Integrador */}
     <motion.div
       initial={{ opacity: 0, y: 20 }}
       animate={{ opacity: 1, y: 0 }}
       transition={{ delay: 0.5 }}
     >
       <IntegratorLogs logs={logs} />
     </motion.div>
   </div>
 )
}
                  
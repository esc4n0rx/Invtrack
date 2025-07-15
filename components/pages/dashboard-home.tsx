// components/pages/dashboard-home.tsx
"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Plus, Store, Warehouse, AlertCircle, Package, TrendingUp, Activity, CheckCircle, XCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useIntegrator} from "@/hooks/useIntegrator"
import { useInventario } from "@/hooks/useInventario"
import { useDashboardStats } from "@/hooks/useDashboardStats"
import { LojasPendentesModal } from "@/components/dashboard/LojasPendentesModal"

import { toast } from "sonner"

export function DashboardHome() {
  const [isNewInventoryOpen, setIsNewInventoryOpen] = React.useState(false)
  const [isLojasPendentesOpen, setIsLojasPendentesOpen] = React.useState(false)
  const [nomeResponsavel, setNomeResponsavel] = React.useState("")
  const [isCreating, setIsCreating] = React.useState(false)
  const { config: integratorConfig } = useIntegrator()
  const { inventarioAtivo, loading, error, criarNovoInventario, finalizarInventarioAtivo } = useInventario()
  const { stats, loading: loadingStats, error: errorStats, recarregar } = useDashboardStats(inventarioAtivo?.codigo)

  React.useEffect(() => {
    if (integratorConfig.lastSync && recarregar) {
      recarregar();
    }
  }, [integratorConfig.lastSync, recarregar]);

  const handleCriarInventario = async () => {
    if (!nomeResponsavel.trim()) {
      toast.error("Por favor, informe o nome do responsável")
      return
    }

    setIsCreating(true)
    try {
      const result = await criarNovoInventario(nomeResponsavel.trim())
      
      if (result.success) {
        toast.success(`Inventário ${result.data?.codigo} criado com sucesso!`)
        setIsNewInventoryOpen(false)
        setNomeResponsavel("")
      } else {
        toast.error(result.error || "Erro ao criar inventário")
      }
    } catch (error) {
      toast.error("Erro inesperado ao criar inventário")
    } finally {
      setIsCreating(false)
    }
  }

  const handleFinalizarInventario = async () => {
    if (!inventarioAtivo) return

    const confirmacao = confirm(
      `Tem certeza que deseja finalizar o inventário ${inventarioAtivo.codigo}? Esta ação não pode ser desfeita.`
    )

    if (!confirmacao) return

    const result = await finalizarInventarioAtivo()
    
    if (result.success) {
      toast.success("Inventário finalizado com sucesso!")
    } else {
      toast.error(result.error || "Erro ao finalizar inventário")
    }
  }

  // Calcular totais de ativos
  const totalAtivos = React.useMemo(() => {
    if (!stats?.ativos) return 0
    return Object.values(stats.ativos).reduce((acc, quantidade) => acc + quantidade, 0)
  }, [stats])

  // Calcular progresso das contagens
  const progressoLojas = React.useMemo(() => {
    if (!stats?.lojas.total) return 0
    return Math.round((stats.lojas.contadas / stats.lojas.total) * 100)
  }, [stats])

  const progressoCD = React.useMemo(() => {
    if (!stats?.areasCD.total) return 0
    return Math.round((stats.areasCD.contadas / stats.areasCD.total) * 100)
  }, [stats])

  return (
    <div className="p-6 space-y-6 bg-gray-950 min-h-full">
      {/* Header da página */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Dashboard Principal</h1>
          <p className="text-gray-400 mt-1">
            {inventarioAtivo 
              ? `Inventário ativo: ${inventarioAtivo.codigo} - ${inventarioAtivo.responsavel}`
              : "Nenhum inventário ativo"
            }
          </p>
        </div>

        {/* Status do inventário ativo */}
        {loading ? (
          <div className="flex items-center gap-2 text-gray-400">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
            Carregando...
          </div>
        ) : inventarioAtivo ? (
          <div className="flex items-center gap-3">
            <Badge className="bg-green-900 text-green-300 border-green-700 flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Inventário Ativo
            </Badge>
            <Button 
              onClick={handleFinalizarInventario}
              variant="destructive"
              className="bg-red-600 hover:bg-red-700"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Finalizar Inventário
            </Button>
          </div>
        ) : (
          <Dialog open={isNewInventoryOpen} onOpenChange={setIsNewInventoryOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Novo Inventário
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-gray-100">Criar Novo Inventário</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Informe o nome do responsável pelo inventário. Um código será gerado automaticamente.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="responsavel" className="text-gray-300">
                    Nome do Responsável
                  </Label>
                  <Input
                    id="responsavel"
                    placeholder="Digite o nome do responsável"
                    value={nomeResponsavel}
                    onChange={(e) => setNomeResponsavel(e.target.value)}
                    className="bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-400"
                    disabled={isCreating}
                  />
                </div>
                {nomeResponsavel.trim() && (
                  <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <p className="text-sm text-gray-400 mb-2">Código que será gerado:</p>
                    <p className="text-lg font-mono font-bold text-blue-400">
                      INV{new Date().toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase()}-XXX
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      O número final será gerado automaticamente
                    </p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsNewInventoryOpen(false)}
                  disabled={isCreating}
                  className="border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleCriarInventario}
                  disabled={!nomeResponsavel.trim() || isCreating}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isCreating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Criando...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Inventário
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </motion.div>

      {/* Exibir erro se houver */}
      {(error || errorStats) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-900/20 border border-red-700 rounded-lg p-4"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <p className="text-red-300 text-sm">{error || errorStats}</p>
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-100 flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-400" />
              Status da Integração
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${integratorConfig.isActive ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
                <span className="text-gray-300">
                  {integratorConfig.isActive ? 'Integrador Ativo' : 'Integrador Parado'}
                </span>
              </div>
              {integratorConfig.isActive && (
                <Badge className="bg-blue-900 text-blue-300 border-blue-700">
                  Sync a cada {integratorConfig.interval}s
                </Badge>
              )}
            </div>
            {integratorConfig.lastSync && (
              <p className="text-sm text-gray-400 mt-2">
                Última sincronização: {new Date(integratorConfig.lastSync).toLocaleString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Cards de métricas principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
          <Card className="bg-gray-900 border-gray-700 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total de Lojas</CardTitle>
              <Store className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-700 rounded w-16 mb-1"></div>
                  <div className="h-4 bg-gray-700 rounded w-24"></div>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold text-gray-100">{stats?.lojas.total || 0}</div>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats?.lojas.contadas || 0} contadas, {stats?.lojas.pendentes || 0} pendentes
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
          <Card className="bg-gray-900 border-gray-700 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Áreas CD Contadas</CardTitle>
              <Warehouse className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-700 rounded w-16 mb-1"></div>
                  <div className="h-4 bg-gray-700 rounded w-24"></div>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold text-gray-100">{stats?.areasCD.contadas || 0}</div>
                  <p className="text-xs text-gray-500 mt-1">
                    de {stats?.areasCD.total || 0} áreas totais
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
          <Card className="bg-gray-900 border-gray-700 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Ativos Contados</CardTitle>
              <Package className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-700 rounded w-16 mb-1"></div>
                  <div className="h-4 bg-gray-700 rounded w-24"></div>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold text-gray-100">{totalAtivos.toLocaleString()}</div>
                  {stats?.ativos && Object.keys(stats.ativos).length > 0 && (
                    <div className="mt-2 space-y-1">
                      {Object.entries(stats.ativos).map(([ativo, quantidade]) => (
                        <div key={ativo} className="flex justify-between text-xs">
                          <span className="text-gray-400">{ativo}:</span>
                          <span className="text-gray-300">{quantidade}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}>
          <Card 
            className="bg-gray-900 border-gray-700 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setIsLojasPendentesOpen(true)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Lojas Pendentes</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-700 rounded w-24"></div>
               </div>
             ) : (
               <>
                 <div className="text-2xl font-bold text-gray-100">{stats?.lojas.pendentes || 0}</div>
                 <p className="text-xs text-orange-600 mt-1">Clique para ver detalhes</p>
               </>
             )}
           </CardContent>
         </Card>
       </motion.div>
     </div>

     {/* Gráficos e atividades */}
     <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
       <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
         <Card className="bg-gray-900 border-gray-700">
           <CardHeader>
             <CardTitle className="text-gray-100">Progresso das Contagens</CardTitle>
             <CardDescription className="text-gray-400">Status atual das contagens</CardDescription>
           </CardHeader>
           <CardContent className="space-y-4">
             {loadingStats ? (
               <div className="space-y-4">
                 {[1, 2].map((i) => (
                   <div key={i} className="animate-pulse">
                     <div className="flex justify-between mb-2">
                       <div className="h-4 bg-gray-700 rounded w-20"></div>
                       <div className="h-4 bg-gray-700 rounded w-12"></div>
                     </div>
                     <div className="h-2 bg-gray-700 rounded"></div>
                   </div>
                 ))}
               </div>
             ) : (
               <>
                 <div className="space-y-2">
                   <div className="flex justify-between text-sm">
                     <span className="text-gray-300">Lojas Contadas</span>
                     <span className="text-gray-400">
                       {stats?.lojas.contadas || 0}/{stats?.lojas.total || 0}
                     </span>
                   </div>
                   <Progress value={progressoLojas} className="h-2" />
                 </div>
                 <div className="space-y-2">
                   <div className="flex justify-between text-sm">
                     <span className="text-gray-300">Áreas CD Contadas</span>
                     <span className="text-gray-400">
                       {stats?.areasCD.contadas || 0}/{stats?.areasCD.total || 0}
                     </span>
                   </div>
                   <Progress value={progressoCD} className="h-2" />
                 </div>
               </>
             )}
           </CardContent>
         </Card>
       </motion.div>

       <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}>
         <Card className="bg-gray-900 border-gray-700">
           <CardHeader>
             <CardTitle className="flex items-center gap-2 text-gray-100">
               <Activity className="h-5 w-5 text-blue-600" />
               Atividade Recente
             </CardTitle>
             <CardDescription className="text-gray-400">Últimas ações do sistema</CardDescription>
           </CardHeader>
           <CardContent className="space-y-4">
             {inventarioAtivo && (
               <div className="flex items-center space-x-3">
                 <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                 <div className="flex-1">
                   <p className="text-sm text-gray-100">
                     Inventário {inventarioAtivo.codigo} criado por {inventarioAtivo.responsavel}
                   </p>
                   <p className="text-xs text-gray-500">
                     {new Date(inventarioAtivo.created_at).toLocaleString('pt-BR')}
                   </p>
                 </div>
               </div>
             )}
             
             {/* Placeholder para outras atividades */}
             <div className="flex items-center space-x-3">
               <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
               <div className="flex-1">
                 <p className="text-sm text-gray-100">Sistema de logs em construção</p>
                 <p className="text-xs text-gray-500">Atividades detalhadas serão exibidas em breve</p>
               </div>
             </div>
             
             {stats && stats.lojas.contadas > 0 && (
               <div className="flex items-center space-x-3">
                 <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                 <div className="flex-1">
                   <p className="text-sm text-gray-100">
                     {stats.lojas.contadas} lojas já foram contadas
                   </p>
                   <p className="text-xs text-gray-500">
                     Progresso: {progressoLojas}% das lojas concluídas
                   </p>
                 </div>
               </div>
             )}
             
             {stats && stats.areasCD.contadas > 0 && (
               <div className="flex items-center space-x-3">
                 <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                 <div className="flex-1">
                   <p className="text-sm text-gray-100">
                     {stats.areasCD.contadas} áreas do CD contadas
                   </p>
                   <p className="text-xs text-gray-500">
                     {stats.areasCD.pendentes} áreas ainda pendentes
                   </p>
                 </div>
               </div>
             )}
           </CardContent>
         </Card>
       </motion.div>
     </div>

     {/* Modal de Lojas Pendentes */}
     <LojasPendentesModal
       open={isLojasPendentesOpen}
       onOpenChange={setIsLojasPendentesOpen}
       lojasPendentes={stats?.lojasPendentes || []}
       totalPendentes={stats?.lojas.pendentes || 0}
     />
   </div>
 )
}
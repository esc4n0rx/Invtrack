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
import { useInventario } from "@/hooks/useInventario"
import { toast } from "sonner"

export function DashboardHome() {
  const [isNewInventoryOpen, setIsNewInventoryOpen] = React.useState(false)
  const [isPendingStoresOpen, setIsPendingStoresOpen] = React.useState(false)
  const [nomeResponsavel, setNomeResponsavel] = React.useState("")
  const [isCreating, setIsCreating] = React.useState(false)

  const { inventarioAtivo, loading, error, criarNovoInventario, finalizarInventarioAtivo } = useInventario()

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

  const pendingStores = [
    { id: 1, name: "Loja Centro", location: "São Paulo - SP", priority: "Alta" },
    { id: 2, name: "Loja Norte", location: "Rio de Janeiro - RJ", priority: "Média" },
    { id: 3, name: "Loja Sul", location: "Porto Alegre - RS", priority: "Baixa" },
  ]

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
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-900/20 border border-red-700 rounded-lg p-4"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        </motion.div>
      )}

      {/* Cards de métricas principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
          <Card className="bg-gray-900 border-gray-700 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total de Lojas</CardTitle>
              <Store className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-100">60</div>
              <p className="text-xs text-gray-500 mt-1">45 contadas, 15 pendentes</p>
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
              <div className="text-2xl font-bold text-gray-100">28</div>
              <p className="text-xs text-gray-500 mt-1">de 35 áreas totais</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
         <Card className="bg-gray-900 border-gray-700 hover:shadow-md transition-shadow">
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-sm font-medium text-gray-400">Ativos Cadastrados</CardTitle>
             <Package className="h-4 w-4 text-purple-600" />
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold text-gray-100">1,247</div>
             <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
               <TrendingUp className="h-3 w-3" />
               +12% vs mês anterior
             </p>
           </CardContent>
         </Card>
       </motion.div>

       <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}>
         <Dialog open={isPendingStoresOpen} onOpenChange={setIsPendingStoresOpen}>
           <DialogTrigger asChild>
             <Card className="bg-gray-900 border-gray-700 hover:shadow-md transition-shadow cursor-pointer">
               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                 <CardTitle className="text-sm font-medium text-gray-400">Lojas Pendentes</CardTitle>
                 <AlertCircle className="h-4 w-4 text-orange-600" />
               </CardHeader>
               <CardContent>
                 <div className="text-2xl font-bold text-gray-100">15</div>
                 <p className="text-xs text-orange-600 mt-1">Clique para ver detalhes</p>
               </CardContent>
             </Card>
           </DialogTrigger>
           <DialogContent className="bg-gray-900 border-gray-700 max-w-2xl">
             <DialogHeader>
               <DialogTitle className="text-gray-100">Lojas Pendentes</DialogTitle>
               <DialogDescription className="text-gray-400">Lista de lojas que ainda precisam ser contadas</DialogDescription>
             </DialogHeader>
             <div className="space-y-3">
               {pendingStores.map((store) => (
                 <div key={store.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700">
                   <div>
                     <p className="font-medium text-gray-100">{store.name}</p>
                     <p className="text-sm text-gray-400">{store.location}</p>
                   </div>
                   <Badge
                     variant={
                       store.priority === "Alta" ? "destructive" : store.priority === "Média" ? "default" : "secondary"
                     }
                     className={
                       store.priority === "Alta"
                         ? "bg-red-900 text-red-300 border-red-700"
                         : store.priority === "Média"
                           ? "bg-yellow-900 text-yellow-300 border-yellow-700"
                           : "bg-gray-700 text-gray-300"
                     }
                   >
                     {store.priority}
                   </Badge>
                 </div>
               ))}
             </div>
           </DialogContent>
         </Dialog>
       </motion.div>
     </div>

     {/* Gráficos e atividades */}
     <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
       <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
         <Card className="bg-gray-900 border-gray-700">
           <CardHeader>
             <CardTitle className="text-gray-100">Progresso das Contagens</CardTitle>
             <CardDescription className="text-gray-400">Status atual das lojas</CardDescription>
           </CardHeader>
           <CardContent className="space-y-4">
             <div className="space-y-2">
               <div className="flex justify-between text-sm">
                 <span className="text-gray-300">Contadas</span>
                 <span className="text-gray-400">45/60</span>
               </div>
               <Progress value={75} className="h-2" />
             </div>
             <div className="space-y-2">
               <div className="flex justify-between text-sm">
                 <span className="text-gray-300">Pendentes</span>
                 <span className="text-gray-400">15/60</span>
               </div>
               <Progress value={25} className="h-2" />
             </div>
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
             <div className="flex items-center space-x-3">
               <div className="w-2 h-2 bg-green-500 rounded-full"></div>
               <div className="flex-1">
                 <p className="text-sm text-gray-100">Loja Centro - Contagem finalizada</p>
                 <p className="text-xs text-gray-500">há 2 horas</p>
               </div>
             </div>
             <div className="flex items-center space-x-3">
               <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
               <div className="flex-1">
                 <p className="text-sm text-gray-100">Novo ativo HB 623 cadastrado</p>
                 <p className="text-xs text-gray-500">há 4 horas</p>
               </div>
             </div>
             <div className="flex items-center space-x-3">
               <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
               <div className="flex-1">
                 <p className="text-sm text-gray-100">Área CD-A em contagem</p>
                 <p className="text-xs text-gray-500">há 6 horas</p>
               </div>
             </div>
           </CardContent>
         </Card>
       </motion.div>
     </div>
   </div>
 )
}
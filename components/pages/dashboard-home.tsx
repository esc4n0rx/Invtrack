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
import { useIntegrator } from "@/hooks/useIntegrator"
import { useInventario } from "@/hooks/useInventario"
import { useDashboardStats } from "@/hooks/useDashboardStats"
import { LojasPendentesModal } from "@/components/dashboard/LojasPendentesModal"
import { lojas as lojasPorResponsavelOriginal } from "@/data/loja";
const lojasPorResponsavel: Record<string, string[]> = lojasPorResponsavelOriginal;

import { toast } from "sonner"

export function DashboardHome() {
  const [isNewInventoryOpen, setIsNewInventoryOpen] = React.useState(false)
  const [isLojasPendentesOpen, setIsLojasPendentesOpen] = React.useState(false)
  const [nomeResponsavel, setNomeResponsavel] = React.useState("")
  const [isCreating, setIsCreating] = React.useState(false)
  const { config: integratorConfig } = useIntegrator()
  const { inventarioAtivo, loading, error, criarNovoInventario, finalizarInventarioAtivo } = useInventario()
  const { stats, loading: loadingStats, error: errorStats, recarregar } = useDashboardStats(inventarioAtivo?.codigo)

  // REMOVIDO: useEffect que causava loop infinito
  // As atualizações agora são gerenciadas via subscription no useDashboardStats

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

  const getResponsavelPorLoja = (nomeLoja: string): string | undefined => {
    for (const responsavel in lojasPorResponsavel) {
      if (lojasPorResponsavel[responsavel].includes(nomeLoja)) {
        return responsavel;
      }
    }
    return undefined;
  };

  const lojasPendentesPorResponsavel = React.useMemo(() => {
    if (!stats?.lojas.detalhes) return [];
    // Filtra apenas lojas pendentes e garante que cada uma tenha o campo responsavel
    const pendentes = stats.lojas.detalhes
      .filter(loja => !loja.contada)
      .map(loja => ({
        ...loja,
        responsavel: loja.responsavel || getResponsavelPorLoja(loja.loja)
      }));
    // Log para verificar pendentes
    console.log('Pendentes:', pendentes);
    // Agrupa por responsável
    const agrupado: { [responsavel: string]: string[] } = {};
    pendentes.forEach(loja => {
      if (!loja.responsavel) {
        console.warn('Loja sem responsável:', loja);
        return; // Pula para a próxima loja
      }
      if (!agrupado[loja.responsavel]) agrupado[loja.responsavel] = [];
      agrupado[loja.responsavel].push(loja.loja);
    });
    // Log para verificar agrupamento
    console.log('Agrupado por responsável:', agrupado);
    // Monta o array no formato esperado
    const resultado = Object.entries(agrupado).map(([responsavel, lojasPendentes]) => ({
      responsavel,
      lojasPendentes,
      totalPendentes: lojasPendentes.length,
    }));
    // Log do resultado final
    console.log('Resultado final lojasPendentesPorResponsavel:', resultado);
    return resultado;
  }, [stats]);

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
            <Badge className="bg-green-900 text-green-300 border-green-700">
              Inventário Ativo
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleFinalizarInventario}
              className="border-red-700 text-red-300 hover:bg-red-900/20"
            >
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
                  Inicie um novo processo de inventário
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="responsavel" className="text-gray-300">Nome do Responsável</Label>
                  <Input
                    id="responsavel"
                    value={nomeResponsavel}
                    onChange={(e) => setNomeResponsavel(e.target.value)}
                    placeholder="Digite o nome do responsável"
                    className="bg-gray-800 border-gray-600 text-gray-100 mt-1"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsNewInventoryOpen(false)}
                  className="border-gray-600 text-gray-300"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCriarInventario}
                  disabled={isCreating}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isCreating ? "Criando..." : "Criar Inventário"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </motion.div>

      {/* Status do Integrador */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-4">
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
                    de {stats?.areasCD.total || 0} áreas ({progressoCD}%)
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
          <Card className="bg-gray-900 border-gray-700 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total de Ativos</CardTitle>
              <Package className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-700 rounded w-16 mb-1"></div>
                  <div className="h-4 bg-gray-700 rounded w-24"></div>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold text-gray-100">{totalAtivos.toLocaleString('pt-BR')}</div>
                  <p className="text-xs text-gray-500 mt-1">
                    Itens contados
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}>
          <Card className="bg-gray-900 border-gray-700 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Progresso Geral</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-700 rounded w-16 mb-1"></div>
                  <div className="h-4 bg-gray-700 rounded w-24"></div>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold text-gray-100">{Math.round((progressoLojas + progressoCD) / 2)}%</div>
                  <p className="text-xs text-gray-500 mt-1">
                    Inventário completo
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Progresso das contagens */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-100 flex items-center gap-2">
                <Store className="h-5 w-5 text-blue-400" />
                Progresso das Lojas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Contadas</span>
                <span className="text-gray-300">{stats?.lojas.contadas || 0} de {stats?.lojas.total || 0}</span>
              </div>
              <Progress value={progressoLojas} className="h-2" />
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{progressoLojas}% concluído</span>
                {stats?.lojas.pendentes && stats.lojas.pendentes > 0 && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setIsLojasPendentesOpen(true)}
                    className="text-blue-400 hover:text-blue-300 p-0 h-auto"
                  >
                    Ver pendentes ({stats.lojas.pendentes})
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-100 flex items-center gap-2">
                <Warehouse className="h-5 w-5 text-green-400" />
                Progresso do CD
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Áreas contadas</span>
                <span className="text-gray-300">{stats?.areasCD.contadas || 0} de {stats?.areasCD.total || 0}</span>
              </div>
              <Progress value={progressoCD} className="h-2" />
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{progressoCD}% concluído</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Erros */}
      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Alert className="bg-red-900/20 border-red-700">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-300">
              {error}
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {errorStats && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Alert className="bg-red-900/20 border-red-700">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-300">
              Erro ao carregar estatísticas: {errorStats}
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Modal de lojas pendentes */}
      <LojasPendentesModal
        open={isLojasPendentesOpen}
        onOpenChange={setIsLojasPendentesOpen}
        lojasPendentes={lojasPendentesPorResponsavel}
        totalPendentes={stats?.lojas.pendentes || 0}
      />
    </div>
  )
}
// components/pages/counts-page.tsx
"use client"

import * as React from "react"
import { useEffect } from "react"

import { motion } from "framer-motion"
import { Calculator, AlertCircle, Package, TrendingUp, Activity } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ContagemsTable } from "@/components/contagens/ContagemsTable"
import { NovaContagemModal } from "@/components/contagens/NovaContagemModal"
import { EditarContagemModal } from "@/components/contagens/EditarContagemModal"
import { useInventario } from "@/hooks/useInventario"
import { useContagens } from "@/hooks/useContagens"
import { useIntegrator} from "@/hooks/useIntegrator"
import { Contagem } from "@/types/contagem"

export function CountsPage() {
  const [isNovaContagemOpen, setIsNovaContagemOpen] = React.useState(false)
  const [isEditarContagemOpen, setIsEditarContagemOpen] = React.useState(false)
  const [contagemSelecionada, setContagemSelecionada] = React.useState<Contagem | null>(null)
  const { config: integratorConfig } = useIntegrator()
  const { inventarioAtivo, loading: loadingInventario, error: errorInventario } = useInventario()
  const { 
    contagens, 
    loading: loadingContagens, 
    error: errorContagens, 
    adicionarContagem, 
    atualizarContagem, 
    removerContagem,
    recarregar
  } = useContagens(inventarioAtivo?.codigo)

  const handleEditarContagem = (contagem: Contagem) => {
    setContagemSelecionada(contagem)
    setIsEditarContagemOpen(true)
  }

  const handleCloseEditarModal = () => {
    setIsEditarContagemOpen(false)
    setContagemSelecionada(null)
  }


  useEffect(() => {
    if (integratorConfig.lastSync && recarregar) {
      recarregar();
    }
  }, [integratorConfig.lastSync, recarregar])

  // Estatísticas das contagens
  const estatisticas = React.useMemo(() => {
    const totalContagens = contagens.length
    const contagensPorTipo = contagens.reduce((acc, contagem) => {
      acc[contagem.tipo] = (acc[contagem.tipo] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const quantidadeTotal = contagens.reduce((acc, contagem) => acc + contagem.quantidade, 0)
    
    return {
      totalContagens,
      contagensPorTipo,
      quantidadeTotal,
      ativosUnicos: new Set(contagens.map(c => c.ativo)).size
    }
  }, [contagens])

  if (loadingInventario) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
          <span className="ml-3 text-gray-400">Carregando inventário...</span>
        </div>
      </div>
    )
  }

  if (errorInventario) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Alert className="bg-red-900/20 border-red-700">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-300">
            {errorInventario}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!inventarioAtivo) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-gray-100">Contagens</h1>
          <p className="text-gray-400 mt-1">Gerenciamento de contagens do inventário</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-8 text-center">
              <Calculator className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-100 mb-2">
                Nenhum Inventário Ativo
              </h3>
              <p className="text-gray-400 mb-6">
                Para começar a registrar contagens, primeiro é necessário criar um inventário ativo.
              </p>
              <p className="text-sm text-gray-500">
                Acesse a página inicial para criar um novo inventário.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Contagens</h1>
          <p className="text-gray-400 mt-1">
            Inventário: {inventarioAtivo.codigo} - {inventarioAtivo.responsavel}
          </p>
        </div>

        <Button 
          className="bg-blue-600 hover:bg-blue-700 text-white"
          onClick={() => setIsNovaContagemOpen(true)}
        >
          <Calculator className="h-4 w-4 mr-2" />
          Nova Contagem
        </Button>
      </motion.div>


      {integratorConfig.isActive && (
      <Alert className="bg-blue-900/20 border-blue-700 mb-4">
        <Activity className="h-4 w-4" />
        <AlertDescription className="text-blue-300">
          <strong>Integração Ativa:</strong> Contagens externas sendo importadas automaticamente a cada {integratorConfig.interval} segundos.
        </AlertDescription>
      </Alert>
    )}

      {/* Exibir erro das contagens se houver */}
      {errorContagens && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Alert className="bg-red-900/20 border-red-700">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-300">
              {errorContagens}
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total de Contagens</CardTitle>
              <Calculator className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-100">{estatisticas.totalContagens}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Ativos Diferentes</CardTitle>
              <Package className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-100">{estatisticas.ativosUnicos}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Quantidade Total</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-100">{estatisticas.quantidadeTotal.toLocaleString()}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}>
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Contagens por Tipo</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {Object.entries(estatisticas.contagensPorTipo).map(([tipo, quantidade]) => (
                  <div key={tipo} className="flex justify-between text-sm">
                    <span className="text-gray-400 capitalize">{tipo}:</span>
                    <span className="text-gray-100">{quantidade}</span>
                  </div>
                ))}
                {Object.keys(estatisticas.contagensPorTipo).length === 0 && (
                  <span className="text-gray-500 text-sm">Nenhuma contagem</span>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tabela de contagens */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <ContagemsTable
          contagens={contagens}
          loading={loadingContagens}
          onEdit={handleEditarContagem}
        />
      </motion.div>

      {/* Modais */}
      <NovaContagemModal
        open={isNovaContagemOpen}
        onOpenChange={setIsNovaContagemOpen}
        onSubmit={adicionarContagem}
      />

      <EditarContagemModal
        open={isEditarContagemOpen}
        onOpenChange={handleCloseEditarModal}
        contagem={contagemSelecionada}
        onEdit={atualizarContagem}
        onDelete={removerContagem}
      />
    </div>
  )
}
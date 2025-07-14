// components/pages/reports-page.tsx
"use client"

import * as React from "react"
import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { FileText, Plus, Download, BarChart3, AlertCircle, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useInventario } from '@/hooks/useInventario';
import { useRelatorios } from "@/hooks/useRelatorios"
import { GerarRelatorioModal } from "@/components/relatorios/GerarRelatorioModal"
import { RelatorioCard } from "@/components/relatorios/RelatorioCard"
import { FiltrosRelatorio, FiltroAtivos } from "@/components/relatorios/FiltrosRelatorio"
import { Relatorio } from "@/types/relatorio"

export function ReportsPage() {
  const { inventarioAtivo, loading: loadingInventario, error: errorInventario } = useInventario()
  const {
    relatorios,
    loading,
    error,
    criarNovoRelatorio,
    processarRelatorio,
    baixarArquivo,
    removerRelatorio,
    recarregar
  } = useRelatorios(inventarioAtivo?.codigo)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [filtros, setFiltros] = useState<FiltroAtivos>({
    busca: '',
    tipo: 'todos',
    status: 'todos',
    formato: 'todos'
  })

  // Filtrar relatórios baseado nos filtros ativos
  const relatoriosFiltrados = useMemo(() => {
    return relatorios.filter(relatorio => {
      // Filtro de busca
      if (filtros.busca) {
        const termoBusca = filtros.busca.toLowerCase()
        if (
          !relatorio.nome.toLowerCase().includes(termoBusca) &&
          !relatorio.tipo.toLowerCase().includes(termoBusca) &&
          !relatorio.usuario_criacao.toLowerCase().includes(termoBusca)
        ) {
          return false
        }
      }

      // Filtro de tipo
      if (filtros.tipo !== 'todos' && relatorio.tipo !== filtros.tipo) {
        return false
      }

      // Filtro de status
      if (filtros.status !== 'todos' && relatorio.status !== filtros.status) {
        return false
      }

      // Filtro de formato
      if (filtros.formato !== 'todos' && relatorio.formato !== filtros.formato) {
        return false
      }

      return true
    })
  }, [relatorios, filtros])

  // Estatísticas dos relatórios
  const estatisticas = useMemo(() => {
    return {
      total: relatorios.length,
      concluidos: relatorios.filter(r => r.status === 'concluido').length,
      processando: relatorios.filter(r => r.status === 'processando').length,
      erro: relatorios.filter(r => r.status === 'erro').length
    }
  }, [relatorios])

  const handleCriarRelatorio = async (dados: any) => {
    const sucesso = await criarNovoRelatorio(dados)
    if (sucesso) {
      // Aguardar um momento e tentar processar automaticamente
      setTimeout(async () => {
        await recarregar()
        const ultimoRelatorio = relatorios[0]
        if (ultimoRelatorio && ultimoRelatorio.status !== 'concluido') {
          await processarRelatorio(ultimoRelatorio.id)
        }
      }, 1000)
    }
    return sucesso
  }

  const handleProcessar = async (relatorioId: string) => {
    await processarRelatorio(relatorioId)
  }

  const handleDownload = async (relatorioId: string, nomeArquivo: string) => {
    await baixarArquivo(relatorioId, nomeArquivo)
  }

  const handleDelete = async (relatorioId: string) => {
    if (confirm('Tem certeza que deseja excluir este relatório?')) {
      await removerRelatorio(relatorioId)
    }
  }

  const handleVisualize = (relatorio: Relatorio) => {
    // Implementar modal de visualização ou navegar para página de detalhes
    console.log('Visualizar relatório:', relatorio)
  }

  // Se não há inventário ativo
  if (!loadingInventario && !inventarioAtivo) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-8 text-center">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-100 mb-2">
              Nenhum inventário ativo
            </h3>
            <p className="text-gray-400">
              É necessário ter um inventário ativo para gerar relatórios.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header da página */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Relatórios</h1>
          <p className="text-gray-400 mt-1">
            {inventarioAtivo && `Inventário: ${inventarioAtivo.codigo} - ${inventarioAtivo.responsavel}`}
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={recarregar}
            disabled={loading}
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Relatório
          </Button>
        </div>
      </motion.div>

      {/* Exibir erro se houver */}
      {(error || errorInventario) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Alert className="bg-red-900/20 border-red-700">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-300">
              {error || errorInventario}
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total de Relatórios</CardTitle>
              <FileText className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-100">{estatisticas.total}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Concluídos</CardTitle>
              <BarChart3 className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-100">{estatisticas.concluidos}</div>
              <p className="text-xs text-gray-400">
                Disponíveis para download
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Processando</CardTitle>
              <RefreshCw className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-100">{estatisticas.processando}</div>
              <p className="text-xs text-gray-400">
                Em andamento
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}>
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Com Erro</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-100">{estatisticas.erro}</div>
              <p className="text-xs text-gray-400">
                Requer atenção
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filtros */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-100 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-400" />
              Relatórios Gerados
              <Badge variant="secondary" className="ml-2 bg-gray-700 text-gray-300">
                {relatoriosFiltrados.length} de {relatorios.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FiltrosRelatorio onFilterChange={setFiltros} />
          </CardContent>
        </Card>
      </motion.div>

      {/* Lista de relatórios */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
          <span className="ml-3 text-gray-400">Carregando relatórios...</span>
        </div>
      ) : relatoriosFiltrados.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-8 text-center">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-100 mb-2">
                {relatorios.length === 0 ? 'Nenhum relatório gerado' : 'Nenhum relatório encontrado'}
              </h3>
              <p className="text-gray-400 mb-4">
                {relatorios.length === 0 
                  ? 'Crie seu primeiro relatório para começar a visualizar dados do inventário.' 
                  : 'Tente ajustar os filtros para encontrar os relatórios desejados.'
                }
              </p>
              {relatorios.length === 0 && (
                <Button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Relatório
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {relatoriosFiltrados.map((relatorio, index) => (
            <motion.div
              key={relatorio.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <RelatorioCard
                relatorio={relatorio}
                onDownload={handleDownload}
                onDelete={handleDelete}
                onProcessar={handleProcessar}
                onVisualize={handleVisualize}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal de criação */}
      <GerarRelatorioModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onCriar={handleCriarRelatorio}
        loading={loading}
      />
    </div>
  )
}
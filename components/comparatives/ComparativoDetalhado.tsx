// components/comparatives/ComparativoDetalhado.tsx
"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { 
  ArrowLeft, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Package,
  Building,
  Warehouse,
  Truck,
  Search,
  Filter
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { ComparativoResultado } from "@/types/comparativo"
import { ComparativoChart } from "./ComparativoChart"
import { ComparativoExport } from "./ComparativoExport"

interface ComparativoDetalhadoProps {
  comparacao: ComparativoResultado
  onVoltar: () => void
  loading?: boolean
}

export function ComparativoDetalhado({ comparacao, onVoltar, loading = false }: ComparativoDetalhadoProps) {
  const [searchTerm, setSearchTerm] = React.useState("")
  const [filtroTipo, setFiltroTipo] = React.useState<string>("todos")
  const [filtroDivergencia, setFiltroDivergencia] = React.useState<string>("todos")
  const [currentPage, setCurrentPage] = React.useState(1)
  const [showExport, setShowExport] = React.useState(false)
  const itemsPerPage = 50

  const detalhesComFiltro = React.useMemo(() => {
    let filtrados = comparacao.detalhes_comparacao

    // Filtro por busca
    if (searchTerm) {
      const termo = searchTerm.toLowerCase()
      filtrados = filtrados.filter(item => 
        item.ativo.toLowerCase().includes(termo) ||
        item.localizacao.toLowerCase().includes(termo)
      )
    }

    // Filtro por tipo
    if (filtroTipo !== "todos") {
      filtrados = filtrados.filter(item => item.tipo === filtroTipo)
    }

    // Filtro por divergência
    if (filtroDivergencia !== "todos") {
      filtrados = filtrados.filter(item => 
        filtroDivergencia === "sim" ? item.divergencia : !item.divergencia
      )
    }

    return filtrados
  }, [comparacao.detalhes_comparacao, searchTerm, filtroTipo, filtroDivergencia])

  const paginatedItems = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return detalhesComFiltro.slice(startIndex, startIndex + itemsPerPage)
  }, [detalhesComFiltro, currentPage])

  const totalPages = Math.ceil(detalhesComFiltro.length / itemsPerPage)

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'loja':
        return <Building className="h-4 w-4" />
      case 'cd':
        return <Warehouse className="h-4 w-4" />
      case 'fornecedor':
        return <Package className="h-4 w-4" />
      case 'transito':
        return <Truck className="h-4 w-4" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  const getDivergenciaColor = (divergencia: boolean) => {
    return divergencia 
      ? "bg-red-900 text-red-300 border-red-700"
      : "bg-green-900 text-green-300 border-green-700"
  }

  const formatarNumero = (num: number) => {
    return new Intl.NumberFormat('pt-BR').format(num)
  }

  const formatarPercentual = (num: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(num / 100)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
        <span className="ml-3 text-gray-400">Processando comparação...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={onVoltar}
            className="text-gray-300 hover:text-gray-100"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-100">
              Comparativo: {comparacao.inventario_1.codigo} vs {comparacao.inventario_2.codigo}
            </h1>
            <p className="text-gray-400">
              {formatarNumero(comparacao.estatisticas_comparacao.total_ativos_comparados)} itens comparados
            </p>
          </div>
        </div>
        <Button
          onClick={() => setShowExport(true)}
          className="bg-green-600 hover:bg-green-700"
        >
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </div>

      {/* Resumo dos Inventários */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-100">
              Inventário 1: {comparacao.inventario_1.codigo}
            </CardTitle>
            <Badge className="w-fit bg-blue-900 text-blue-300 border-blue-700">
              {comparacao.inventario_1.status}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-lg font-bold text-blue-400">{formatarNumero(comparacao.inventario_1.total_contagens)}</p>
                <p className="text-xs text-gray-400">Contagens</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-green-400">{formatarNumero(comparacao.inventario_1.total_ativos)}</p>
                <p className="text-xs text-gray-400">Ativos</p>
              </div>
            </div>
            <div className="text-sm text-gray-300">
              <p>Responsável: {comparacao.inventario_1.responsavel}</p>
              <p>Criado em: {new Date(comparacao.inventario_1.data_criacao).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-100">
              Inventário 2: {comparacao.inventario_2.codigo}
            </CardTitle>
            <Badge className="w-fit bg-purple-900 text-purple-300 border-purple-700">
              {comparacao.inventario_2.status}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-lg font-bold text-blue-400">{formatarNumero(comparacao.inventario_2.total_contagens)}</p>
                <p className="text-xs text-gray-400">Contagens</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-green-400">{formatarNumero(comparacao.inventario_2.total_ativos)}</p>
                <p className="text-xs text-gray-400">Ativos</p>
              </div>
            </div>
            <div className="text-sm text-gray-300">
              <p>Responsável: {comparacao.inventario_2.responsavel}</p>
              <p>Criado em: {new Date(comparacao.inventario_2.data_criacao).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estatísticas da Comparação */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-4 text-center">
            <Package className="h-8 w-8 text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-100">
              {formatarNumero(comparacao.estatisticas_comparacao.total_ativos_comparados)}
            </p>
            <p className="text-sm text-gray-400">Total Comparados</p>
          </CardContent>
        </Card>

        <Card className="bg-green-900/20 border-green-700">
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-300">
              {formatarNumero(comparacao.estatisticas_comparacao.ativos_em_ambos)}
            </p>
            <p className="text-sm text-green-400">Em Ambos</p>
          </CardContent>
        </Card>

        <Card className="bg-red-900/20 border-red-700">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-red-300">
              {formatarNumero(comparacao.estatisticas_comparacao.divergencias_encontradas)}
            </p>
            <p className="text-sm text-red-400">Divergências</p>
          </CardContent>
        </Card>

        <Card className="bg-yellow-900/20 border-yellow-700">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-yellow-300">
              {formatarPercentual(comparacao.estatisticas_comparacao.percentual_divergencia)}
            </p>
            <p className="text-sm text-yellow-400">Taxa Divergência</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Comparação */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <ComparativoChart comparacao={comparacao} />
      </motion.div>

      {/* Filtros */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-100">
            <Filter className="h-5 w-5 text-blue-400" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar ativo ou localização..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-600 text-gray-100"
              />
            </div>

            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger className="bg-gray-800 border-gray-600">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="todos">Todos os tipos</SelectItem>
                <SelectItem value="loja">Lojas</SelectItem>
                <SelectItem value="cd">Centro de Distribuição</SelectItem>
                <SelectItem value="fornecedor">Fornecedores</SelectItem>
                <SelectItem value="transito">Trânsito</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filtroDivergencia} onValueChange={setFiltroDivergencia}>
              <SelectTrigger className="bg-gray-800 border-gray-600">
                <SelectValue placeholder="Divergência" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="todos">Todas</SelectItem>
                <SelectItem value="sim">Apenas divergências</SelectItem>
                <SelectItem value="nao">Apenas consistentes</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm("")
                setFiltroTipo("todos")
                setFiltroDivergencia("todos")
                setCurrentPage(1)
              }}
              className="border-gray-600"
            >
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Detalhes */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-100">
            Detalhes da Comparação ({formatarNumero(detalhesComFiltro.length)} itens)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-300">Ativo</TableHead>
                  <TableHead className="text-gray-300">Tipo</TableHead>
                  <TableHead className="text-gray-300">Localização</TableHead>
                  <TableHead className="text-gray-300 text-center">Inv. 1</TableHead>
                  <TableHead className="text-gray-300 text-center">Inv. 2</TableHead>
                  <TableHead className="text-gray-300 text-center">Diferença</TableHead>
                  <TableHead className="text-gray-300 text-center">%</TableHead>
                  <TableHead className="text-gray-300 text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedItems.map((item, index) => (
                  <motion.tr
                    key={`${item.ativo}-${item.tipo}-${item.localizacao}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="border-gray-700 hover:bg-gray-800/50"
                  >
                    <TableCell className="text-gray-100 font-medium">
                      {item.ativo}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      <div className="flex items-center gap-2">
                        {getTipoIcon(item.tipo)}
                        {item.tipo.charAt(0).toUpperCase() + item.tipo.slice(1)}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {item.localizacao}
                    </TableCell>
                    <TableCell className="text-center text-blue-400 font-medium">
                      {formatarNumero(item.quantidade_inv1)}
                    </TableCell>
                    <TableCell className="text-center text-purple-400 font-medium">
                      {formatarNumero(item.quantidade_inv2)}
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      <span className={item.diferenca > 0 ? "text-green-400" : item.diferenca < 0 ? "text-red-400" : "text-gray-400"}>
                        {item.diferenca > 0 ? "+" : ""}{formatarNumero(item.diferenca)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={item.percentual_diferenca > 0 ? "text-green-400" : item.percentual_diferenca < 0 ? "text-red-400" : "text-gray-400"}>
                        {formatarPercentual(item.percentual_diferenca)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={getDivergenciaColor(item.divergencia)}>
                        {item.divergencia ? (
                          <>
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Divergente
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Consistente
                          </>
                        )}
                      </Badge>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <p className="text-sm text-gray-400">
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, detalhesComFiltro.length)} de {detalhesComFiltro.length} itens
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="border-gray-600"
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="border-gray-600"
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Exportação */}
      {showExport && (
        <ComparativoExport
          comparacao={comparacao}
          isOpen={showExport}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  )
}
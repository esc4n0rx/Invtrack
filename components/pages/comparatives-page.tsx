// components/pages/comparatives-page.tsx
"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { BarChart3, AlertCircle, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useComparativo } from "@/hooks/useComparativo"
import { SelecionarInventarios } from "@/components/comparatives/SelecionarInventarios"
import { ComparativoDetalhado } from "@/components/comparatives/ComparativoDetalhado"
import { ComparativoRequest } from "@/types/comparativo"

export function ComparativesPage() {
  const {
    inventarios,
    loadingInventarios,
    comparacao,
    loadingComparacao,
    error,
    carregarInventarios,
    realizarComparacao,
    limparComparacao
  } = useComparativo()

  const [mostrarComparacao, setMostrarComparacao] = React.useState(false)

  React.useEffect(() => {
    carregarInventarios()
  }, [carregarInventarios])

  const handleComparar = async (request: ComparativoRequest) => {
    const resultado = await realizarComparacao(request)
    
    if (resultado.success) {
      setMostrarComparacao(true)
    }
  }

  const handleVoltar = () => {
    setMostrarComparacao(false)
    limparComparacao()
  }

  const handleRecarregar = () => {
    carregarInventarios()
    limparComparacao()
    setMostrarComparacao(false)
  }

  if (mostrarComparacao && comparacao) {
    return (
      <div className="container mx-auto px-4 py-6">
        <ComparativoDetalhado
          comparacao={comparacao}
          onVoltar={handleVoltar}
          loading={loadingComparacao}
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-100">Comparativos</h1>
            <p className="text-gray-400 mt-1">
              Compare inventários para identificar divergências e análisar diferenças
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleRecarregar}
              className="border-gray-600"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Informações Gerais */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-100">
              <BarChart3 className="h-5 w-5 text-blue-400" />
              Como Funciona
            </CardTitle>
          </CardHeader>
          <CardContent className="text-gray-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-100 mb-2">Comparação Detalhada</h3>
                <ul className="space-y-1 text-sm">
                  <li>• Compare até 2 inventários diferentes</li>
                  <li>• Identifique divergências entre contagens</li>
                  <li>• Analise diferenças por tipo (loja, CD, etc.)</li>
                  <li>• Exporte resultados em CSV ou JSON</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-gray-100 mb-2">Filtros Avançados</h3>
                <ul className="space-y-1 text-sm">
                  <li>• Filtre por ativos específicos</li>
                  <li>• Selecione lojas ou setores</li>
                  <li>• Inclua ou exclua quantidades zeradas</li>
                  <li>• Visualize apenas divergências</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Erro Global */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Alert className="bg-red-900/20 border-red-700">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-300">
              {error}
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Seleção de Inventários */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <SelecionarInventarios
          inventarios={inventarios}
          loading={loadingInventarios}
          error={error}
          onComparar={handleComparar}
          onRecarregar={carregarInventarios}
        />
      </motion.div>

      {/* Loading da Comparação */}
      {loadingComparacao && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center py-12"
        >
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-100 mb-2">
                Processando Comparação
              </h3>
              <p className="text-gray-400">
                Analisando inventários e identificando divergências...
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Estatísticas de Inventários Disponíveis */}
      {!loadingInventarios && inventarios.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-100">
                Inventários Disponíveis ({inventarios.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-800 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-blue-400">
                    {inventarios.filter(i => i.status === 'ativo').length}
                  </p>
                  <p className="text-sm text-gray-400">Ativos</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-400">
                    {inventarios.filter(i => i.status === 'finalizado').length}
                  </p>
                  <p className="text-sm text-gray-400">Finalizados</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-yellow-400">
                    {inventarios.reduce((acc, i) => acc + i.total_contagens, 0).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-400">Total de Contagens</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
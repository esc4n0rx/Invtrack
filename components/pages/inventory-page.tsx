// components/pages/inventory-page.tsx
"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Search, Filter, Plus, Package, ExternalLink, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ativos } from "@/data/ativos"
import { useInventario } from "@/hooks/useInventario"
import { useContagensExternas } from "@/hooks/useContagensExternas"
import { ContagemExternaCard } from "@/components/inventory/ContagemExternaCard"
import { ContagemExternaModal } from "@/components/inventory/ContagemExternaModal"
import { SetorContagens } from "@/types/contagem-externa"

export function InventoryPage() {
  const [searchTerm, setSearchTerm] = React.useState("")
  const [modalSetorSelecionado, setModalSetorSelecionado] = React.useState<SetorContagens | null>(null)
  const [isModalOpen, setIsModalOpen] = React.useState(false)

  const { inventarioAtivo, loading: loadingInventario, error: errorInventario } = useInventario()
  const { 
    setoresComContagens, 
    loading: loadingContagens, 
    error: errorContagens,
    aprovarContagem,
    recarregar
  } = useContagensExternas(inventarioAtivo?.codigo)

  const filteredAtivos = ativos.filter((ativo) => 
    ativo.nome.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCardClick = (setorData: SetorContagens) => {
    setModalSetorSelecionado(setorData)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setModalSetorSelecionado(null)
    recarregar() // Recarregar dados após fechar modal
  }

  const handleAprovarContagem = async (id: string, responsavel: string) => {
    const resultado = await aprovarContagem(id, responsavel)
    if (resultado.success) {
      // Fechar modal e recarregar dados
      handleCloseModal()
    }
    return resultado
  }

  const linkContagemExterna = React.useMemo(() => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/contagem-externa`
    }
    return '/contagem-externa'
  }, [])

  if (loadingInventario) {
    return (
      <div className="p-6 space-y-6 bg-gray-950 min-h-full">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
          <span className="ml-3 text-gray-400">Carregando inventário...</span>
        </div>
      </div>
    )
  }

  if (errorInventario) {
    return (
      <div className="p-6 space-y-6 bg-gray-950 min-h-full">
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
      <div className="p-6 space-y-6 bg-gray-950 min-h-full">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold text-gray-100">Inventário</h1>
          <p className="text-gray-400 mt-1">Gerenciamento de contagens de inventário</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-8 text-center">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-100 mb-2">
                Nenhum Inventário Ativo
              </h3>
              <p className="text-gray-400 mb-6">
                Para começar a gerenciar contagens de inventário, primeiro é necessário criar um inventário ativo.
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
    <div className="p-6 space-y-6 bg-gray-950 min-h-full">
      {/* Header da página */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Inventário</h1>
          <p className="text-gray-400 mt-1">
            Inventário: {inventarioAtivo.codigo} - {inventarioAtivo.responsavel}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={() => window.open(linkContagemExterna, '_blank')}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Link Contagem Externa
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Nova Contagem Interna
          </Button>
        </div>
      </motion.div>

      {/* Exibir erro das contagens externas se houver */}
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

      {/* Seção de Contagens Externas */}
      <div className="space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-100">Contagens por Setor</h2>
            {loadingContagens && (
              <div className="flex items-center gap-2 text-gray-400">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                Carregando contagens...
              </div>
            )}
          </div>
          <p className="text-gray-400 text-sm mt-1">
            Visualize e gerencie as contagens realizadas externamente por setor
          </p>
        </motion.div>

        {/* Grid de Cards de Setores */}
        {setoresComContagens.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {setoresComContagens.map((setorData, index) => (
              <motion.div
                key={setorData.setor}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * index }}
              >
                <ContagemExternaCard
                  setorData={setorData}
                  onClick={() => handleCardClick(setorData)}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : !loadingContagens ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">
              Nenhuma contagem externa encontrada
            </h3>
            <p className="text-gray-500 mb-4">
              As contagens realizadas através do link externo aparecerão aqui organizadas por setor
            </p>
            <Button 
              onClick={() => window.open(linkContagemExterna, '_blank')}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir Link de Contagem
            </Button>
          </motion.div>
        ) : null}
      </div>

      {/* Modal de Contagem Externa */}
      <ContagemExternaModal
        open={isModalOpen}
        onOpenChange={handleCloseModal}
        setorData={modalSetorSelecionado}
        onAprovar={handleAprovarContagem}
      />
    </div>
  )
}
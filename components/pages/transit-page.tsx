// components/pages/transit-page.tsx
"use client"

import { motion } from "framer-motion"
import { Truck, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useInventario } from "@/hooks/useInventario"
import { useTransitData } from "@/hooks/useTransitData"
import { TransitStatsCards } from "@/components/transit/TransitStatsCards"
import { TransitTable } from "@/components/transit/TransitTable"

export function TransitPage() {
  const { inventarioAtivo, loading: inventarioLoading } = useInventario()
  const { contagens, stats, loading, error, recarregar } = useTransitData(inventarioAtivo?.codigo)

  const handleRefresh = () => {
    recarregar()
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-100 flex items-center gap-3">
            <Truck className="h-8 w-8 text-blue-400" />
            Trânsito
          </h1>
          <p className="text-gray-400 mt-1">
            Controle de ativos em movimentação entre centros de distribuição
          </p>
          {inventarioAtivo && (
            <p className="text-sm text-blue-400 mt-1">
              Inventário: {inventarioAtivo.codigo} - {inventarioAtivo.responsavel}
            </p>
          )}
        </div>

        <Button 
          onClick={handleRefresh}
          disabled={loading || inventarioLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </motion.div>

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-900/50 border border-red-700 rounded-lg p-4"
        >
          <p className="text-red-300">{error}</p>
        </motion.div>
      )}

      {/* No Active Inventory */}
      {!inventarioLoading && !inventarioAtivo && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-900/50 border border-yellow-700 rounded-lg p-6 text-center"
        >
          <p className="text-yellow-300 mb-2">Nenhum inventário ativo encontrado</p>
          <p className="text-yellow-400 text-sm">
            É necessário ter um inventário ativo para visualizar os dados de trânsito
          </p>
        </motion.div>
      )}

      {/* Stats Cards */}
      {inventarioAtivo && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <TransitStatsCards stats={stats} loading={loading} />
        </motion.div>
      )}

      {/* Transit Table */}
      {inventarioAtivo && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <TransitTable contagens={contagens} loading={loading} />
        </motion.div>
      )}

      {/* Top Routes */}
      {inventarioAtivo && stats && stats.rotas.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-100 mb-4">Principais Rotas</h3>
            <div className="space-y-3">
              {stats.rotas.slice(0, 5).map((rota, index) => (
                <div key={`${rota.origem}-${rota.destino}`} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm bg-gray-800 px-2 py-1 rounded">{rota.origem}</span>
                    <span className="text-gray-500">→</span>
                    <span className="text-sm bg-gray-800 px-2 py-1 rounded">{rota.destino}</span>
                  </div>
                  <span className="font-semibold text-gray-100">{rota.quantidade}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-100 mb-4">Top Responsáveis</h3>
            <div className="space-y-3">
              {stats.topResponsaveis.map((resp, index) => (
                <div key={resp.responsavel} className="flex items-center justify-between">
                  <span className="text-gray-300">{resp.responsavel}</span>
                  <span className="font-semibold text-gray-100">{resp.quantidade}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
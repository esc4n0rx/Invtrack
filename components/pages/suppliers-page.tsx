// components/pages/suppliers-page.tsx
"use client"

import { motion } from "framer-motion"
import { Building, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useInventario } from "@/hooks/useInventario"
import { useSuppliersData } from "@/hooks/useSuppliersData"
import { SuppliersStatsCards } from "@/components/suppliers/SuppliersStatsCards"
import { SuppliersTable } from "@/components/suppliers/SuppliersTable"

export function SuppliersPage() {
  const { inventarioAtivo, loading: inventarioLoading } = useInventario()
  const { contagens, stats, loading, error, recarregar } = useSuppliersData(inventarioAtivo?.codigo)

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
            <Building className="h-8 w-8 text-blue-400" />
            Fornecedores
          </h1>
          <p className="text-gray-400 mt-1">
            Gerenciamento de recebimentos e ativos dos fornecedores
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
            É necessário ter um inventário ativo para visualizar os dados de fornecedores
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
          <SuppliersStatsCards stats={stats} loading={loading} />
        </motion.div>
      )}

      {/* Suppliers Table */}
      {inventarioAtivo && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <SuppliersTable contagens={contagens} loading={loading} />
        </motion.div>
      )}

      {/* Suppliers Details */}
      {inventarioAtivo && stats && stats.fornecedoresDetalhes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-100 mb-4">Principais Fornecedores</h3>
            <div className="space-y-3">
              {stats.fornecedoresDetalhes.slice(0, 5).map((fornecedor, index) => (
                <div key={fornecedor.fornecedor} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-300">{fornecedor.fornecedor}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-100">{fornecedor.quantidade}</div>
                    <div className="text-xs text-gray-400">{fornecedor.itens} itens</div>
                  </div>
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
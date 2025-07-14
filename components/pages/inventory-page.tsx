"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Search, Filter, Plus, Package } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ativos } from "@/data/ativos"

export function InventoryPage() {
  const [searchTerm, setSearchTerm] = React.useState("")

  const filteredAtivos = ativos.filter((ativo) => ativo.nome.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className="p-6 space-y-6 bg-gray-950 min-h-full">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Inventário</h1>
          <p className="text-gray-400 mt-1">Gerenciamento de ativos do sistema</p>
        </div>

        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Novo Ativo
        </Button>
      </motion.div>

      {/* Barra de pesquisa e filtros */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar ativos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-400"
          />
        </div>
        <Button variant="outline" className="border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700">
          <Filter className="h-4 w-4 mr-2" />
          Filtros
        </Button>
      </motion.div>

      {/* Grid de ativos */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        {filteredAtivos.map((ativo, index) => (
          <motion.div
            key={ativo.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 * index }}
            whileHover={{ scale: 1.02 }}
            className="cursor-pointer"
          >
            <Card className="bg-gray-900 border-gray-700 hover:shadow-md transition-all duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Package className="h-5 w-5 text-blue-600" />
                  <Badge variant="secondary" className="bg-gray-100 text-gray-300">
                    {ativo.id.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="aspect-square bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700">
                    <Package className="h-8 w-8 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-100">{ativo.nome}</h3>
                    <p className="text-sm text-gray-500">Código: {ativo.id}</p>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Ativo
                    </span>
                    <Button size="sm" variant="ghost" className="text-gray-400 hover:text-gray-100">
                      Ver detalhes
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {filteredAtivos.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-400 mb-2">Nenhum ativo encontrado</h3>
          <p className="text-gray-500">Tente ajustar os filtros ou termos de busca</p>
        </motion.div>
      )}
    </div>
  )
}

"use client"
import { motion } from "framer-motion"
import { Calculator, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export function CountsPage() {
  const counts = [
    { id: 1, location: "Loja Centro", status: "completed", items: 245, date: "2024-01-15", time: "14:30" },
    { id: 2, location: "CD Área A", status: "in-progress", items: 89, date: "2024-01-15", time: "16:45" },
    { id: 3, location: "Loja Norte", status: "pending", items: 0, date: "2024-01-16", time: "09:00" },
    { id: 4, location: "CD Área B", status: "completed", items: 156, date: "2024-01-14", time: "11:20" },
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-400" />
      case "in-progress":
        return <Clock className="h-4 w-4 text-yellow-400" />
      case "pending":
        return <AlertCircle className="h-4 w-4 text-red-400" />
      default:
        return <Calculator className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-900 text-green-300 border-green-700">Concluída</Badge>
      case "in-progress":
        return <Badge className="bg-yellow-900 text-yellow-300 border-yellow-700">Em andamento</Badge>
      case "pending":
        return <Badge className="bg-red-900 text-red-300 border-red-700">Pendente</Badge>
      default:
        return <Badge variant="secondary">Desconhecido</Badge>
    }
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
          <p className="text-gray-400 mt-1">Histórico e status das contagens realizadas</p>
        </div>

        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <Calculator className="h-4 w-4 mr-2" />
          Nova Contagem
        </Button>
      </motion.div>

      {/* Estatísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Concluídas</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-100">2</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Em Andamento</CardTitle>
              <Clock className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-100">1</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Pendentes</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-100">1</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Lista de contagens */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-100">Histórico de Contagens</h2>

        {counts.map((count, index) => (
          <motion.div
            key={count.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * index }}
          >
            <Card className="bg-gray-900 border-gray-700 hover:border-gray-600 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(count.status)}
                    <div>
                      <h3 className="font-semibold text-gray-100">{count.location}</h3>
                      <p className="text-sm text-gray-400">
                        {count.date} às {count.time}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-400">Itens contados</p>
                      <p className="font-semibold text-gray-100">{count.items}</p>
                    </div>
                    {getStatusBadge(count.status)}
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-200">
                      Ver detalhes
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}

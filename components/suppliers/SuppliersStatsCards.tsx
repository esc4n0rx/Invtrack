// components/suppliers/SuppliersStatsCards.tsx
"use client"

import { motion } from "framer-motion"
import { Building, Package, Users, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SuppliersStats } from "@/hooks/useSuppliersData"

interface SuppliersStatsCardsProps {
  stats: SuppliersStats | null
  loading: boolean
}

export function SuppliersStatsCards({ stats, loading }: SuppliersStatsCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-gray-900 border-gray-700">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-700 rounded w-24 mb-2"></div>
                <div className="h-8 bg-gray-700 rounded w-16"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-6 text-center">
            <p className="text-gray-400">Nenhum dado de fornecedores encontrado</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const cards = [
    {
      title: "Total Fornecedores",
      value: stats.totalFornecedores,
      icon: Building,
      color: "text-blue-400",
      bgColor: "bg-blue-900/20"
    },
    {
      title: "Itens Recebidos",
      value: stats.totalItens,
      icon: Package,
      color: "text-green-400",
      bgColor: "bg-green-900/20"
    },
    {
      title: "Quantidade Total",
      value: stats.totalQuantidade,
      icon: TrendingUp,
      color: "text-orange-400",
      bgColor: "bg-orange-900/20"
    },
    {
      title: "Responsáveis",
      value: stats.topResponsaveis.length,
      icon: Users,
      color: "text-purple-400",
      bgColor: "bg-purple-900/20"
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-gray-900 border-gray-700 hover:border-gray-600 transition-colors">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-400">
                  <div className={`p-2 rounded-lg ${card.bgColor}`}>
                    <Icon className={`h-4 w-4 ${card.color}`} />
                  </div>
                  {card.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold text-gray-100">
                  {card.value.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}
"use client"
import { motion } from "framer-motion"
import { Truck, MapPin, Clock, Package } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function TransitPage() {
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-gray-100">Trânsito</h1>
        <p className="text-gray-400 mt-1">Controle de ativos em movimentação</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-100">
              <Truck className="h-5 w-5 text-blue-400" />
              Em Trânsito
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-100 mb-2">12</div>
            <p className="text-sm text-gray-400">Ativos em movimentação</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-100">
              <MapPin className="h-5 w-5 text-green-400" />
              Entregues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-100 mb-2">45</div>
            <p className="text-sm text-gray-400">Entregas concluídas hoje</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-100">
              <Clock className="h-5 w-5 text-yellow-400" />
              Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-100 mb-2">8</div>
            <p className="text-sm text-gray-400">Aguardando coleta</p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-100">Movimentações Recentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { id: "HB623-001", origin: "CD Principal", destination: "Loja Centro", status: "em-transito" },
              { id: "CAIXABAG-045", origin: "Loja Norte", destination: "CD Secundário", status: "entregue" },
              { id: "HNT-G-023", origin: "CD Principal", destination: "Loja Sul", status: "pendente" },
            ].map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700"
              >
                <div className="flex items-center space-x-3">
                  <Package className="h-5 w-5 text-blue-400" />
                  <div>
                    <p className="font-medium text-gray-100">{item.id}</p>
                    <p className="text-sm text-gray-400">
                      {item.origin} → {item.destination}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={
                    item.status === "entregue" ? "default" : item.status === "em-transito" ? "secondary" : "outline"
                  }
                  className={
                    item.status === "entregue"
                      ? "bg-green-900 text-green-300 border-green-700"
                      : item.status === "em-transito"
                        ? "bg-blue-900 text-blue-300 border-blue-700"
                        : "bg-yellow-900 text-yellow-300 border-yellow-700"
                  }
                >
                  {item.status === "entregue" ? "Entregue" : item.status === "em-transito" ? "Em Trânsito" : "Pendente"}
                </Badge>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

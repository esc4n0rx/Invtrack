"use client"
import { motion } from "framer-motion"
import { Wrench, RefreshCw, AlertTriangle, CheckCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function SystemAdjustmentsPage() {
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-gray-100">Ajustes do Sistema</h1>
        <p className="text-gray-400 mt-1">Manutenção e ajustes técnicos do sistema</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-100">
              <Wrench className="h-5 w-5 text-blue-400" />
              Status do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Banco de dados</span>
              <Badge className="bg-green-900 text-green-300 border-green-700">
                <CheckCircle className="h-3 w-3 mr-1" />
                Online
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">API Externa</span>
              <Badge className="bg-yellow-900 text-yellow-300 border-yellow-700">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Lento
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Cache</span>
              <Badge className="bg-green-900 text-green-300 border-green-700">
                <CheckCircle className="h-3 w-3 mr-1" />
                Ativo
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-100">
              <RefreshCw className="h-5 w-5 text-green-400" />
              Ações de Manutenção
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full border-gray-600 text-gray-300 hover:bg-gray-800 bg-transparent">
              Sincronizar dados
            </Button>
            <Button variant="outline" className="w-full border-gray-600 text-gray-300 hover:bg-gray-800 bg-transparent">
              Reindexar banco
            </Button>
            <Button variant="outline" className="w-full border-gray-600 text-gray-300 hover:bg-gray-800 bg-transparent">
              Verificar integridade
            </Button>
            <Button variant="destructive" className="w-full">
              Reiniciar serviços
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

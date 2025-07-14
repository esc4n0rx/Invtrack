"use client"
import { motion } from "framer-motion"
import { Link, Settings, Activity } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export function IntegratorPage() {
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-gray-100">Integrador</h1>
        <p className="text-gray-400 mt-1">Gerenciamento de integrações e APIs externas</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {[
          { name: "ERP Principal", status: "conectado", lastSync: "há 5 min" },
          { name: "Sistema WMS", status: "conectado", lastSync: "há 12 min" },
          { name: "API Fornecedores", status: "erro", lastSync: "há 2 horas" },
        ].map((integration, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 * index }}
          >
            <Card className="bg-gray-900 border-gray-700 hover:border-gray-600 transition-colors">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Link className="h-5 w-5 text-blue-400" />
                  <Badge
                    variant={integration.status === "conectado" ? "default" : "destructive"}
                    className={
                      integration.status === "conectado"
                        ? "bg-green-900 text-green-300 border-green-700"
                        : "bg-red-900 text-red-300 border-red-700"
                    }
                  >
                    {integration.status === "conectado" ? "Conectado" : "Erro"}
                  </Badge>
                </div>
                <CardTitle className="text-gray-100">{integration.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Última sincronização:</span>
                  <span className="text-gray-300">{integration.lastSync}</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" className="text-gray-400 hover:text-gray-200">
                    <Settings className="h-4 w-4 mr-2" />
                    Config
                  </Button>
                  <Button size="sm" variant="ghost" className="text-gray-400 hover:text-gray-200">
                    <Activity className="h-4 w-4 mr-2" />
                    Logs
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}

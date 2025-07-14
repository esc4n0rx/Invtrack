"use client"
import { motion } from "framer-motion"
import { ClipboardCheck, Play, Pause, Square } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function CountControlPage() {
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-gray-100">Controle de Contagem</h1>
        <p className="text-gray-400 mt-1">Monitoramento e controle das contagens em tempo real</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-100">
              <ClipboardCheck className="h-5 w-5 text-blue-400" />
              Sessão Ativa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Local:</span>
              <span className="text-gray-100">CD Área A</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Iniciado em:</span>
              <span className="text-gray-100">14:30</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Itens contados:</span>
              <span className="text-gray-100">89</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Status:</span>
              <Badge className="bg-green-900 text-green-300 border-green-700">Em andamento</Badge>
            </div>
            <div className="flex gap-2 pt-4">
              <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700">
                <Pause className="h-4 w-4 mr-2" />
                Pausar
              </Button>
              <Button size="sm" variant="destructive">
                <Square className="h-4 w-4 mr-2" />
                Finalizar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-100">Próximas Contagens</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { location: "Loja Norte", scheduled: "16:00", status: "agendada" },
              { location: "CD Área B", scheduled: "17:30", status: "agendada" },
              { location: "Loja Sul", scheduled: "09:00", status: "pendente" },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700"
              >
                <div>
                  <p className="font-medium text-gray-100">{item.location}</p>
                  <p className="text-sm text-gray-400">Agendado para {item.scheduled}</p>
                </div>
                <Button size="sm" variant="ghost" className="text-blue-400 hover:text-blue-300">
                  <Play className="h-4 w-4 mr-2" />
                  Iniciar
                </Button>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

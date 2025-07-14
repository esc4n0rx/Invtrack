"use client"
import { motion } from "framer-motion"
import { FileText, Download, Calendar } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function ReportsPage() {
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Relatórios</h1>
          <p className="text-gray-400 mt-1">Geração e visualização de relatórios do sistema</p>
        </div>

        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <FileText className="h-4 w-4 mr-2" />
          Novo Relatório
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {[
          { title: "Inventário Geral", description: "Relatório completo do inventário", date: "15/01/2024" },
          { title: "Contagens por Loja", description: "Status das contagens por localização", date: "14/01/2024" },
          { title: "Ativos em Trânsito", description: "Movimentações e transferências", date: "13/01/2024" },
        ].map((report, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 * index }}
          >
            <Card className="bg-gray-900 border-gray-700 hover:border-gray-600 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-100">
                  <FileText className="h-5 w-5 text-blue-400" />
                  {report.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-400">{report.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" />
                    {report.date}
                  </div>
                  <Button size="sm" variant="ghost" className="text-gray-400 hover:text-gray-200">
                    <Download className="h-4 w-4 mr-2" />
                    Download
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

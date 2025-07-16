// components/pages/finalizacoes-page.tsx
"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { FileSpreadsheet, Download, Calendar, User } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface Finalizacao {
  id: string
  codigo_inventario: string
  data_finalizacao: string
  usuario_finalizacao: string
  arquivo_excel_url: string
  total_hb_geral: number
  total_hnt_geral: number
  invtrack_inventarios: {
    responsavel: string
    created_at: string
    status: string
  }
}

export function FinalizacoesPage() {
  const [finalizacoes, setFinalizacoes] = React.useState<Finalizacao[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const carregarFinalizacoes = async () => {
      try {
        const response = await fetch('/api/inventarios/finalizacoes')
        const result = await response.json()
        
        if (result.success) {
          setFinalizacoes(result.data)
        }
      } catch (error) {
        console.error('Erro ao carregar finalizações:', error)
      } finally {
        setLoading(false)
      }
    }

    carregarFinalizacoes()
  }, [])

  const handleDownload = (finalizacao: Finalizacao) => {
    const filename = finalizacao.arquivo_excel_url.split('/').pop()
    const downloadUrl = `/api/inventarios/download/${filename}`
    
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = filename || 'inventario.xlsx'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6 bg-gray-950 min-h-full">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
          <span className="ml-3 text-gray-400">Carregando finalizações...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-gray-950 min-h-full">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-gray-100">Histórico de Finalizações</h1>
        <p className="text-gray-400 mt-1">Histórico de inventários finalizados e arquivos Excel gerados</p>
      </motion.div>

      <div className="grid gap-4">
        {finalizacoes.map((finalizacao) => (
          <motion.div
            key={finalizacao.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg text-gray-100">
                      {finalizacao.codigo_inventario}
                    </CardTitle>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {finalizacao.invtrack_inventarios.responsavel}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(finalizacao.data_finalizacao).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>
                  <Badge className="bg-green-900 text-green-300 border-green-700">
                    Finalizado
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-400">Total HB</p>
                    <p className="text-lg font-semibold text-gray-100">
                      {finalizacao.total_hb_geral.toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-400">Total HNT</p>
                    <p className="text-lg font-semibold text-gray-100">
                      {finalizacao.total_hnt_geral.toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-400">Total Geral</p>
                    <p className="text-lg font-semibold text-blue-400">
                      {(finalizacao.total_hb_geral + finalizacao.total_hnt_geral).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-400">Finalizado por</p>
                    <p className="text-sm font-medium text-gray-100">
                      {finalizacao.usuario_finalizacao}
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button
                    onClick={() => handleDownload(finalizacao)}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Excel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {finalizacoes.length === 0 && (
        <div className="text-center py-12">
          <FileSpreadsheet className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400">Nenhuma finalização encontrada</p>
        </div>
      )}
    </div>
  )
}
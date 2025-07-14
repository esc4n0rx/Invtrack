// components/transit/TransitTable.tsx
"use client"

import { motion } from "framer-motion"
import { ArrowRight, Package } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Contagem } from "@/types/contagem"

interface TransitTableProps {
  contagens: Contagem[]
  loading: boolean
}

export function TransitTable({ contagens, loading }: TransitTableProps) {
  if (loading) {
    return (
      <Card className="bg-gray-900 border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            <span className="ml-3 text-gray-400">Carregando dados de trânsito...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (contagens.length === 0) {
    return (
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-100">
            <Package className="h-5 w-5 text-blue-400" />
            Movimentações de Trânsito
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <p className="text-gray-400">Nenhuma movimentação de trânsito encontrada</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-100">
            <Package className="h-5 w-5 text-blue-400" />
            Movimentações de Trânsito ({contagens.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700 hover:bg-gray-800/50">
                  <TableHead className="text-gray-300">Ativo</TableHead>
                  <TableHead className="text-gray-300">Quantidade</TableHead>
                  <TableHead className="text-gray-300">Responsável</TableHead>
                  <TableHead className="text-gray-300">Rota</TableHead>
                  <TableHead className="text-gray-300">Data</TableHead>
                  <TableHead className="text-gray-300">Observações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contagens.map((contagem, index) => (
                  <motion.tr
                    key={contagem.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-gray-700 hover:bg-gray-800/50"
                  >
                    <TableCell className="font-medium text-gray-100">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-blue-900/30 text-blue-300 border-blue-700">
                          {contagem.ativo}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-300">
                      <span className="font-semibold">{contagem.quantidade}</span>
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {contagem.responsavel}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      <div className="flex items-center gap-2">
                        <span className="text-sm bg-gray-800 px-2 py-1 rounded">
                          {contagem.cd_origem}
                        </span>
                        <ArrowRight className="h-4 w-4 text-gray-500" />
                        <span className="text-sm bg-gray-800 px-2 py-1 rounded">
                          {contagem.cd_destino}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-400">
                      {new Date(contagem.data_contagem).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </TableCell>
                    <TableCell className="text-gray-400">
                      {contagem.obs || '-'}
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
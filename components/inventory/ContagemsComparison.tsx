// components/inventory/ContagemsComparison.tsx
"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { AlertTriangle, CheckCircle, Package } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ContagemComparacao } from "@/types/contagem-externa"

interface ContagemsComparisonProps {
  comparacao: ContagemComparacao[]
}

export function ContagemsComparison({ comparacao }: ContagemsComparisonProps) {
  const ativosComDivergencia = comparacao.filter(c => c.divergencias)
  const ativosConsistentes = comparacao.filter(c => !c.divergencias)

  return (
    <div className="space-y-6">
      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4 text-center">
            <Package className="h-8 w-8 text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-100">{comparacao.length}</p>
            <p className="text-sm text-gray-400">Total de Ativos</p>
          </CardContent>
        </Card>
        
        <Card className="bg-red-900/20 border-red-700">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-red-300">{ativosComDivergencia.length}</p>
            <p className="text-sm text-red-400">Com Divergências</p>
          </CardContent>
        </Card>
        
        <Card className="bg-green-900/20 border-green-700">
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-300">{ativosConsistentes.length}</p>
            <p className="text-sm text-green-400">Consistentes</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Comparação */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-100 flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-400" />
            Comparação Detalhada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700">
                <TableHead className="text-gray-300">Ativo</TableHead>
                <TableHead className="text-gray-300">Status</TableHead>
                {comparacao[0]?.contagens.map((_, index) => (
                  <TableHead key={index} className="text-gray-300 text-center">
                    Contagem {index + 1}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparacao.map((item, index) => (
                <motion.tr
                  key={item.ativo}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-gray-700"
                >
                  <TableCell className="text-gray-100 font-medium">
                    {item.ativo}
                  </TableCell>
                  <TableCell>
                    <Badge className={
                      item.divergencias
                        ? "bg-red-900 text-red-300 border-red-700"
                        : "bg-green-900 text-green-300 border-green-700"
                    }>
                      {item.divergencias ? (
                        <>
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Divergente
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Consistente
                        </>
                      )}
                    </Badge>
                  </TableCell>
                  {item.contagens.map((contagem, contagemIndex) => (
                    <TableCell key={contagemIndex} className="text-center">
                      <div className="space-y-1">
                        <p className={`font-semibold ${
                          item.divergencias ? 'text-orange-400' : 'text-gray-100'
                        }`}>
                          {contagem.quantidade}
                        </p>
                        <p className="text-xs text-gray-400">{contagem.contador}</p>
                      </div>
                    </TableCell>
                  ))}
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Divergências Destacadas */}
      {ativosComDivergencia.length > 0 && (
        <Card className="bg-red-900/10 border-red-700">
          <CardHeader>
            <CardTitle className="text-red-300 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Ativos com Divergências
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {ativosComDivergencia.map((item, index) => (
                <motion.div
                  key={item.ativo}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-3 bg-red-900/20 rounded-lg border border-red-800"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-red-200">{item.ativo}</h4>
                    <div className="flex gap-2">
                      {item.contagens.map((contagem, contagemIndex) => (
                        <Badge key={contagemIndex} variant="secondary" className="bg-red-800 text-red-200">
                          {contagem.quantidade} ({contagem.contador})
                        </Badge>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
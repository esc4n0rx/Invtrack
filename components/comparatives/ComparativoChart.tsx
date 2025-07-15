"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart3, TrendingUp, TrendingDown } from "lucide-react"
import { ComparativoResultado,ComparativoTipo} from "@/types/comparativo"
interface ComparativoChartProps {
    comparacao: ComparativoResultado
   }
   
   export function ComparativoChart({ comparacao }: ComparativoChartProps) {
    const tipos = ['loja', 'cd', 'fornecedor', 'transito'] as const
   
    const getTipoLabel = (tipo: string) => {
      const labels = {
        loja: 'Lojas',
        cd: 'Centro de Distribuição',
        fornecedor: 'Fornecedores',
        transito: 'Trânsito'
      }
      return labels[tipo as keyof typeof labels] || tipo
    }
   
    const getTipoColor = (tipo: string) => {
      const colors = {
        loja: 'bg-blue-600',
        cd: 'bg-green-600',
        fornecedor: 'bg-yellow-600',
        transito: 'bg-purple-600'
      }
      return colors[tipo as keyof typeof colors] || 'bg-gray-600'
    }
   
    const getMaxQuantidade = () => {
      return Math.max(
        ...tipos.map(tipo => Math.max(
          comparacao.resumo_por_tipo[tipo].total_quantidade_inv1,
          comparacao.resumo_por_tipo[tipo].total_quantidade_inv2
        ))
      )
    }
   
    const maxQuantidade = getMaxQuantidade()
   
    const formatarNumero = (num: number) => {
      return new Intl.NumberFormat('pt-BR').format(num)
    }
   
    const formatarPercentual = (num: number) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      }).format(num / 100)
    }
   
    return (
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-100">
            <BarChart3 className="h-5 w-5 text-blue-400" />
            Comparação por Tipo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {tipos.map(tipo => {
            const dados = comparacao.resumo_por_tipo[tipo]
            const percentual1 = maxQuantidade > 0 ? (dados.total_quantidade_inv1 / maxQuantidade) * 100 : 0
            const percentual2 = maxQuantidade > 0 ? (dados.total_quantidade_inv2 / maxQuantidade) * 100 : 0
            
            return (
              <div key={tipo} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-100">{getTipoLabel(tipo)}</h3>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={dados.divergencias > 0 ? "destructive" : "default"}
                      className={dados.divergencias > 0 ? "bg-red-900 text-red-300" : "bg-green-900 text-green-300"}
                    >
                      {dados.divergencias} divergências
                    </Badge>
                    <div className="flex items-center gap-1 text-sm">
                      {dados.percentual_diferenca > 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-400" />
                      ) : dados.percentual_diferenca < 0 ? (
                        <TrendingDown className="h-4 w-4 text-red-400" />
                      ) : null}
                      <span className={
                        dados.percentual_diferenca > 0 ? "text-green-400" : 
                        dados.percentual_diferenca < 0 ? "text-red-400" : "text-gray-400"
                      }>
                        {formatarPercentual(dados.percentual_diferenca)}
                      </span>
                    </div>
                  </div>
                </div>
   
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Inventário 1 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">
                        {comparacao.inventario_1.codigo}
                      </span>
                      <span className="text-sm font-medium text-blue-400">
                        {formatarNumero(dados.total_quantidade_inv1)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentual1}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-400">
                      {dados.total_contagens_inv1} contagens
                    </div>
                  </div>
   
                  {/* Inventário 2 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">
                        {comparacao.inventario_2.codigo}
                      </span>
                      <span className="text-sm font-medium text-purple-400">
                        {formatarNumero(dados.total_quantidade_inv2)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentual2}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-400">
                      {dados.total_contagens_inv2} contagens
                    </div>
                  </div>
                </div>
   
                {/* Diferença */}
                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Diferença absoluta:</span>
                    <span className={`text-sm font-medium ${
                      dados.diferenca_quantidade > 0 ? "text-green-400" : 
                      dados.diferenca_quantidade < 0 ? "text-red-400" : "text-gray-400"
                    }`}>
                      {dados.diferenca_quantidade > 0 ? "+" : ""}
                      {formatarNumero(dados.diferenca_quantidade)}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
   
          {/* Resumo Geral */}
          <div className="mt-6 p-4 bg-gray-800 rounded-lg">
            <h3 className="text-lg font-medium text-gray-100 mb-3">Resumo Geral</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-400">
                  {formatarNumero(comparacao.estatisticas_comparacao.total_ativos_comparados)}
                </p>
                <p className="text-sm text-gray-400">Itens Comparados</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-400">
                  {formatarNumero(comparacao.estatisticas_comparacao.divergencias_encontradas)}
                </p>
                <p className="text-sm text-gray-400">Divergências</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">
                  {formatarNumero(comparacao.estatisticas_comparacao.ativos_em_ambos)}
                </p>
                <p className="text-sm text-gray-400">Em Ambos</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
   }
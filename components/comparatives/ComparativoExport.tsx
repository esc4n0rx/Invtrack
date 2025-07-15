// components/comparatives/ComparativoExport.tsx
"use client"

import * as React from "react"
import { Download, FileText, FileSpreadsheet, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ComparativoResultado } from "@/types/comparativo"

interface ComparativoExportProps {
  comparacao: ComparativoResultado
  isOpen: boolean
  onClose: () => void
}

export function ComparativoExport({ comparacao, isOpen, onClose }: ComparativoExportProps) {
  const [formato, setFormato] = React.useState<'json' | 'csv'>('csv')
  const [incluirResumo, setIncluirResumo] = React.useState(true)
  const [incluirDetalhes, setIncluirDetalhes] = React.useState(true)
  const [apenasConvergencias, setApenasConvergencias] = React.useState(false)
  const [isExporting, setIsExporting] = React.useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    
    try {
      // Preparar dados para exportação
      const dadosExportacao = {
        metadata: {
          inventario_1: comparacao.inventario_1,
          inventario_2: comparacao.inventario_2,
          data_comparacao: new Date().toISOString(),
          formato
        },
        ...(incluirResumo && {
          resumo: {
            estatisticas_comparacao: comparacao.estatisticas_comparacao,
            resumo_por_tipo: comparacao.resumo_por_tipo
          }
        }),
        ...(incluirDetalhes && {
          detalhes: apenasConvergencias 
            ? comparacao.detalhes_comparacao.filter(d => d.divergencia)
            : comparacao.detalhes_comparacao
        })
      }

      if (formato === 'json') {
        // Exportar JSON
        const blob = new Blob([JSON.stringify(dadosExportacao, null, 2)], {
          type: 'application/json'
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `comparativo_${comparacao.inventario_1.codigo}_vs_${comparacao.inventario_2.codigo}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else {
        // Exportar CSV
        const csvData = gerarCSV(dadosExportacao)
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `comparativo_${comparacao.inventario_1.codigo}_vs_${comparacao.inventario_2.codigo}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }

      onClose()
    } catch (error) {
      console.error('Erro ao exportar:', error)
      alert('Erro ao exportar dados')
    } finally {
      setIsExporting(false)
    }
  }

  const gerarCSV = (dados: any) => {
    const linhas = []
    
    // Header
    linhas.push([
      'Ativo',
      'Tipo',
      'Localização',
      `Quantidade ${dados.metadata.inventario_1.codigo}`,
      `Quantidade ${dados.metadata.inventario_2.codigo}`,
      'Diferença',
      'Percentual Diferença',
      'Divergência'
    ])

    // Dados
    if (dados.detalhes) {
      dados.detalhes.forEach((item: any) => {
        linhas.push([
          item.ativo,
          item.tipo,
          item.localizacao,
          item.quantidade_inv1,
          item.quantidade_inv2,
          item.diferenca,
          `${item.percentual_diferenca.toFixed(2)}%`,
          item.divergencia ? 'Sim' : 'Não'
        ])
      })
    }

    return linhas.map(linha => 
      linha.map(campo => 
        typeof campo === 'string' && campo.includes(',') 
          ? `"${campo}"` 
          : campo
      ).join(',')
    ).join('\n')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-gray-100">Exportar Comparativo</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Informações do Comparativo */}
          <div className="bg-gray-800 rounded-lg p-4 space-y-2">
            <h3 className="font-medium text-gray-100">Comparativo</h3>
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-900 text-blue-300">
                {comparacao.inventario_1.codigo}
              </Badge>
              <span className="text-gray-400">vs</span>
              <Badge className="bg-purple-900 text-purple-300">
                {comparacao.inventario_2.codigo}
              </Badge>
            </div>
            <p className="text-sm text-gray-400">
              {comparacao.estatisticas_comparacao.total_ativos_comparados} itens • {comparacao.estatisticas_comparacao.divergencias_encontradas} divergências
            </p>
          </div>

          {/* Formato */}
          <div className="space-y-3">
            <Label className="text-gray-300">Formato de Exportação</Label>
            <div className="flex gap-3">
              <Button
                variant={formato === 'csv' ? 'default' : 'outline'}
                onClick={() => setFormato('csv')}
                className="flex-1"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button
                variant={formato === 'json' ? 'default' : 'outline'}
                onClick={() => setFormato('json')}
                className="flex-1"
              >
                <FileText className="h-4 w-4 mr-2" />
                JSON
              </Button>
            </div>
          </div>

          {/* Opções de Conteúdo */}
          <div className="space-y-3">
            <Label className="text-gray-300">Conteúdo</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="incluir-resumo"
                  checked={incluirResumo}
                  onCheckedChange={(checked) => setIncluirResumo(checked as boolean)}
                />
                <Label htmlFor="incluir-resumo" className="text-sm text-gray-300">
                  Incluir resumo estatístico
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="incluir-detalhes"
                  checked={incluirDetalhes}
                  onCheckedChange={(checked) => setIncluirDetalhes(checked as boolean)}
                />
                <Label htmlFor="incluir-detalhes" className="text-sm text-gray-300">
                  Incluir detalhes dos itens
                </Label>
              </div>
              
              {incluirDetalhes && (
                <div className="flex items-center space-x-2 ml-6">
                  <Checkbox
                    id="apenas-divergencias"
                    checked={apenasConvergencias}
                    onCheckedChange={(checked) => setApenasConvergencias(checked as boolean)}
                  />
                  <Label htmlFor="apenas-divergencias" className="text-sm text-gray-300">
                    Apenas divergências
                  </Label>
                </div>
              )}
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-gray-600"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleExport}
              disabled={isExporting || (!incluirResumo && !incluirDetalhes)}
              className="bg-green-600 hover:bg-green-700"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Exportando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
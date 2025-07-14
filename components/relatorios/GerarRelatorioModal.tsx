// components/relatorios/GerarRelatorioModal.tsx
"use client"

import * as React from "react"
import { useState } from "react"
import { motion } from "framer-motion"
import { X, FileText, Filter, Calendar, User, AlertCircle } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { TipoRelatorio, FiltrosRelatorio, CreateRelatorioRequest } from "@/types/relatorio"
import { lojas } from "@/data/loja"
import { setoresCD } from "@/data/setores"
import { ativos } from "@/data/ativos"

interface GerarRelatorioModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCriar: (dados: CreateRelatorioRequest) => Promise<boolean>
  loading?: boolean
}

const tiposRelatorio: { value: TipoRelatorio; label: string; description: string }[] = [
  {
    value: 'inventario_completo',
    label: 'Inventário Completo',
    description: 'Relatório detalhado com todas as contagens do inventário'
  },
  {
    value: 'contagens_por_loja',
    label: 'Contagens por Loja',
    description: 'Agrupamento de contagens organizadas por loja'
  },
  {
    value: 'contagens_por_cd',
    label: 'Contagens por CD',
    description: 'Agrupamento de contagens organizadas por setor do CD'
  },
  {
    value: 'ativos_em_transito',
    label: 'Ativos em Trânsito',
    description: 'Relatório de movimentações entre locais'
  },
  {
    value: 'comparativo_contagens',
    label: 'Comparativo de Contagens',
    description: 'Comparação entre contagens internas e externas'
  },
  {
    value: 'divergencias',
    label: 'Relatório de Divergências',
    description: 'Identificação de diferenças entre contagens'
  },
  {
    value: 'resumo_executivo',
    label: 'Resumo Executivo',
    description: 'Visão executiva do status do inventário'
  }
]

export function GerarRelatorioModal({ open, onOpenChange, onCriar, loading = false }: GerarRelatorioModalProps) {
  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState<TipoRelatorio>('inventario_completo')
  const [formato, setFormato] = useState<'json' | 'csv' | 'excel' | 'pdf'>('json')
  const [observacoes, setObservacoes] = useState('')
  const [filtros, setFiltros] = useState<FiltrosRelatorio>({})
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!nome.trim()) {
      setError('Nome do relatório é obrigatório')
      return
    }

    const dados: CreateRelatorioRequest = {
      nome: nome.trim(),
      tipo,
      formato,
      filtros,
      usuario_criacao: 'Usuario Sistema', // TODO: Pegar do contexto de autenticação
      observacoes: observacoes.trim() || undefined
    }

    const sucesso = await onCriar(dados)
    if (sucesso) {
      // Reset form
      setNome('')
      setTipo('inventario_completo')
      setFormato('json')
      setObservacoes('')
      setFiltros({})
      setError(null)
      onOpenChange(false)
    }
  }

  const tipoSelecionado = tiposRelatorio.find(t => t.value === tipo)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-gray-700 max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-gray-100 flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-400" />
            Gerar Novo Relatório
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Configure os parâmetros para gerar um relatório personalizado
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Básicas */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg text-gray-100">Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Nome do Relatório *</Label>
                  <Input
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Inventário Mensal Janeiro 2024"
                    className="bg-gray-700 border-gray-600 text-gray-100"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Formato de Saída</Label>
                  <Select value={formato} onValueChange={(value: any) => setFormato(value)}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                      <SelectItem value="pdf">PDF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Tipo de Relatório *</Label>
                <Select value={tipo} onValueChange={(value: TipoRelatorio) => setTipo(value)}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    {tiposRelatorio.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        <div>
                          <div className="font-medium">{tipo.label}</div>
                          <div className="text-xs text-gray-400">{tipo.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {tipoSelecionado && (
                  <div className="bg-blue-900/20 border border-blue-700 rounded-md p-3">
                    <p className="text-blue-300 text-sm">{tipoSelecionado.description}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Filtros Avançados */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg text-gray-100 flex items-center gap-2">
                <Filter className="h-5 w-5 text-green-400" />
                Filtros Avançados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="geral" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-gray-700">
                  <TabsTrigger value="geral" className="data-[state=active]:bg-gray-600">Geral</TabsTrigger>
                  <TabsTrigger value="locais" className="data-[state=active]:bg-gray-600">Locais</TabsTrigger>
                  <TabsTrigger value="avancado" className="data-[state=active]:bg-gray-600">Avançado</TabsTrigger>
                </TabsList>

                <TabsContent value="geral" className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-gray-300">Tipo de Contagem</Label>
                      <Select 
                        value={filtros.tipo_contagem || 'todos'} 
                        onValueChange={(value) => setFiltros({...filtros, tipo_contagem: value as any})}
                      >
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-100">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-600">
                          <SelectItem value="todos">Todos os tipos</SelectItem>
                          <SelectItem value="loja">Apenas Lojas</SelectItem>
                          <SelectItem value="cd">Apenas CD</SelectItem>
                          <SelectItem value="fornecedor">Apenas Fornecedor</SelectItem>
                          <SelectItem value="transito">Apenas Trânsito</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-300">Status do Inventário</Label>
                      <Select 
                        value={filtros.status_inventario || 'ativo'} 
                        onValueChange={(value) => setFiltros({...filtros, status_inventario: value as any})}
                      >
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-100">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-600">
                          <SelectItem value="ativo">Apenas Ativo</SelectItem>
                          <SelectItem value="finalizado">Apenas Finalizado</SelectItem>
                          <SelectItem value="todos">Todos os Status</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-gray-300">Data Início</Label>
                      <Input
                        type="date"
                        value={filtros.data_inicio || ''}
                        onChange={(e) => setFiltros({...filtros, data_inicio: e.target.value})}
                        className="bg-gray-700 border-gray-600 text-gray-100"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-300">Data Fim</Label>
                      <Input
                        type="date"
                        value={filtros.data_fim || ''}
                        onChange={(e) => setFiltros({...filtros, data_fim: e.target.value})}
                        className="bg-gray-700 border-gray-600 text-gray-100"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="locais" className="space-y-4 mt-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-gray-300">Lojas Específicas</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 bg-gray-700 rounded">
                        {Object.values(lojas).flat().map((loja) => (
                          <label key={loja} className="flex items-center space-x-2 text-sm">
                            <input
                              type="checkbox"
                              checked={filtros.loja_especifica?.includes(loja) || false}
                              onChange={(e) => {
                                const current = filtros.loja_especifica || []
                                if (e.target.checked) {
                                  setFiltros({...filtros, loja_especifica: [...current, loja]})
                                } else {
                                  setFiltros({...filtros, loja_especifica: current.filter(l => l !== loja)})
                                }
                              }}
                              className="rounded"
                            />
                            <span className="text-gray-300">{loja}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-300">Setores CD Específicos</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 bg-gray-700 rounded">
                        {setoresCD.map((setor) => (
                          <label key={setor} className="flex items-center space-x-2 text-sm">
                            <input
                              type="checkbox"
                              checked={filtros.setor_cd_especifico?.includes(setor) || false}
                              onChange={(e) => {
                                const current = filtros.setor_cd_especifico || []
                                if (e.target.checked) {
                                  setFiltros({...filtros, setor_cd_especifico: [...current, setor]})
                                } else {
                                  setFiltros({...filtros, setor_cd_especifico: current.filter(s => s !== setor)})
                                }
                              }}
                              className="rounded"
                            />
                            <span className="text-gray-300">{setor}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="avancado" className="space-y-4 mt-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-gray-300">Incluir Quantidades Zeradas</Label>
                        <p className="text-xs text-gray-400">Incluir registros com quantidade 0</p>
                      </div>
                      <Switch
                        checked={filtros.incluir_zerados || false}
                        onCheckedChange={(checked) => setFiltros({...filtros, incluir_zerados: checked})}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-gray-300">Apenas Divergências</Label>
                        <p className="text-xs text-gray-400">Mostrar apenas itens com divergências</p>
                      </div>
                      <Switch
                        checked={filtros.apenas_divergencias || false}
                        onCheckedChange={(checked) => setFiltros({...filtros, apenas_divergencias: checked})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-300">Ativos Específicos</Label>
                      <Input
                        placeholder="Ex: HB 623, HB 618 (separados por vírgula)"
                        value={filtros.ativo_especifico?.join(', ') || ''}
                        onChange={(e) => {
                          const ativos = e.target.value.split(',').map(a => a.trim()).filter(a => a)
                          setFiltros({...filtros, ativo_especifico: ativos})
                        }}
                        className="bg-gray-700 border-gray-600 text-gray-100"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-300">Responsáveis</Label>
                      <Input
                        placeholder="Ex: João, Maria (separados por vírgula)"
                        value={filtros.responsavel?.join(', ') || ''}
                        onChange={(e) => {
                          const responsaveis = e.target.value.split(',').map(r => r.trim()).filter(r => r)
                          setFiltros({...filtros, responsavel: responsaveis})
                        }}
                        className="bg-gray-700 border-gray-600 text-gray-100"
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Observações */}
          <div className="space-y-2">
            <Label className="text-gray-300">Observações</Label>
            <Textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Observações adicionais sobre o relatório..."
              className="bg-gray-700 border-gray-600 text-gray-100"
              rows={3}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-900/20 border border-red-700 rounded-md p-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <span className="text-red-300 text-sm">{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Gerando...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Gerar Relatório
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
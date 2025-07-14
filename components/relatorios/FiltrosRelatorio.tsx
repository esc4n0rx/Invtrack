// components/relatorios/FiltrosRelatorio.tsx
"use client"

import * as React from "react"
import { useState } from "react"
import { Search, Filter, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TipoRelatorio } from "@/types/relatorio"

interface FiltrosRelatorioProps {
  onFilterChange: (filtros: FiltroAtivos) => void
}

export interface FiltroAtivos {
  busca: string
  tipo: TipoRelatorio | 'todos'
  status: 'processando' | 'concluido' | 'erro' | 'todos'
  formato: 'json' | 'csv' | 'excel' | 'pdf' | 'todos'
}

export function FiltrosRelatorio({ onFilterChange }: FiltrosRelatorioProps) {
  const [filtros, setFiltros] = useState<FiltroAtivos>({
    busca: '',
    tipo: 'todos',
    status: 'todos',
    formato: 'todos'
  })

  const [filtrosAtivos, setFiltrosAtivos] = useState<string[]>([])

  const handleFilterChange = (key: keyof FiltroAtivos, value: string) => {
    const novosFiltros = { ...filtros, [key]: value }
    setFiltros(novosFiltros)
    onFilterChange(novosFiltros)
    atualizarFiltrosAtivos(novosFiltros)
  }

  const atualizarFiltrosAtivos = (filtros: FiltroAtivos) => {
    const ativos: string[] = []
    
    if (filtros.busca) ativos.push(`Busca: "${filtros.busca}"`)
    if (filtros.tipo !== 'todos') ativos.push(`Tipo: ${filtros.tipo}`)
    if (filtros.status !== 'todos') ativos.push(`Status: ${filtros.status}`)
    if (filtros.formato !== 'todos') ativos.push(`Formato: ${filtros.formato}`)
    
    setFiltrosAtivos(ativos)
  }

  const limparFiltros = () => {
    const filtrosLimpos: FiltroAtivos = {
      busca: '',
      tipo: 'todos',
      status: 'todos',
      formato: 'todos'
    }
    setFiltros(filtrosLimpos)
    setFiltrosAtivos([])
    onFilterChange(filtrosLimpos)
  }

  const removerFiltro = (filtro: string) => {
    let novosFiltros = { ...filtros }
    
    if (filtro.startsWith('Busca:')) {
      novosFiltros.busca = ''
    } else if (filtro.startsWith('Tipo:')) {
      novosFiltros.tipo = 'todos'
    } else if (filtro.startsWith('Status:')) {
      novosFiltros.status = 'todos'
    } else if (filtro.startsWith('Formato:')) {
      novosFiltros.formato = 'todos'
    }
    
    setFiltros(novosFiltros)
    onFilterChange(novosFiltros)
    atualizarFiltrosAtivos(novosFiltros)
  }

  return (
    <div className="space-y-4">
      {/* Controles de Filtro */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Campo de Busca */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar por nome, tipo ou usuário..."
            value={filtros.busca}
            onChange={(e) => handleFilterChange('busca', e.target.value)}
            className="pl-10 bg-gray-800 border-gray-600 text-gray-100"
          />
        </div>

        {/* Filtros por Select */}
        <div className="flex gap-2">
          <Select value={filtros.tipo} onValueChange={(value) => handleFilterChange('tipo', value)}>
            <SelectTrigger className="w-48 bg-gray-800 border-gray-600 text-gray-100">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600">
              <SelectItem value="todos">Todos os tipos</SelectItem>
              <SelectItem value="inventario_completo">Inventário Completo</SelectItem>
              <SelectItem value="contagens_por_loja">Contagens por Loja</SelectItem>
              <SelectItem value="contagens_por_cd">Contagens por CD</SelectItem>
              <SelectItem value="ativos_em_transito">Ativos em Trânsito</SelectItem>
              <SelectItem value="comparativo_contagens">Comparativo</SelectItem>
              <SelectItem value="divergencias">Divergências</SelectItem>
              <SelectItem value="resumo_executivo">Resumo Executivo</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filtros.status} onValueChange={(value) => handleFilterChange('status', value)}>
            <SelectTrigger className="w-40 bg-gray-800 border-gray-600 text-gray-100">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600">
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="processando">Processando</SelectItem>
              <SelectItem value="concluido">Concluído</SelectItem>
              <SelectItem value="erro">Erro</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filtros.formato} onValueChange={(value) => handleFilterChange('formato', value)}>
            <SelectTrigger className="w-32 bg-gray-800 border-gray-600 text-gray-100">
              <SelectValue placeholder="Formato" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600">
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="json">JSON</SelectItem>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="excel">Excel</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Filtros Ativos */}
      {filtrosAtivos.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-400">Filtros ativos:</span>
          
          {filtrosAtivos.map((filtro, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="bg-blue-900/20 text-blue-300 border-blue-700 flex items-center gap-1"
            >
              {filtro}
              <X
                className="h-3 w-3 cursor-pointer hover:text-blue-200"
                onClick={() => removerFiltro(filtro)}
              />
            </Badge>
          ))}
          
          <Button
            size="sm"
            variant="ghost"
            onClick={limparFiltros}
            className="text-gray-400 hover:text-gray-200 text-xs"
          >
            Limpar todos
          </Button>
        </div>
      )}
    </div>
  )
}
// components/contagens/ContagemsTable.tsx
"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Search, Filter, Edit, Package, Building, Truck, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Contagem } from "@/types/contagem"
import { DeleteContagemRequest } from "@/types/contagem"

interface ContagemsTableProps {
  contagens: Contagem[]
  loading: boolean
  onEdit: (contagem: Contagem) => void
  onRemove?: (dados: DeleteContagemRequest) => void
}

export function ContagemsTable({ contagens, loading, onEdit, onRemove }: ContagemsTableProps) {
  const [filtroTexto, setFiltroTexto] = React.useState('')
  const [filtroTipo, setFiltroTipo] = React.useState<string>('todos')
  const [filtroAtivo, setFiltroAtivo] = React.useState<string>('todos')

  const contagensFiltradas = React.useMemo(() => {
    return contagens.filter(contagem => {
      const matchTexto = !filtroTexto || 
        contagem.ativo.toLowerCase().includes(filtroTexto.toLowerCase()) ||
        contagem.responsavel.toLowerCase().includes(filtroTexto.toLowerCase()) ||
        (contagem.obs && contagem.obs.toLowerCase().includes(filtroTexto.toLowerCase()))

      const matchTipo = filtroTipo === 'todos' || contagem.tipo === filtroTipo
      const matchAtivo = filtroAtivo === 'todos' || contagem.ativo === filtroAtivo

      return matchTexto && matchTipo && matchAtivo
    })
  }, [contagens, filtroTexto, filtroTipo, filtroAtivo])

  const ativosUnicos = React.useMemo(() => {
    const ativos = [...new Set(contagens.map(c => c.ativo))]
    return ativos.sort()
  }, [contagens])

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'loja':
        return <Building className="h-4 w-4 text-blue-400" />
      case 'cd':
        return <Package className="h-4 w-4 text-green-400" />
      case 'transito':
        return <Truck className="h-4 w-4 text-orange-400" />
      case 'fornecedor':
        return <Users className="h-4 w-4 text-purple-400" />
      default:
        return <Package className="h-4 w-4 text-gray-400" />
    }
  }

  const getTipoBadge = (tipo: string) => {
    const styles = {
      loja: "bg-blue-900 text-blue-300 border-blue-700",
      cd: "bg-green-900 text-green-300 border-green-700",
      transito: "bg-orange-900 text-orange-300 border-orange-700",
      fornecedor: "bg-purple-900 text-purple-300 border-purple-700"
    }

    return (
      <Badge className={styles[tipo as keyof typeof styles] || "bg-gray-700 text-gray-300"}>
        {tipo.toUpperCase()}
      </Badge>
    )
  }

  const getLocalInfo = (contagem: Contagem) => {
    switch (contagem.tipo) {
      case 'loja':
        return contagem.loja || 'N/A'
      case 'cd':
        return contagem.setor_cd || 'N/A'
      case 'transito':
        return `${contagem.cd_origem} → ${contagem.cd_destino}`
      case 'fornecedor':
        return contagem.fornecedor || 'N/A'
      default:
        return 'N/A'
    }
  }

  if (loading) {
    return (
      <Card className="bg-gray-900 border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            <span className="ml-3 text-gray-400">Carregando contagens...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (contagens.length === 0) {
    return (
      <Card className="bg-gray-900 border-gray-700">
        <CardContent className="p-6">
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">Nenhuma contagem encontrada</h3>
            <p className="text-gray-500">Adicione contagens para visualizá-las aqui</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader>
        <CardTitle className="text-gray-100 flex items-center gap-2">
          <Package className="h-5 w-5 text-blue-400" />
          Contagens Registradas
          <Badge variant="secondary" className="ml-2 bg-gray-700 text-gray-300">
            {contagensFiltradas.length} de {contagens.length}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar por ativo, responsável ou observação..."
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-600 text-gray-100"
            />
          </div>

          <Select value={filtroTipo} onValueChange={setFiltroTipo}>
            <SelectTrigger className="w-full sm:w-40 bg-gray-800 border-gray-600 text-gray-100">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600">
              <SelectItem value="todos">Todos os tipos</SelectItem>
              <SelectItem value="loja">Loja</SelectItem>
              <SelectItem value="cd">CD</SelectItem>
              <SelectItem value="transito">Trânsito</SelectItem>
             <SelectItem value="fornecedor">Fornecedor</SelectItem>
           </SelectContent>
         </Select>

         <Select value={filtroAtivo} onValueChange={setFiltroAtivo}>
           <SelectTrigger className="w-full sm:w-40 bg-gray-800 border-gray-600 text-gray-100">
             <SelectValue placeholder="Ativo" />
           </SelectTrigger>
           <SelectContent className="bg-gray-800 border-gray-600">
             <SelectItem value="todos">Todos os ativos</SelectItem>
             {ativosUnicos.map((ativo) => (
               <SelectItem key={ativo} value={ativo}>{ativo}</SelectItem>
             ))}
           </SelectContent>
         </Select>

         <Button
           variant="outline"
           onClick={() => {
             setFiltroTexto('')
             setFiltroTipo('todos')
             setFiltroAtivo('todos')
           }}
           className="border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700"
         >
           <Filter className="h-4 w-4 mr-2" />
           Limpar
         </Button>
       </div>

       {/* Tabela */}
       <div className="border border-gray-700 rounded-lg overflow-hidden">
         <Table>
           <TableHeader>
             <TableRow className="border-gray-700 bg-gray-800">
               <TableHead className="text-gray-300">Tipo</TableHead>
               <TableHead className="text-gray-300">Ativo</TableHead>
               <TableHead className="text-gray-300">Local/Contexto</TableHead>
               <TableHead className="text-gray-300">Quantidade</TableHead>
               <TableHead className="text-gray-300">Responsável</TableHead>
               <TableHead className="text-gray-300">Data</TableHead>
               <TableHead className="text-gray-300">Observações</TableHead>
               <TableHead className="text-gray-300 w-20">Ações</TableHead>
             </TableRow>
           </TableHeader>
           <TableBody>
             {contagensFiltradas.map((contagem, index) => (
               <motion.tr
                 key={contagem.id}
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: index * 0.05 }}
                 className="border-gray-700 hover:bg-gray-800/50 transition-colors"
               >
                 <TableCell>
                   <div className="flex items-center gap-2">
                     {getTipoIcon(contagem.tipo)}
                     {getTipoBadge(contagem.tipo)}
                   </div>
                 </TableCell>
                 <TableCell>
                   <span className="font-medium text-gray-100">{contagem.ativo}</span>
                 </TableCell>
                 <TableCell>
                   <span className="text-gray-300">{getLocalInfo(contagem)}</span>
                 </TableCell>
                 <TableCell>
                   <span className="font-semibold text-blue-400">{contagem.quantidade}</span>
                 </TableCell>
                 <TableCell>
                   <span className="text-gray-300">{contagem.responsavel}</span>
                 </TableCell>
                 <TableCell>
                   <span className="text-gray-400 text-sm">
                     {new Date(contagem.data_contagem).toLocaleString('pt-BR', {
                       day: '2-digit',
                       month: '2-digit',
                       year: 'numeric',
                       hour: '2-digit',
                       minute: '2-digit'
                     })}
                   </span>
                 </TableCell>
                 <TableCell>
                   {contagem.obs ? (
                     <span className="text-gray-400 text-sm truncate block max-w-32" title={contagem.obs}>
                       {contagem.obs}
                     </span>
                   ) : (
                     <span className="text-gray-500 text-sm">-</span>
                   )}
                 </TableCell>
                 <TableCell>
                   <Button
                     variant="ghost"
                     size="sm"
                     onClick={() => onEdit(contagem)}
                     className="text-gray-400 hover:text-gray-200 hover:bg-gray-700"
                   >
                     <Edit className="h-4 w-4" />
                   </Button>
                   {onRemove && (
                     <Button
                       variant="ghost"
                       size="sm"
                       onClick={() => onRemove({ id: contagem.id, usuario_exclusao: '', motivo_exclusao: '' })}
                       className="text-red-400 hover:text-red-200 hover:bg-red-700 ml-1"
                     >
                       Remover
                     </Button>
                   )}
                 </TableCell>
               </motion.tr>
             ))}
           </TableBody>
         </Table>
       </div>

       {contagensFiltradas.length === 0 && contagens.length > 0 && (
         <div className="text-center py-8">
           <Filter className="h-8 w-8 text-gray-400 mx-auto mb-2" />
           <p className="text-gray-400">Nenhuma contagem encontrada com os filtros aplicados</p>
         </div>
       )}
     </CardContent>
   </Card>
 )
}
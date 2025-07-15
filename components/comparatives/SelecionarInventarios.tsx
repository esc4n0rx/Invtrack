"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Search, Filter, BarChart3, AlertCircle, Calendar, User } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ComparativoInventario, ComparativoRequest } from "@/types/comparativo"

interface SelecionarInventariosProps {
  inventarios: ComparativoInventario[]
  loading: boolean
  error: string | null
  onComparar: (request: ComparativoRequest) => void
  onRecarregar: () => void
}

export function SelecionarInventarios({ 
  inventarios, 
  loading, 
  error, 
  onComparar, 
  onRecarregar 
}: SelecionarInventariosProps) {
  const [inventario1, setInventario1] = React.useState<string>("")
  const [inventario2, setInventario2] = React.useState<string>("")
  const [tipoComparacao, setTipoComparacao] = React.useState<string>("geral")
  const [incluirZerados, setIncluirZerados] = React.useState(false)
  const [apenasdivergencias, setApenasivergencias] = React.useState(false)
  const [filtroAtivos, setFiltroAtivos] = React.useState<string>("")
  const [filtroLojas, setFiltroLojas] = React.useState<string>("")
  const [filtroSetores, setFiltroSetores] = React.useState<string>("")
  const [searchTerm, setSearchTerm] = React.useState("")

  const inventariosFiltrados = React.useMemo(() => {
    if (!searchTerm) return inventarios
    
    const termo = searchTerm.toLowerCase()
    return inventarios.filter(inv => 
      inv.codigo.toLowerCase().includes(termo) ||
      inv.responsavel.toLowerCase().includes(termo)
    )
  }, [inventarios, searchTerm])

  const handleComparar = () => {
    if (!inventario1 || !inventario2) {
      alert("Por favor, selecione dois inventários para comparar")
      return
    }

    const request: ComparativoRequest = {
      inventario_1: inventario1,
      inventario_2: inventario2,
      tipo_comparacao: tipoComparacao as any,
      incluir_zerados: incluirZerados,
      apenas_divergencias: apenasdivergencias,
      filtros: {
        ...(filtroAtivos && { ativos: filtroAtivos.split(',').map(a => a.trim()) }),
        ...(filtroLojas && { lojas: filtroLojas.split(',').map(l => l.trim()) }),
        ...(filtroSetores && { setores: filtroSetores.split(',').map(s => s.trim()) })
      }
    }

    onComparar(request)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'bg-green-900 text-green-300 border-green-700'
      case 'finalizado':
        return 'bg-blue-900 text-blue-300 border-blue-700'
      case 'cancelado':
        return 'bg-red-900 text-red-300 border-red-700'
      default:
        return 'bg-gray-900 text-gray-300 border-gray-700'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
        <span className="ml-3 text-gray-400">Carregando inventários...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Alert className="bg-red-900/20 border-red-700">
        <AlertCircle className="h-4 w-4 text-red-400" />
        <AlertDescription className="text-red-300">
          {error}
          <Button 
            onClick={onRecarregar} 
            variant="link" 
            className="text-red-400 hover:text-red-300 p-0 ml-2"
          >
            Tentar novamente
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filtros e Busca */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-100">
            <Search className="h-5 w-5 text-blue-400" />
            Buscar Inventários
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por código ou responsável..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-gray-800 border-gray-600 text-gray-100"
             />
           </div>
           <Button onClick={onRecarregar} variant="outline" className="border-gray-600">
             Atualizar
           </Button>
         </div>
       </CardContent>
     </Card>

     {/* Seleção de Inventários */}
     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
       {/* Inventário 1 */}
       <Card className="bg-gray-900 border-gray-700">
         <CardHeader>
           <CardTitle className="text-gray-100">Inventário 1</CardTitle>
         </CardHeader>
         <CardContent className="space-y-4">
           <Select value={inventario1} onValueChange={setInventario1}>
             <SelectTrigger className="bg-gray-800 border-gray-600">
               <SelectValue placeholder="Selecione o primeiro inventário" />
             </SelectTrigger>
             <SelectContent className="bg-gray-800 border-gray-600">
               {inventariosFiltrados.map((inv) => (
                 <SelectItem key={inv.id} value={inv.codigo} className="text-gray-100">
                   <div className="flex items-center justify-between w-full">
                     <span>{inv.codigo}</span>
                     <Badge className={getStatusColor(inv.status)}>
                       {inv.status}
                     </Badge>
                   </div>
                 </SelectItem>
               ))}
             </SelectContent>
           </Select>
           
           {inventario1 && (
             <motion.div
               initial={{ opacity: 0, height: 0 }}
               animate={{ opacity: 1, height: "auto" }}
               className="bg-gray-800 p-4 rounded-lg space-y-2"
             >
               {(() => {
                 const inv = inventarios.find(i => i.codigo === inventario1)
                 if (!inv) return null
                 return (
                   <>
                     <div className="flex items-center gap-2 text-sm text-gray-300">
                       <User className="h-4 w-4" />
                       <span>Responsável: {inv.responsavel}</span>
                     </div>
                     <div className="flex items-center gap-2 text-sm text-gray-300">
                       <Calendar className="h-4 w-4" />
                       <span>Criado em: {new Date(inv.data_criacao).toLocaleDateString()}</span>
                     </div>
                     <div className="grid grid-cols-2 gap-4 mt-3">
                       <div className="text-center">
                         <p className="text-lg font-bold text-blue-400">{inv.total_contagens}</p>
                         <p className="text-xs text-gray-400">Contagens</p>
                       </div>
                       <div className="text-center">
                         <p className="text-lg font-bold text-green-400">{inv.total_ativos}</p>
                         <p className="text-xs text-gray-400">Ativos</p>
                       </div>
                     </div>
                   </>
                 )
               })()}
             </motion.div>
           )}
         </CardContent>
       </Card>

       {/* Inventário 2 */}
       <Card className="bg-gray-900 border-gray-700">
         <CardHeader>
           <CardTitle className="text-gray-100">Inventário 2</CardTitle>
         </CardHeader>
         <CardContent className="space-y-4">
           <Select value={inventario2} onValueChange={setInventario2}>
             <SelectTrigger className="bg-gray-800 border-gray-600">
               <SelectValue placeholder="Selecione o segundo inventário" />
             </SelectTrigger>
             <SelectContent className="bg-gray-800 border-gray-600">
               {inventariosFiltrados.filter(inv => inv.codigo !== inventario1).map((inv) => (
                 <SelectItem key={inv.id} value={inv.codigo} className="text-gray-100">
                   <div className="flex items-center justify-between w-full">
                     <span>{inv.codigo}</span>
                     <Badge className={getStatusColor(inv.status)}>
                       {inv.status}
                     </Badge>
                   </div>
                 </SelectItem>
               ))}
             </SelectContent>
           </Select>
           
           {inventario2 && (
             <motion.div
               initial={{ opacity: 0, height: 0 }}
               animate={{ opacity: 1, height: "auto" }}
               className="bg-gray-800 p-4 rounded-lg space-y-2"
             >
               {(() => {
                 const inv = inventarios.find(i => i.codigo === inventario2)
                 if (!inv) return null
                 return (
                   <>
                     <div className="flex items-center gap-2 text-sm text-gray-300">
                       <User className="h-4 w-4" />
                       <span>Responsável: {inv.responsavel}</span>
                     </div>
                     <div className="flex items-center gap-2 text-sm text-gray-300">
                       <Calendar className="h-4 w-4" />
                       <span>Criado em: {new Date(inv.data_criacao).toLocaleDateString()}</span>
                     </div>
                     <div className="grid grid-cols-2 gap-4 mt-3">
                       <div className="text-center">
                         <p className="text-lg font-bold text-blue-400">{inv.total_contagens}</p>
                         <p className="text-xs text-gray-400">Contagens</p>
                       </div>
                       <div className="text-center">
                         <p className="text-lg font-bold text-green-400">{inv.total_ativos}</p>
                         <p className="text-xs text-gray-400">Ativos</p>
                       </div>
                     </div>
                   </>
                 )
               })()}
             </motion.div>
           )}
         </CardContent>
       </Card>
     </div>

     {/* Opções de Comparação */}
     <Card className="bg-gray-900 border-gray-700">
       <CardHeader>
         <CardTitle className="flex items-center gap-2 text-gray-100">
           <Filter className="h-5 w-5 text-blue-400" />
           Opções de Comparação
         </CardTitle>
       </CardHeader>
       <CardContent className="space-y-6">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="space-y-4">
             <div>
               <Label htmlFor="tipo-comparacao" className="text-gray-300">Tipo de Comparação</Label>
               <Select value={tipoComparacao} onValueChange={setTipoComparacao}>
                 <SelectTrigger className="bg-gray-800 border-gray-600">
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent className="bg-gray-800 border-gray-600">
                   <SelectItem value="geral">Comparação Geral</SelectItem>
                   <SelectItem value="por_loja">Por Loja</SelectItem>
                   <SelectItem value="por_setor">Por Setor CD</SelectItem>
                   <SelectItem value="por_ativo">Por Ativo</SelectItem>
                 </SelectContent>
               </Select>
             </div>

             <div className="space-y-3">
               <div className="flex items-center space-x-2">
                 <Checkbox 
                   id="incluir-zerados" 
                   checked={incluirZerados}
                   onCheckedChange={(checked) => setIncluirZerados(checked as boolean)}
                 />
                 <Label htmlFor="incluir-zerados" className="text-gray-300">
                   Incluir quantidades zeradas
                 </Label>
               </div>
               
               <div className="flex items-center space-x-2">
                 <Checkbox 
                   id="apenas-divergencias" 
                   checked={apenasdivergencias}
                   onCheckedChange={(checked) => setApenasivergencias(checked as boolean)}
                 />
                 <Label htmlFor="apenas-divergencias" className="text-gray-300">
                   Mostrar apenas divergências
                 </Label>
               </div>
             </div>
           </div>

           <div className="space-y-4">
             <div>
               <Label htmlFor="filtro-ativos" className="text-gray-300">Filtrar Ativos (separados por vírgula)</Label>
               <Input
                 id="filtro-ativos"
                 placeholder="Ex: HB 623, HB 618"
                 value={filtroAtivos}
                 onChange={(e) => setFiltroAtivos(e.target.value)}
                 className="bg-gray-800 border-gray-600 text-gray-100"
               />
             </div>

             <div>
               <Label htmlFor="filtro-lojas" className="text-gray-300">Filtrar Lojas (separadas por vírgula)</Label>
               <Input
                 id="filtro-lojas"
                 placeholder="Ex: Loja A, Loja B"
                 value={filtroLojas}
                 onChange={(e) => setFiltroLojas(e.target.value)}
                 className="bg-gray-800 border-gray-600 text-gray-100"
               />
             </div>

             <div>
               <Label htmlFor="filtro-setores" className="text-gray-300">Filtrar Setores CD (separados por vírgula)</Label>
               <Input
                 id="filtro-setores"
                 placeholder="Ex: Setor A, Setor B"
                 value={filtroSetores}
                 onChange={(e) => setFiltroSetores(e.target.value)}
                 className="bg-gray-800 border-gray-600 text-gray-100"
               />
             </div>
           </div>
         </div>

         <div className="flex justify-end">
           <Button 
             onClick={handleComparar}
             disabled={!inventario1 || !inventario2}
             className="bg-blue-600 hover:bg-blue-700 text-white"
           >
             <BarChart3 className="h-4 w-4 mr-2" />
             Comparar Inventários
           </Button>
         </div>
       </CardContent>
     </Card>
   </div>
 )
}
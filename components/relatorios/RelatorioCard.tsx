// components/relatorios/RelatorioCard.tsx
"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Download, FileText, Clock, User, Trash2, Eye, AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Relatorio } from "@/types/relatorio"

interface RelatorioCardProps {
  relatorio: Relatorio
  onDownload: (id: string, nome: string) => void
  onDelete: (id: string) => void
  onProcessar: (id: string) => void
  onVisualize?: (relatorio: Relatorio) => void
}

const tipoLabels: Record<string, string> = {
  'inventario_completo': 'Inventário Completo',
  'contagens_por_loja': 'Contagens por Loja',
  'contagens_por_cd': 'Contagens por CD',
  'ativos_em_transito': 'Ativos em Trânsito',
  'comparativo_contagens': 'Comparativo',
  'divergencias': 'Divergências',
  'resumo_executivo': 'Resumo Executivo'
}

const formatoColors: Record<string, string> = {
  'json': 'bg-blue-100 text-blue-800',
  'csv': 'bg-green-100 text-green-800',
  'excel': 'bg-orange-100 text-orange-800',
  'pdf': 'bg-red-100 text-red-800'
}

export function RelatorioCard({ 
  relatorio, 
  onDownload, 
  onDelete, 
  onProcessar,
  onVisualize 
}: RelatorioCardProps) {
  
  const getStatusIcon = () => {
    switch (relatorio.status) {
      case 'processando':
        return <Loader2 className="h-4 w-4 animate-spin text-yellow-400" />
     case 'concluido':
       return <CheckCircle className="h-4 w-4 text-green-400" />
     case 'erro':
       return <AlertCircle className="h-4 w-4 text-red-400" />
     default:
       return <Clock className="h-4 w-4 text-gray-400" />
   }
 }

 const getStatusColor = () => {
   switch (relatorio.status) {
     case 'processando':
       return 'bg-yellow-900/20 text-yellow-300 border-yellow-700'
     case 'concluido':
       return 'bg-green-900/20 text-green-300 border-green-700'
     case 'erro':
       return 'bg-red-900/20 text-red-300 border-red-700'
     default:
       return 'bg-gray-900/20 text-gray-300 border-gray-700'
   }
 }

 const formatDate = (dateString: string) => {
   return new Date(dateString).toLocaleDateString('pt-BR', {
     day: '2-digit',
     month: '2-digit',
     year: 'numeric',
     hour: '2-digit',
     minute: '2-digit'
   })
 }

 const formatFileSize = (sizeKb?: number) => {
   if (!sizeKb) return 'N/A'
   if (sizeKb < 1024) return `${sizeKb} KB`
   return `${(sizeKb / 1024).toFixed(1)} MB`
 }

 const formatProcessingTime = (timeMs?: number) => {
   if (!timeMs) return 'N/A'
   if (timeMs < 1000) return `${timeMs}ms`
   return `${(timeMs / 1000).toFixed(1)}s`
 }

 return (
   <motion.div
     initial={{ opacity: 0, scale: 0.9 }}
     animate={{ opacity: 1, scale: 1 }}
     transition={{ delay: 0.1 }}
     whileHover={{ scale: 1.02 }}
   >
     <Card className="bg-gray-900 border-gray-700 hover:border-gray-600 transition-all duration-200">
       <CardHeader className="pb-3">
         <div className="flex items-start justify-between">
           <div className="flex-1">
             <CardTitle className="flex items-center gap-2 text-gray-100 text-lg">
               <FileText className="h-5 w-5 text-blue-400" />
               {relatorio.nome}
             </CardTitle>
             <div className="flex items-center gap-2 mt-2">
               <Badge variant="secondary" className="bg-gray-700 text-gray-300">
                 {tipoLabels[relatorio.tipo] || relatorio.tipo}
               </Badge>
               <Badge className={formatoColors[relatorio.formato] || 'bg-gray-700 text-gray-300'}>
                 {relatorio.formato.toUpperCase()}
               </Badge>
             </div>
           </div>
           
           <Badge className={`${getStatusColor()} flex items-center gap-1`}>
             {getStatusIcon()}
             {relatorio.status.charAt(0).toUpperCase() + relatorio.status.slice(1)}
           </Badge>
         </div>
       </CardHeader>

       <CardContent className="space-y-4">
         {/* Informações do Relatório */}
         <div className="grid grid-cols-2 gap-4 text-sm">
           <div className="space-y-2">
             <div className="flex justify-between">
               <span className="text-gray-400">Registros:</span>
               <span className="text-gray-100 font-medium">
                 {relatorio.total_registros.toLocaleString()}
               </span>
             </div>
             
             <div className="flex justify-between">
               <span className="text-gray-400">Criado em:</span>
               <span className="text-gray-100">
                 {formatDate(relatorio.created_at)}
               </span>
             </div>

             <div className="flex justify-between">
               <span className="text-gray-400">Usuário:</span>
               <span className="text-gray-100 flex items-center gap-1">
                 <User className="h-3 w-3" />
                 {relatorio.usuario_criacao}
               </span>
             </div>
           </div>

           <div className="space-y-2">
             {relatorio.data_conclusao && (
               <div className="flex justify-between">
                 <span className="text-gray-400">Concluído:</span>
                 <span className="text-gray-100">
                   {formatDate(relatorio.data_conclusao)}
                 </span>
               </div>
             )}

             {relatorio.tempo_processamento_ms && (
               <div className="flex justify-between">
                 <span className="text-gray-400">Tempo:</span>
                 <span className="text-gray-100">
                   {formatProcessingTime(relatorio.tempo_processamento_ms)}
                 </span>
               </div>
             )}

             {relatorio.tamanho_arquivo_kb && (
               <div className="flex justify-between">
                 <span className="text-gray-400">Tamanho:</span>
                 <span className="text-gray-100">
                   {formatFileSize(relatorio.tamanho_arquivo_kb)}
                 </span>
               </div>
             )}
           </div>
         </div>

         {/* Observações */}
         {relatorio.observacoes && (
           <div className="bg-gray-800 p-3 rounded-md">
             <span className="text-gray-400 text-sm">Observações:</span>
             <p className="text-gray-300 text-sm mt-1">{relatorio.observacoes}</p>
           </div>
         )}

         {/* Actions */}
         <div className="flex items-center justify-between pt-2 border-t border-gray-700">
           <div className="flex gap-2">
             {relatorio.status === 'concluido' && (
               <>
                 <Button
                   size="sm"
                   onClick={() => onDownload(relatorio.id, `${relatorio.nome}.${relatorio.formato}`)}
                   className="bg-green-600 hover:bg-green-700 text-white"
                 >
                   <Download className="h-4 w-4 mr-1" />
                   Download
                 </Button>
                 
                 {onVisualize && relatorio.formato === 'json' && (
                   <Button
                     size="sm"
                     variant="outline"
                     onClick={() => onVisualize(relatorio)}
                     className="border-gray-600 text-gray-300 hover:bg-gray-800"
                   >
                     <Eye className="h-4 w-4 mr-1" />
                     Visualizar
                   </Button>
                 )}
               </>
             )}

             {relatorio.status === 'erro' && (
               <Button
                 size="sm"
                 onClick={() => onProcessar(relatorio.id)}
                 className="bg-yellow-600 hover:bg-yellow-700 text-white"
               >
                 <Clock className="h-4 w-4 mr-1" />
                 Reprocessar
               </Button>
             )}
           </div>

           <Button
             size="sm"
             variant="ghost"
             onClick={() => onDelete(relatorio.id)}
             className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
           >
             <Trash2 className="h-4 w-4" />
           </Button>
         </div>
       </CardContent>
     </Card>
   </motion.div>
 )
}
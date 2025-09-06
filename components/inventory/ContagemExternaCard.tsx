// components/inventory/ContagemExternaCard.tsx
"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Warehouse, Users, Eye, AlertTriangle, CheckCircle, FileUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SetorContagens } from "@/types/contagem-externa"

interface ContagemExternaCardProps {
  setorData: SetorContagens
  onClick: () => void
}

export function ContagemExternaCard({ setorData, onClick }: ContagemExternaCardProps) {
  const temDivergencias = setorData.comparacao?.some(c => c.divergencias) || false
  const algumaLancada = setorData.contagens.some(c => c.status === 'lançada')
  
  const getStatusColor = () => {
    if (setorData.totalContagens === 0) return "bg-gray-700 text-gray-300"
    if (algumaLancada) return "bg-green-900 text-green-300 border-green-700"
    if (setorData.totalContagens > 1 && temDivergencias) return "bg-red-900 text-red-300 border-red-700"
    if (setorData.totalContagens >= 1) return "bg-yellow-900 text-yellow-300 border-yellow-700"
    return "bg-gray-700 text-gray-300"
  }

  const getStatusText = () => {
    if (algumaLancada) return "Lançada"
    if (setorData.totalContagens === 0) return "Sem contagens"
    if (setorData.totalContagens > 1 && temDivergencias) return "Com divergências"
    return "Pendente"
  }

  const getStatusIcon = () => {
    if (algumaLancada) return <FileUp className="h-4 w-4" />
    if (setorData.totalContagens === 0) return <Warehouse className="h-4 w-4" />
    if (setorData.totalContagens > 1 && temDivergencias) return <AlertTriangle className="h-4 w-4" />
    return <Users className="h-4 w-4" />
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02, boxShadow: "0 8px 32px 0 rgba(0,0,0,0.25)" }}
      className="cursor-pointer"
    >
      <Card 
        className="bg-gray-900 border-gray-700 hover:border-gray-600 transition-all duration-200"
        onClick={onClick}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Warehouse className="h-5 w-5 text-blue-400" />
            <Badge className={getStatusColor()}>
              {getStatusIcon()}
              <span className="ml-1">{getStatusText()}</span>
            </Badge>
          </div>
          <CardTitle className="text-gray-100 text-base">{setorData.setor}</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Contagens:</p>
              <p className="text-gray-100 font-semibold">{setorData.totalContagens}/5</p>
            </div>
            <div>
              <p className="text-gray-400">Status:</p>
              <p className={`font-semibold ${
                algumaLancada ? 'text-green-400' :
                temDivergencias ? 'text-red-400' : 
                setorData.totalContagens > 1 ? 'text-green-400' : 'text-yellow-400'
              }`}>
                {algumaLancada ? 'Lançada' : 
                 setorData.totalContagens > 1 
                  ? (temDivergencias ? 'Divergente' : 'Consistente')
                  : 'Pendente'
                }
              </p>
            </div>
          </div>

          {setorData.contagens.length > 0 && (
            <div className="pt-2 border-t border-gray-700">
              <p className="text-xs text-gray-400 mb-2">Últimos contadores:</p>
              <div className="flex flex-wrap gap-1">
                {setorData.contagens.slice(-3).map((contagem, index) => (
                  <Badge 
                    key={index}
                    variant="secondary" 
                    className={`text-xs ${contagem.status === 'lançada' ? 'bg-green-800 text-green-200' : 'bg-gray-700 text-gray-300'}`}
                  >
                    {contagem.contador}
                  </Badge>
                ))}
                {setorData.contagens.length > 3 && (
                  <Badge variant="secondary" className="bg-gray-700 text-gray-300 text-xs">
                    +{setorData.contagens.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}

          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
          >
            <Eye className="h-4 w-4 mr-2" />
            Ver Detalhes
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}
// components/dashboard/LojasPendentesModal.tsx
"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Store, AlertCircle, User } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LojasPendentesPorResponsavel } from "@/types/dashboard"

interface LojasPendentesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lojasPendentes: LojasPendentesPorResponsavel[]
  totalPendentes: number
}

export function LojasPendentesModal({ 
  open, 
  onOpenChange, 
  lojasPendentes, 
  totalPendentes 
}: LojasPendentesModalProps) {
  
  if (lojasPendentes.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-gray-900 border-gray-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-gray-100 flex items-center gap-2">
              <Store className="h-5 w-5 text-green-400" />
              Lojas Pendentes
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Status das contagens por responsável
            </DialogDescription>
          </DialogHeader>
          
          <div className="text-center py-8">
            <Store className="h-16 w-16 text-green-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-100 mb-2">
              Todas as lojas foram contadas!
            </h3>
            <p className="text-gray-400">
              Parabéns! Não há lojas pendentes de contagem.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-gray-700 max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-gray-100 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-400" />
            Lojas Pendentes
            <Badge className="bg-orange-900 text-orange-300 border-orange-700 ml-2">
              {totalPendentes} pendentes
            </Badge>
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Lista de lojas que ainda precisam ser contadas, organizadas por responsável
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue={lojasPendentes[0]?.responsavel} className="w-full">
          <TabsList className="grid w-full bg-gray-800" style={{ gridTemplateColumns: `repeat(${lojasPendentes.length}, 1fr)` }}>
            {lojasPendentes.map((item) => (
              <TabsTrigger 
                key={item.responsavel} 
                value={item.responsavel}
                className="data-[state=active]:bg-gray-700 text-xs sm:text-sm"
              >
                <div className="flex flex-col items-center gap-1">
                  <User className="h-4 w-4" />
                  <span className="truncate max-w-20">{item.responsavel}</span>
                  <Badge variant="secondary" className="bg-orange-900 text-orange-300 text-xs">
                    {item.totalPendentes}
                  </Badge>
                </div>
              </TabsTrigger>
            ))}
          </TabsList>

          {lojasPendentes.map((item, index) => (
            <TabsContent key={item.responsavel} value={item.responsavel} className="mt-4">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-blue-400" />
                      {item.responsavel}
                    </div>
                    <Badge className="bg-orange-900 text-orange-300 border-orange-700">
                      {item.totalPendentes} pendentes
                    </Badge>
                  </CardTitle>
                </CardHeader>
                
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {item.lojasPendentes.map((loja, lojaIndex) => (
                      <motion.div
                        key={loja}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: lojaIndex * 0.05 }}
                        className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg border border-gray-600"
                      >
                        <Store className="h-4 w-4 text-orange-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-100 truncate">{loja}</p>
                          <p className="text-xs text-gray-400">Aguardando contagem</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  
                  {item.lojasPendentes.length === 0 && (
                    <div className="text-center py-6">
                      <Store className="h-8 w-8 text-green-400 mx-auto mb-2" />
                      <p className="text-gray-400">Todas as lojas foram contadas!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
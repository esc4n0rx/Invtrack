// components/inventory/ContagemExternaModal.tsx
"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { X, Package, User, Calendar, AlertTriangle, CheckCircle, FileCheck, FileUp } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SetorContagens, ContagemExterna } from "@/types/contagem-externa"
import { ContagemsComparison } from "./ContagemsComparison"
import { toast } from "sonner"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ContagemExternaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  setorData: SetorContagens | null
  onAprovar: (id: string, responsavel: string) => Promise<{ success: boolean; error?: string }>
}

export function ContagemExternaModal({ 
  open, 
  onOpenChange, 
  setorData, 
  onAprovar 
}: ContagemExternaModalProps) {
  const [contagemSelecionada, setContagemSelecionada] = React.useState<ContagemExterna | null>(null)
  const [responsavelAprovacao, setResponsavelAprovacao] = React.useState('')
  const [loadingAprovacao, setLoadingAprovacao] = React.useState(false)

  const handleAprovar = async () => {
    if (!contagemSelecionada || contagemSelecionada.status === 'lançada') return
    
    if (!responsavelAprovacao.trim()) {
      toast.error('Informe o nome do responsável pela aprovação')
      return
    }

    setLoadingAprovacao(true)
    try {
      const resultado = await onAprovar(contagemSelecionada.id, responsavelAprovacao.trim())
      
      if (resultado.success) {
        toast.success('Contagem aprovada e registrada com sucesso!')
        onOpenChange(false)
        setContagemSelecionada(null)
        setResponsavelAprovacao('')
      } else {
        toast.error(resultado.error || 'Erro ao aprovar contagem')
      }
    } catch (error) {
      toast.error('Erro inesperado ao aprovar contagem')
    } finally {
      setLoadingAprovacao(false)
    }
  }

  const resetModal = () => {
    setContagemSelecionada(null)
    setResponsavelAprovacao('')
  }

  React.useEffect(() => {
    if (!open) {
      resetModal()
    } else if (setorData && setorData.contagens.length > 0) {
      // Seleciona a primeira contagem pendente, ou a primeira se todas estiverem lançadas
      const pendente = setorData.contagens.find(c => c.status === 'pendente')
      setContagemSelecionada(pendente || setorData.contagens[0])
    }
  }, [open, setorData])

  if (!setorData) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-gray-700 max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-gray-100 flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-400" />
            Contagens - {setorData.setor}
            <Badge className="bg-blue-900 text-blue-300 border-blue-700 ml-2">
              {setorData.totalContagens} contagens
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="contagens" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800">
            <TabsTrigger value="contagens" className="data-[state=active]:bg-gray-700">
              Lista de Contagens
            </TabsTrigger>
            <TabsTrigger 
              value="comparacao" 
              className="data-[state=active]:bg-gray-700"
              disabled={!setorData.comparacao || setorData.comparacao.length === 0}
            >
              Comparação
              {setorData.comparacao?.some(c => c.divergencias) && (
                <AlertTriangle className="h-4 w-4 ml-2 text-orange-400" />
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="contagens" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Lista de Contagens */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-100">Contagens Registradas</h3>
                {setorData.contagens.map((contagem, index) => (
                  <motion.div
                    key={contagem.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card 
                      className={`bg-gray-800 border-gray-700 cursor-pointer transition-all duration-200 ${
                        contagemSelecionada?.id === contagem.id 
                          ? 'border-blue-600 bg-blue-900/20' 
                          : 'hover:border-gray-600'
                      }`}
                      onClick={() => setContagemSelecionada(contagem)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-blue-400" />
                            <span className="font-medium text-gray-100">{contagem.contador}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {contagem.status === 'lançada' && (
                                <Badge className="bg-green-900 text-green-300 border-green-700">
                                    <FileUp className="h-3 w-3 mr-1" />
                                    Lançada
                                </Badge>
                            )}
                            <Badge className="bg-gray-700 text-gray-300">
                                #{contagem.numero_contagem}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Calendar className="h-4 w-4" />
                          {new Date(contagem.data_contagem).toLocaleString('pt-BR')}
                        </div>
                        
                        <div className="text-sm">
                          <p className="text-gray-400">Itens contados:</p>
                          <p className="text-gray-100 font-medium">{contagem.itens.length} ativos</p>
                        </div>

                        {contagem.obs && (
                          <div className="text-sm">
                            <p className="text-gray-400">Observações:</p>
                            <p className="text-gray-300">{contagem.obs}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Detalhes da Contagem Selecionada */}
              <div className="space-y-4">
                {contagemSelecionada ? (
                  <>
                    <h3 className="text-lg font-semibold text-gray-100">
                      Detalhes - Contagem #{contagemSelecionada.numero_contagem}
                    </h3>
                    
                    <Card className="bg-gray-800 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-gray-100 flex items-center gap-2">
                          <Package className="h-4 w-4 text-blue-400" />
                          Itens Contados
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow className="border-gray-700">
                              <TableHead className="text-gray-300">Ativo</TableHead>
                              <TableHead className="text-gray-300 text-right">Quantidade</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {contagemSelecionada.itens.map((item, index) => (
                              <TableRow key={index} className="border-gray-700">
                                <TableCell className="text-gray-100">{item.ativo}</TableCell>
                                <TableCell className="text-gray-100 text-right font-semibold">
                                  {item.quantidade}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>

                    {/* Aprovação */}
                    <Card className="bg-gray-800 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-gray-100 flex items-center gap-2">
                          <FileCheck className="h-4 w-4 text-green-400" />
                          Aprovar Contagem
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {contagemSelecionada.status === 'lançada' ? (
                          <Alert className="bg-green-900/20 border-green-700">
                            <CheckCircle className="h-4 w-4 text-green-400" />
                            <AlertDescription className="text-green-300">
                              Esta contagem já foi lançada e registrada no sistema.
                            </AlertDescription>
                          </Alert>
                        ) : (
                          <>
                            <div className="space-y-2">
                              <Label className="text-gray-300">Nome do Responsável pela Aprovação</Label>
                              <Input
                                value={responsavelAprovacao}
                                onChange={(e) => setResponsavelAprovacao(e.target.value)}
                                placeholder="Digite seu nome"
                                className="bg-gray-700 border-gray-600 text-gray-100"
                              />
                            </div>
                            
                            <Button
                              onClick={handleAprovar}
                              disabled={loadingAprovacao || !responsavelAprovacao.trim()}
                              className="w-full bg-green-600 hover:bg-green-700"
                            >
                              {loadingAprovacao ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  Aprovando...
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Aprovar e Registrar
                                </>
                              )}
                            </Button>
                            
                            <p className="text-xs text-gray-400">
                              Esta ação irá registrar a contagem na tabela principal e não pode ser desfeita.
                            </p>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">Selecione uma contagem para ver os detalhes</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="comparacao">
            {setorData.comparacao && (
              <ContagemsComparison comparacao={setorData.comparacao} />
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
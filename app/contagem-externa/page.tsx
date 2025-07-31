"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Package, Plus, X, CheckCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { setoresCD } from "@/data/setores"
import { ativos } from "@/data/ativos"
import { criarContagemExterna } from "@/lib/api/contagens-externas"
import { CreateContagemExternaRequest } from "@/types/contagem-externa"
import { toast } from "sonner"

interface ItemContagem {
  ativo: string
  quantidade: number
}

export default function ContagemExternaPage() {
  const [setor, setSetor] = React.useState('')
  const [contador, setContador] = React.useState('')
  const [obs, setObs] = React.useState('')
  const [itens, setItens] = React.useState<ItemContagem[]>([])
  const [ativoSelecionado, setAtivoSelecionado] = React.useState('')
  const [quantidade, setQuantidade] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [sucesso, setSucesso] = React.useState(false)

  const adicionarItem = () => {
    if (!ativoSelecionado || !quantidade || parseInt(quantidade) < 0) {
      toast.error('Selecione um ativo e informe uma quantidade válida')
      return
    }

    const jaExiste = itens.some(item => item.ativo === ativoSelecionado)
    if (jaExiste) {
      toast.error('Este ativo já foi adicionado à lista')
      return
    }

    const novoItem: ItemContagem = {
      ativo: ativoSelecionado,
      quantidade: parseInt(quantidade)
    }

    setItens([...itens, novoItem])
    setAtivoSelecionado('')
    setQuantidade('')
  }

  const removerItem = (index: number) => {
    setItens(itens.filter((_, i) => i !== index))
  }

  const editarQuantidade = (index: number, novaQuantidade: string) => {
    const quantidade = parseInt(novaQuantidade)
    if (quantidade >= 0) {
      const novosItens = [...itens]
      novosItens[index].quantidade = quantidade
      setItens(novosItens)
    }
  }

  const handleSubmit = async () => {
    if (!setor) {
      toast.error('Selecione um setor')
      return
    }

    if (!contador.trim()) {
      toast.error('Informe seu nome')
      return
    }

    if (itens.length === 0) {
      toast.error('Adicione pelo menos um ativo')
      return
    }

    setLoading(true)
    
    try {
      const dados: CreateContagemExternaRequest = {
        setor_cd: setor,
        contador: contador.trim(),
        obs: obs.trim() || undefined,
        itens: itens
      }

      const resultado = await criarContagemExterna(dados)
      
      if (resultado.success) {
        setSucesso(true)
        toast.success('Contagem registrada com sucesso!')
        
        setTimeout(() => {
          setSetor('')
          setContador('')
          setObs('')
          setItens([])
          setSucesso(false)
        }, 3000)
      } else {
        toast.error(resultado.error || 'Erro ao registrar contagem')
      }
    } catch (error) {
      toast.error('Erro inesperado ao registrar contagem')
    } finally {
      setLoading(false)
    }
  }

  if (sucesso) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Contagem Registrada!
          </h1>
          <p className="text-muted-foreground">
            Sua contagem foi registrada com sucesso e está aguardando análise.
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <Package className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground">
            Contagem de Inventário
          </h1>
          <p className="text-muted-foreground mt-2">
            Registre a contagem dos ativos do setor selecionado
          </p>
        </motion.div>

        {/* Formulário */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Dados da Contagem</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Setor */}
              <div className="space-y-2">
                <Label>Setor do CD</Label>
                <Select value={setor} onValueChange={setSetor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um setor" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {setoresCD.map((setorOption) => (
                      <SelectItem key={setorOption} value={setorOption}>
                        {setorOption}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Contador */}
              <div className="space-y-2">
                <Label>Seu Nome</Label>
                <Input
                  value={contador}
                  onChange={(e) => setContador(e.target.value)}
                  placeholder="Digite seu nome completo"
                />
              </div>

              {/* Adicionar Ativos */}
              <div className="space-y-4">
                <Label>Adicionar Ativos</Label>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Ativo</Label>
                    <Select value={ativoSelecionado} onValueChange={setAtivoSelecionado}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um ativo" />
                      </SelectTrigger>
                      <SelectContent>
                        {ativos
                          .filter(ativo => !itens.some(item => item.ativo === ativo.nome))
                          .map((ativo) => (
                            <SelectItem key={ativo.id} value={ativo.nome}>
                              {ativo.nome}
                            </SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                    </div>
                  
                  <div className="space-y-2">
                    <Label>Quantidade</Label>
                    <Input
                      type="number"
                      min="0"
                      value={quantidade}
                      onChange={(e) => setQuantidade(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <Button
                      onClick={adicionarItem}
                      className="w-full"
                      disabled={!ativoSelecionado || !quantidade}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar
                    </Button>
                  </div>
                </div>

                {/* Lista de itens */}
                {itens.length > 0 && (
                  <div className="space-y-3">
                    <Label>Ativos Adicionados:</Label>
                    <div className="space-y-2">
                      {itens.map((item, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center gap-3 p-3 bg-muted rounded-lg border"
                        >
                          <Package className="h-4 w-4 text-primary flex-shrink-0" />
                          <div className="flex-1">
                            <span className="text-foreground font-medium">{item.ativo}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="0"
                              value={item.quantidade}
                              onChange={(e) => editarQuantidade(index, e.target.value)}
                              className="w-20 text-center"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removerItem(index)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Observações */}
              <div className="space-y-2">
                <Label>Observações (opcional)</Label>
                <Textarea
                  value={obs}
                  onChange={(e) => setObs(e.target.value)}
                  placeholder="Observações sobre a contagem..."
                  rows={3}
                />
              </div>

              {/* Botão de envio */}
              <div className="pt-4">
                <Button
                  onClick={handleSubmit}
                  disabled={loading || !setor || !contador.trim() || itens.length === 0}
                  className="w-full bg-green-600 hover:bg-green-700 h-12 text-base text-white"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground mr-3"></div>
                      Registrando Contagem...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 mr-3" />
                      Registrar Contagem
                    </>
                  )}
                </Button>
              </div>

              {/* Aviso */}
              <Alert>
                <Package className="h-4 w-4 text-primary" />
                <AlertDescription>
                  <strong>Importante:</strong> Verifique cuidadosamente as quantidades antes de enviar. 
                  Cada pessoa pode realizar apenas uma contagem por setor.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
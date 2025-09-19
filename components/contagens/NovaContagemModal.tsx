// components/contagens/NovaContagemModal.tsx
"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { CreateContagemRequest } from "@/types/contagem"
import { ativos } from "@/data/ativos"
import { setoresCD } from "@/data/setores"
import { cds } from "@/data/cds"
import { fornecedores } from "@/data/fornecedores"
import { toast } from "sonner"
import { useLojasRegionais } from "@/hooks/useLojasRegionais"

interface NovaContagemModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (dados: CreateContagemRequest) => Promise<{ success: boolean; error?: string }>
}

interface ContagemItem {
  ativo: string
  quantidade: number
}

export function NovaContagemModal({ open, onOpenChange, onSubmit }: NovaContagemModalProps) {
  const [tipo, setTipo] = React.useState<'loja' | 'cd' | 'fornecedor' | 'transito'>('loja')
  const [local, setLocal] = React.useState('')
  const [cdOrigem, setCdOrigem] = React.useState('')
  const [cdDestino, setCdDestino] = React.useState('')
  const [responsavel, setResponsavel] = React.useState('')
  const [obs, setObs] = React.useState('')
  const [contagens, setContagens] = React.useState<ContagemItem[]>([])
  const [ativoSelecionado, setAtivoSelecionado] = React.useState('')
  const [quantidade, setQuantidade] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const { lojas: lojasRegionais, loading: carregandoLojas, error: erroLojas } = useLojasRegionais()

  const resetForm = () => {
    setTipo('loja')
    setLocal('')
    setCdOrigem('')
    setCdDestino('')
    setResponsavel('')
    setObs('')
    setContagens([])
    setAtivoSelecionado('')
    setQuantidade('')
  }

  const adicionarContagem = () => {
    if (!ativoSelecionado || !quantidade || parseInt(quantidade) < 0) {
      toast.error('Selecione um ativo e informe uma quantidade válida')
      return
    }

    const novaContagem: ContagemItem = {
      ativo: ativoSelecionado,
      quantidade: parseInt(quantidade)
    }

    // Verificar se já existe esta contagem
    const jaExiste = contagens.some(c => c.ativo === novaContagem.ativo)
    if (jaExiste) {
      toast.error('Este ativo já foi adicionado à lista')
      return
    }

    setContagens([...contagens, novaContagem])
    setAtivoSelecionado('')
    setQuantidade('')
  }

  const removerContagem = (index: number) => {
    const novasContagens = contagens.filter((_, i) => i !== index)
    setContagens(novasContagens)
  }

  const handleSubmit = async () => {
    if (contagens.length === 0) {
      toast.error('Adicione pelo menos uma contagem')
      return
    }

    if (!responsavel.trim()) {
      toast.error('Informe o responsável pela contagem')
      return
    }

    // Validar campos específicos por tipo
    if (tipo === 'loja' && !local) {
      toast.error('Selecione uma loja')
      return
    }
    if (tipo === 'cd' && !local) {
      toast.error('Selecione um setor do CD')
      return
    }
    if (tipo === 'transito' && (!cdOrigem || !cdDestino)) {
      toast.error('Selecione CD de origem e destino')
      return
    }
    if (tipo === 'transito' && cdOrigem === cdDestino) {
      toast.error('CD de origem e destino devem ser diferentes')
      return
    }
    if (tipo === 'fornecedor' && !local) {
      toast.error('Selecione um fornecedor')
      return
    }

    setLoading(true)
    
    try {
      // Criar uma contagem para cada ativo
      for (const contagem of contagens) {
        const dados: CreateContagemRequest = {
          tipo,
          ativo: contagem.ativo,
          quantidade: contagem.quantidade,
          responsavel: responsavel.trim(),
          obs: obs.trim() || undefined,
        }

        // Adicionar campos específicos por tipo
        if (tipo === 'loja') {
          dados.loja = local
        } else if (tipo === 'cd') {
          dados.setor_cd = local
        } else if (tipo === 'transito') {
          dados.cd_origem = cdOrigem
          dados.cd_destino = cdDestino
        } else if (tipo === 'fornecedor') {
          dados.fornecedor = local
        }

        const resultado = await onSubmit(dados)
        if (!resultado.success) {
          toast.error(`Erro ao salvar contagem do ativo ${contagem.ativo}: ${resultado.error}`)
          return
        }
      }

      toast.success(`${contagens.length} contagem(ns) salva(s) com sucesso!`)
      resetForm()
      onOpenChange(false)
    } catch (error) {
      toast.error('Erro inesperado ao salvar contagens')
    } finally {
      setLoading(false)
    }
  }

  const opcoesLocal = React.useMemo(() => {
    switch (tipo) {
      case 'loja':
        return lojasRegionais.map(loja => ({
          value: loja.nome,
          label: loja.nome,
          responsavel: loja.responsavel
        }))
      case 'cd':
        return setoresCD.map(setor => ({ value: setor, label: setor, responsavel: undefined }))
      case 'fornecedor':
        return fornecedores.map(forn => ({ value: forn, label: forn, responsavel: undefined }))
      default:
        return []
    }
  }, [tipo, lojasRegionais])

  React.useEffect(() => {
    if (!open) {
      resetForm()
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-gray-700 max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-gray-100">Nova Contagem</DialogTitle>
          <DialogDescription className="text-gray-400">
            Adicione múltiplas contagens de ativos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tipo de Contagem */}
          <div className="space-y-2">
            <Label className="text-gray-300">Tipo de Contagem</Label>
            <Select value={tipo} onValueChange={(value: any) => {
              setTipo(value)
              setLocal('')
              setCdOrigem('')
              setCdDestino('')
            }}>
             <SelectTrigger className="bg-gray-800 border-gray-600 text-gray-100">
               <SelectValue placeholder="Selecione o tipo" />
             </SelectTrigger>
             <SelectContent className="bg-gray-800 border-gray-600">
               <SelectItem value="loja">Loja</SelectItem>
               <SelectItem value="cd">Centro de Distribuição</SelectItem>
               <SelectItem value="transito">Trânsito</SelectItem>
               <SelectItem value="fornecedor">Fornecedor</SelectItem>
             </SelectContent>
           </Select>
         </div>

         {/* Campos específicos por tipo */}
         {tipo === 'loja' && (
           <div className="space-y-2">
             <Label className="text-gray-300">Loja</Label>
             <Select value={local} onValueChange={setLocal} disabled={carregandoLojas || !!erroLojas || opcoesLocal.length === 0}>
               <SelectTrigger className="bg-gray-800 border-gray-600 text-gray-100" disabled={carregandoLojas || !!erroLojas || opcoesLocal.length === 0}>
                 <SelectValue placeholder={carregandoLojas ? "Carregando lojas..." : erroLojas ? "Erro ao carregar" : "Selecione uma loja"} />
               </SelectTrigger>
               <SelectContent className="bg-gray-800 border-gray-600 max-h-60">
                 {carregandoLojas ? (
                   <div className="px-2 py-1 text-sm text-gray-300">Carregando lojas...</div>
                 ) : erroLojas ? (
                   <div className="px-2 py-1 text-sm text-red-300">{erroLojas}</div>
                 ) : opcoesLocal.length === 0 ? (
                   <div className="px-2 py-1 text-sm text-gray-300">Nenhuma loja cadastrada.</div>
                 ) : (
                   opcoesLocal.map((opcao) => (
                     <SelectItem key={opcao.value} value={opcao.value}>
                       <div className="flex flex-col">
                         <span>{opcao.label}</span>
                         {opcao.responsavel && (
                           <span className="text-xs text-gray-400">Resp: {opcao.responsavel}</span>
                         )}
                       </div>
                     </SelectItem>
                   ))
                 )}
               </SelectContent>
             </Select>
             {erroLojas && (
               <p className="text-xs text-red-300">Não foi possível carregar as lojas. Tente novamente mais tarde.</p>
             )}
           </div>
         )}

         {tipo === 'cd' && (
           <div className="space-y-2">
             <Label className="text-gray-300">Setor do CD</Label>
             <Select value={local} onValueChange={setLocal}>
               <SelectTrigger className="bg-gray-800 border-gray-600 text-gray-100">
                 <SelectValue placeholder="Selecione um setor" />
               </SelectTrigger>
               <SelectContent className="bg-gray-800 border-gray-600 max-h-60">
                {opcoesLocal.map((opcao) => (
                   <SelectItem key={opcao.value} value={opcao.value}>
                     {opcao.label}
                   </SelectItem>
                 ))}
               </SelectContent>
             </Select>
           </div>
         )}

         {tipo === 'transito' && (
           <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
               <Label className="text-gray-300">CD de Origem</Label>
               <Select value={cdOrigem} onValueChange={setCdOrigem}>
                 <SelectTrigger className="bg-gray-800 border-gray-600 text-gray-100">
                   <SelectValue placeholder="CD de origem" />
                 </SelectTrigger>
                 <SelectContent className="bg-gray-800 border-gray-600">
                   {cds.map((cd) => (
                     <SelectItem key={cd} value={cd}>{cd}</SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
             <div className="space-y-2">
               <Label className="text-gray-300">CD de Destino</Label>
               <Select value={cdDestino} onValueChange={setCdDestino}>
                 <SelectTrigger className="bg-gray-800 border-gray-600 text-gray-100">
                   <SelectValue placeholder="CD de destino" />
                 </SelectTrigger>
                 <SelectContent className="bg-gray-800 border-gray-600">
                   {cds.filter(cd => cd !== cdOrigem).map((cd) => (
                     <SelectItem key={cd} value={cd}>{cd}</SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
           </div>
         )}

         {tipo === 'fornecedor' && (
           <div className="space-y-2">
             <Label className="text-gray-300">Fornecedor</Label>
             <Select value={local} onValueChange={setLocal}>
               <SelectTrigger className="bg-gray-800 border-gray-600 text-gray-100">
                 <SelectValue placeholder="Selecione um fornecedor" />
               </SelectTrigger>
               <SelectContent className="bg-gray-800 border-gray-600">
                {opcoesLocal.map((opcao) => (
                   <SelectItem key={opcao.value} value={opcao.value}>
                     {opcao.label}
                   </SelectItem>
                 ))}
               </SelectContent>
             </Select>
           </div>
         )}

         {/* Adicionar Ativos */}
         <Card className="bg-gray-800 border-gray-700">
           <CardContent className="p-4 space-y-4">
             <h3 className="text-lg font-semibold text-gray-100">Adicionar Ativos</h3>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div className="space-y-2">
                 <Label className="text-gray-300">Ativo</Label>
                 <Select value={ativoSelecionado} onValueChange={setAtivoSelecionado}>
                   <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-100">
                     <SelectValue placeholder="Selecione um ativo" />
                   </SelectTrigger>
                   <SelectContent className="bg-gray-800 border-gray-600">
                     {ativos.map((ativo) => (
                       <SelectItem key={ativo.id} value={ativo.nome}>
                         {ativo.nome}
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
               
               <div className="space-y-2">
                 <Label className="text-gray-300">Quantidade</Label>
                 <Input
                   type="number"
                   min="0"
                   value={quantidade}
                   onChange={(e) => setQuantidade(e.target.value)}
                   placeholder="0"
                   className="bg-gray-700 border-gray-600 text-gray-100"
                 />
               </div>
               
               <div className="flex items-end">
                 <Button
                   onClick={adicionarContagem}
                   className="w-full bg-blue-600 hover:bg-blue-700"
                   disabled={!ativoSelecionado || !quantidade}
                 >
                   <Plus className="h-4 w-4 mr-2" />
                   Adicionar
                 </Button>
               </div>
             </div>

             {/* Lista de contagens adicionadas */}
             {contagens.length > 0 && (
               <div className="space-y-2">
                 <Label className="text-gray-300">Contagens Adicionadas:</Label>
                 <div className="flex flex-wrap gap-2">
                   {contagens.map((contagem, index) => (
                     <motion.div
                       key={index}
                       initial={{ opacity: 0, scale: 0.8 }}
                       animate={{ opacity: 1, scale: 1 }}
                       exit={{ opacity: 0, scale: 0.8 }}
                     >
                       <Badge
                         variant="secondary"
                         className="bg-blue-900 text-blue-100 border-blue-700 px-3 py-1"
                       >
                         {contagem.ativo}: {contagem.quantidade}
                         <Button
                           variant="ghost"
                           size="sm"
                           onClick={() => removerContagem(index)}
                           className="ml-2 h-4 w-4 p-0 hover:bg-red-600"
                         >
                           <X className="h-3 w-3" />
                         </Button>
                       </Badge>
                     </motion.div>
                   ))}
                 </div>
               </div>
             )}
           </CardContent>
         </Card>

         {/* Responsável */}
         <div className="space-y-2">
           <Label className="text-gray-300">Responsável</Label>
           <Input
             value={responsavel}
             onChange={(e) => setResponsavel(e.target.value)}
             placeholder="Nome do responsável pela contagem"
             className="bg-gray-800 border-gray-600 text-gray-100"
           />
         </div>

         {/* Observações */}
         <div className="space-y-2">
           <Label className="text-gray-300">Observações (opcional)</Label>
           <Textarea
             value={obs}
             onChange={(e) => setObs(e.target.value)}
             placeholder="Observações sobre a contagem..."
             className="bg-gray-800 border-gray-600 text-gray-100"
             rows={3}
           />
         </div>

         {/* Botões */}
         <div className="flex justify-end gap-3">
           <Button
             variant="outline"
             onClick={() => onOpenChange(false)}
             disabled={loading}
             className="border-gray-600 text-gray-300 hover:bg-gray-800"
           >
             Cancelar
           </Button>
           <Button
             onClick={handleSubmit}
             disabled={loading || contagens.length === 0}
             className="bg-blue-600 hover:bg-blue-700"
           >
             {loading ? (
               <>
                 <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                 Salvando...
               </>
             ) : (
               <>
                 <Plus className="h-4 w-4 mr-2" />
                 Salvar Contagens
               </>
             )}
           </Button>
         </div>
       </div>
     </DialogContent>
   </Dialog>
 )
}
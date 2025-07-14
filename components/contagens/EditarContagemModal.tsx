// components/contagens/EditarContagemModal.tsx
"use client"

import * as React from "react"
import { Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Contagem, EditContagemRequest, DeleteContagemRequest } from "@/types/contagem"
import { toast } from "sonner"

interface EditarContagemModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contagem: Contagem | null
  onEdit: (dados: EditContagemRequest) => Promise<{ success: boolean; error?: string }>
  onDelete: (dados: DeleteContagemRequest) => Promise<{ success: boolean; error?: string }>
}

export function EditarContagemModal({ 
  open, 
  onOpenChange, 
  contagem, 
  onEdit, 
  onDelete 
}: EditarContagemModalProps) {
  const [activeTab, setActiveTab] = React.useState('edit')
  const [loading, setLoading] = React.useState(false)
  
  // Dados para edição
  const [quantidade, setQuantidade] = React.useState('')
  const [responsavel, setResponsavel] = React.useState('')
  const [obs, setObs] = React.useState('')
  const [usuarioEdicao, setUsuarioEdicao] = React.useState('')
  const [motivoEdicao, setMotivoEdicao] = React.useState('')
  
  // Dados para exclusão
  const [usuarioExclusao, setUsuarioExclusao] = React.useState('')
  const [motivoExclusao, setMotivoExclusao] = React.useState('')

  const resetForm = () => {
    if (contagem) {
      setQuantidade(contagem.quantidade.toString())
      setResponsavel(contagem.responsavel)
      setObs(contagem.obs || '')
    }
    setUsuarioEdicao('')
    setMotivoEdicao('')
    setUsuarioExclusao('')
    setMotivoExclusao('')
    setActiveTab('edit')
  }

  const handleEdit = async () => {
    if (!contagem) return

    if (!usuarioEdicao.trim() || !motivoEdicao.trim()) {
      toast.error('Usuário e motivo da edição são obrigatórios')
      return
    }

    if (!quantidade || parseInt(quantidade) < 0) {
      toast.error('Quantidade deve ser um número válido')
      return
    }

    if (!responsavel.trim()) {
      toast.error('Responsável é obrigatório')
      return
    }

    setLoading(true)
    try {
      const dados: EditContagemRequest = {
        id: contagem.id,
        usuario_edicao: usuarioEdicao.trim(),
        motivo_edicao: motivoEdicao.trim(),
        dados: {
          quantidade: parseInt(quantidade),
          responsavel: responsavel.trim(),
          obs: obs.trim() || undefined
        }
      }

      const resultado = await onEdit(dados)
      if (resultado.success) {
        toast.success('Contagem editada com sucesso!')
        onOpenChange(false)
      } else {
        toast.error(resultado.error || 'Erro ao editar contagem')
      }
    } catch (error) {
      toast.error('Erro inesperado ao editar contagem')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!contagem) return

    if (!usuarioExclusao.trim() || !motivoExclusao.trim()) {
      toast.error('Usuário e motivo da exclusão são obrigatórios')
      return
    }

    const confirmacao = confirm(
      `Tem certeza que deseja excluir a contagem do ativo "${contagem.ativo}"? Esta ação não pode ser desfeita.`
    )

    if (!confirmacao) return

    setLoading(true)
    try {
      const dados: DeleteContagemRequest = {
        id: contagem.id,
        usuario_exclusao: usuarioExclusao.trim(),
        motivo_exclusao: motivoExclusao.trim()
      }

      const resultado = await onDelete(dados)
      if (resultado.success) {
        toast.success('Contagem excluída com sucesso!')
        onOpenChange(false)
      } else {
        toast.error(resultado.error || 'Erro ao excluir contagem')
      }
    } catch (error) {
      toast.error('Erro inesperado ao excluir contagem')
    } finally {
      setLoading(false)
    }
  }

  const getLocalInfo = () => {
    if (!contagem) return ''
    
    switch (contagem.tipo) {
      case 'loja':
        return contagem.loja || ''
      case 'cd':
        return contagem.setor_cd || ''
      case 'transito':
        return `${contagem.cd_origem} → ${contagem.cd_destino}`
      case 'fornecedor':
        return contagem.fornecedor || ''
      default:
        return ''
    }
  }

  React.useEffect(() => {
    if (open && contagem) {
      resetForm()
    }
  }, [open, contagem])

  if (!contagem) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-gray-700 max-w-md p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-gray-100 text-lg">Gerenciar Contagem</DialogTitle>
          <DialogDescription className="text-gray-400 text-sm">
            Edite ou exclua a contagem selecionada
          </DialogDescription>
        </DialogHeader>

        {/* Informações da contagem */}
        <div className="bg-gray-800 p-2 sm:p-3 rounded-lg border border-gray-700 space-y-1 text-xs sm:text-sm">
          <div className="grid grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
            <div>
              <span className="text-gray-400">Ativo:</span>
              <span className="text-gray-100 ml-1 sm:ml-2 font-medium">{contagem.ativo}</span>
            </div>
            <div>
              <span className="text-gray-400">Tipo:</span>
              <span className="text-gray-100 ml-1 sm:ml-2 capitalize">{contagem.tipo}</span>
            </div>
            <div>
              <span className="text-gray-400">Local:</span>
              <span className="text-gray-100 ml-1 sm:ml-2">{getLocalInfo()}</span>
            </div>
            <div>
              <span className="text-gray-400">Data:</span>
              <span className="text-gray-100 ml-1 sm:ml-2">
                {new Date(contagem.data_contagem).toLocaleString('pt-BR')}
              </span>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 bg-gray-800 text-xs sm:text-sm mb-1">
            <TabsTrigger value="edit" className="data-[state=active]:bg-gray-700">
              <Edit className="h-4 w-4 mr-1 sm:mr-2" />
              Editar
            </TabsTrigger>
            <TabsTrigger value="delete" className="data-[state=active]:bg-gray-700">
              <Trash2 className="h-4 w-4 mr-1 sm:mr-2" />
              Excluir
            </TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="space-y-1 sm:space-y-2">
            <Alert className="bg-blue-900/20 border-blue-700 p-2 sm:p-3">
              <AlertDescription className="text-blue-300 text-xs sm:text-sm">
                Apenas quantidade, responsável e observações podem ser editados.
              </AlertDescription>
            </Alert>

            <div className="space-y-1 sm:space-y-2">
              <div className="space-y-1">
                <Label className="text-gray-300 text-xs sm:text-sm">Quantidade</Label>
                <Input
                  type="number"
                  min="0"
                  value={quantidade}
                  onChange={(e) => setQuantidade(e.target.value)}
                  className="bg-gray-800 border-gray-600 text-gray-100 h-8 text-xs sm:text-sm"
                />
              </div>

              <div className="space-y-1 sm:space-y-2">
                <Label className="text-gray-300 text-xs sm:text-sm">Responsável</Label>
                <Input
                  value={responsavel}
                  onChange={(e) => setResponsavel(e.target.value)}
                  className="bg-gray-800 border-gray-600 text-gray-100 h-8 text-xs sm:text-sm"
                />
              </div>

              <div className="space-y-1 sm:space-y-2">
                <Label className="text-gray-300 text-xs sm:text-sm">Observações</Label>
                <Textarea
                  value={obs}
                  onChange={(e) => setObs(e.target.value)}
                  className="bg-gray-800 border-gray-600 text-gray-100 text-xs sm:text-sm"
                  rows={2}
                />
              </div>

              <div className="space-y-1 sm:space-y-2">
                <Label className="text-gray-300 text-xs sm:text-sm">Seu Nome (para auditoria)</Label>
                <Input
                  value={usuarioEdicao}
                  onChange={(e) => setUsuarioEdicao(e.target.value)}
                  placeholder="Nome do usuário que está editando"
                  className="bg-gray-800 border-gray-600 text-gray-100 h-8 text-xs sm:text-sm"
                />
              </div>

              <div className="space-y-1 sm:space-y-2">
                <Label className="text-gray-300 text-xs sm:text-sm">Motivo da Edição</Label>
                <Textarea
                  value={motivoEdicao}
                  onChange={(e) => setMotivoEdicao(e.target.value)}
                  placeholder="Descreva o motivo da edição"
                  className="bg-gray-800 border-gray-600 text-gray-100 text-xs sm:text-sm"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2 sm:gap-3">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                  className="border-gray-600 text-gray-300 hover:bg-gray-800 h-8 px-3 text-xs sm:text-sm"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleEdit}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 h-8 px-3 text-xs sm:text-sm"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1 sm:mr-2"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Edit className="h-4 w-4 mr-1 sm:mr-2" />
                      Salvar Edição
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="delete" className="space-y-1 sm:space-y-2">
            <Alert className="bg-red-900/20 border-red-700 p-2 sm:p-3">
              <AlertDescription className="text-red-300 text-xs sm:text-sm">
                Esta ação não pode ser desfeita. A contagem será removida permanentemente.
              </AlertDescription>
            </Alert>

            <div className="space-y-1 sm:space-y-2">
              <div className="space-y-1">
                <Label className="text-gray-300 text-xs sm:text-sm">Seu Nome (para auditoria)</Label>
                <Input
                  value={usuarioExclusao}
                  onChange={(e) => setUsuarioExclusao(e.target.value)}
                  placeholder="Nome do usuário que está excluindo"
                  className="bg-gray-800 border-gray-600 text-gray-100 h-8 text-xs sm:text-sm"
                />
              </div>

              <div className="space-y-1 sm:space-y-2">
                <Label className="text-gray-300 text-xs sm:text-sm">Motivo da Exclusão</Label>
                <Textarea
                  value={motivoExclusao}
                  onChange={(e) => setMotivoExclusao(e.target.value)}
                  placeholder="Descreva o motivo da exclusão"
                  className="bg-gray-800 border-gray-600 text-gray-100 text-xs sm:text-sm"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2 sm:gap-3">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                  className="border-gray-600 text-gray-300 hover:bg-gray-800 h-8 px-3 text-xs sm:text-sm"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleDelete}
                  disabled={loading}
                  variant="destructive"
                  className="bg-red-600 hover:bg-red-700 h-8 px-3 text-xs sm:text-sm"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1 sm:mr-2"></div>
                      Excluindo...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-1 sm:mr-2" />
                      Confirmar Exclusão
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
// components/configuration/LojaManagerDialog.tsx
"use client"

import * as React from "react"
import { Loader2, Pencil, Plus, RefreshCw, Save, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { LojaRegional } from "@/types/loja"

interface LojaManagerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const initialFormState = { nome: "", responsavel: "" }

export function LojaManagerDialog({ open, onOpenChange }: LojaManagerDialogProps) {
  const [lojas, setLojas] = React.useState<LojaRegional[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [editForm, setEditForm] = React.useState(initialFormState)
  const [newLoja, setNewLoja] = React.useState(initialFormState)
  const [updatingId, setUpdatingId] = React.useState<string | null>(null)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)
  const [isCreating, setIsCreating] = React.useState(false)

  const carregarLojas = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/lojas")
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Não foi possível carregar as lojas")
      }

      const dados: LojaRegional[] = (result.data || []).map((loja: LojaRegional) => ({
        ...loja,
        nome: loja.nome.trim(),
        responsavel: loja.responsavel.trim(),
      }))

      setLojas(dados)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Erro inesperado ao carregar as lojas")
    } finally {
      setIsLoading(false)
      setEditingId(null)
    }
  }, [])

  React.useEffect(() => {
    if (open) {
      carregarLojas()
    } else {
      setEditingId(null)
      setEditForm(initialFormState)
      setNewLoja(initialFormState)
      setError(null)
    }
  }, [open, carregarLojas])

  const iniciarEdicao = (loja: LojaRegional) => {
    setEditingId(loja.id)
    setEditForm({ nome: loja.nome, responsavel: loja.responsavel })
  }

  const cancelarEdicao = () => {
    setEditingId(null)
    setEditForm(initialFormState)
  }

  const handleUpdate = async (id: string) => {
    if (!editForm.nome.trim() || !editForm.responsavel.trim()) {
      toast.error("Informe o nome da loja e o regional")
      return
    }

    setUpdatingId(id)
    try {
      const response = await fetch(`/api/lojas/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: editForm.nome.trim(),
          responsavel: editForm.responsavel.trim(),
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Não foi possível atualizar a loja")
      }

      const atualizada: LojaRegional = {
        ...result.data,
        nome: result.data.nome.trim(),
        responsavel: result.data.responsavel.trim(),
      }

      setLojas(prev => prev.map(loja => (loja.id === id ? atualizada : loja)))
      toast.success("Loja atualizada com sucesso")
      cancelarEdicao()
    } catch (err) {
      console.error(err)
      toast.error("Erro ao atualizar loja", {
        description: err instanceof Error ? err.message : "Tente novamente mais tarde",
      })
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const response = await fetch(`/api/lojas/${id}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Não foi possível remover a loja")
      }

      setLojas(prev => prev.filter(loja => loja.id !== id))
      toast.success("Loja removida com sucesso")
    } catch (err) {
      console.error(err)
      toast.error("Erro ao remover loja", {
        description: err instanceof Error ? err.message : "Tente novamente mais tarde",
      })
    } finally {
      setDeletingId(null)
    }
  }

  const handleCreate = async () => {
    if (!newLoja.nome.trim() || !newLoja.responsavel.trim()) {
      toast.error("Informe o nome da loja e o regional")
      return
    }

    setIsCreating(true)
    try {
      const response = await fetch("/api/lojas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: newLoja.nome.trim(),
          responsavel: newLoja.responsavel.trim(),
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Não foi possível cadastrar a loja")
      }

      const criada: LojaRegional = {
        ...result.data,
        nome: result.data.nome.trim(),
        responsavel: result.data.responsavel.trim(),
      }

      setLojas(prev => [...prev, criada])
      setNewLoja(initialFormState)
      toast.success("Loja adicionada com sucesso")
    } catch (err) {
      console.error(err)
      toast.error("Erro ao adicionar loja", {
        description: err instanceof Error ? err.message : "Tente novamente mais tarde",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const responsaveisCadastrados = React.useMemo(() => {
    return Array.from(new Set(lojas.map(loja => loja.responsavel))).sort((a, b) =>
      a.localeCompare(b, "pt-BR")
    )
  }, [lojas])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-gray-700 max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-gray-100">Gerenciar lojas e regionais</DialogTitle>
          <DialogDescription className="text-gray-400">
            Atualize a relação de lojas por regional sem precisar editar arquivos manuais.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="rounded-lg border border-gray-700 bg-gray-950/50">
            <div className="flex items-center justify-between border-b border-gray-700 px-4 py-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-200">Lojas cadastradas</h3>
                <p className="text-xs text-gray-400">
                  {responsaveisCadastrados.length} regionais • {lojas.length} lojas
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={carregarLojas} disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  <span className="ml-2">Recarregar</span>
                </Button>
              </div>
            </div>

            {error ? (
              <div className="px-4 py-6 text-center text-sm text-red-300">
                {error}
              </div>
            ) : (
              <ScrollArea className="max-h-80">
                {isLoading ? (
                  <div className="flex items-center justify-center py-10 text-gray-400">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="ml-2 text-sm">Carregando lojas...</span>
                  </div>
                ) : lojas.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-gray-400">
                    Nenhuma loja cadastrada. Utilize o formulário abaixo para começar.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-900/60">
                        <TableHead className="text-gray-300">Loja</TableHead>
                        <TableHead className="text-gray-300">Regional</TableHead>
                        <TableHead className="text-gray-300 text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lojas
                        .slice()
                        .sort((a, b) =>
                          a.responsavel.localeCompare(b.responsavel, "pt-BR") ||
                          a.nome.localeCompare(b.nome, "pt-BR")
                        )
                        .map(loja => {
                          const emEdicao = editingId === loja.id
                          const estaAtualizando = updatingId === loja.id
                          const estaRemovendo = deletingId === loja.id

                          return (
                            <TableRow key={loja.id} className="border-gray-800">
                              <TableCell className="align-top">
                                {emEdicao ? (
                                  <Input
                                    value={editForm.nome}
                                    onChange={event =>
                                      setEditForm(prev => ({ ...prev, nome: event.target.value }))
                                    }
                                    className="bg-gray-800 border-gray-600 text-gray-100"
                                  />
                                ) : (
                                  <span className="font-medium text-gray-100">{loja.nome}</span>
                                )}
                              </TableCell>
                              <TableCell className="align-top">
                                {emEdicao ? (
                                  <Input
                                    value={editForm.responsavel}
                                    onChange={event =>
                                      setEditForm(prev => ({ ...prev, responsavel: event.target.value }))
                                    }
                                    className="bg-gray-800 border-gray-600 text-gray-100"
                                    list="responsaveis-cadastrados"
                                  />
                                ) : (
                                  <span className="text-gray-300">{loja.responsavel}</span>
                                )}
                              </TableCell>
                              <TableCell className="w-40 text-right">
                                {emEdicao ? (
                                  <div className="flex items-center justify-end gap-2">
                                    <Button
                                      size="sm"
                                      className="bg-green-600 hover:bg-green-700"
                                      onClick={() => handleUpdate(loja.id)}
                                      disabled={estaAtualizando}
                                    >
                                      {estaAtualizando ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Save className="h-4 w-4" />
                                      )}
                                      <span className="ml-2">Salvar</span>
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={cancelarEdicao}>
                                      <X className="h-4 w-4" />
                                      <span className="ml-2">Cancelar</span>
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-end gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => iniciarEdicao(loja)}
                                    >
                                      <Pencil className="h-4 w-4" />
                                      <span className="ml-2">Editar</span>
                                    </Button>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="sm" disabled={estaRemovendo}>
                                          {estaRemovendo ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                          ) : (
                                            <Trash2 className="h-4 w-4" />
                                          )}
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent className="bg-gray-900 border-gray-700">
                                        <AlertDialogHeader>
                                          <AlertDialogTitle className="text-gray-100">
                                            Remover "{loja.nome}"?
                                          </AlertDialogTitle>
                                          <AlertDialogDescription className="text-gray-400">
                                            Esta ação não pode ser desfeita e removerá a loja da listagem do dashboard.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel className="border-gray-600">
                                            Cancelar
                                          </AlertDialogCancel>
                                          <AlertDialogAction
                                            className="bg-red-600 hover:bg-red-700"
                                            onClick={() => handleDelete(loja.id)}
                                          >
                                            Remover
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                    </TableBody>
                  </Table>
                )}
              </ScrollArea>
            )}
          </div>

          <div className="rounded-lg border border-gray-700 bg-gray-950/50 p-4">
            <h3 className="text-sm font-semibold text-gray-200">Adicionar nova loja</h3>
            <p className="text-xs text-gray-400 mb-4">
              Informe o nome da loja e associe a um regional. Você pode reutilizar um regional existente digitando o mesmo nome.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nova-loja" className="text-gray-300">
                  Nome da loja
                </Label>
                <Input
                  id="nova-loja"
                  value={newLoja.nome}
                  onChange={event => setNewLoja(prev => ({ ...prev, nome: event.target.value }))}
                  placeholder="Ex: BOTAFOGO"
                  className="bg-gray-800 border-gray-600 text-gray-100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="novo-regional" className="text-gray-300">
                  Regional
                </Label>
                <Input
                  id="novo-regional"
                  value={newLoja.responsavel}
                  onChange={event => setNewLoja(prev => ({ ...prev, responsavel: event.target.value }))}
                  placeholder="Ex: Jean Mendes"
                  className="bg-gray-800 border-gray-600 text-gray-100"
                  list="responsaveis-cadastrados"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={handleCreate} disabled={isCreating} className="bg-blue-600 hover:bg-blue-700">
                {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                <span className="ml-2">Adicionar loja</span>
              </Button>
            </div>
          </div>
        </div>

        <datalist id="responsaveis-cadastrados">
          {responsaveisCadastrados.map(responsavel => (
            <option key={responsavel} value={responsavel} />
          ))}
        </datalist>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

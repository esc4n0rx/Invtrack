// components/inventory/FinalizationModal.tsx
"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FileSpreadsheet, AlertCircle, CheckCircle2, Download, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface FinalizationModalProps {
  isOpen: boolean
  onClose: () => void
  inventarioCodigo: string
  onFinalize: (finalizarInventario: boolean) => Promise<{ success: boolean; data?: any; error?: string }>
}

export function FinalizationModal({ isOpen, onClose, inventarioCodigo, onFinalize }: FinalizationModalProps) {
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const [currentStep, setCurrentStep] = React.useState('')
  const [isComplete, setIsComplete] = React.useState(false)
  const [error, setError] = React.useState('')
  const [finalizarInventario, setFinalizarInventario] = React.useState(false)
  const [excelUrl, setExcelUrl] = React.useState<string | null>(null)
  const [excelFileName, setExcelFileName] = React.useState<string | null>(null)

  const handleFinalize = async () => {
    setIsProcessing(true)
    setError('')
    setProgress(0)
    setCurrentStep('Iniciando processamento...')

    try {
      // Simular progresso
      const steps = [
        'Coletando dados de inventário...',
        'Processando contagens HB (618 e 623)...',
        'Processando contagens HNT (G e P)...',
        'Organizando dados por lojas e CDs...',
        'Gerando planilha Excel...',
        'Salvando histórico de finalização...',
        'Finalizando processo...'
      ]

      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(steps[i])
        setProgress((i + 1) / steps.length * 90)
        await new Promise(resolve => setTimeout(resolve, 800))
      }

      // Chamada real para a API
      const result = await onFinalize(finalizarInventario)
      
      if (result.success) {
        setCurrentStep('Finalização concluída com sucesso!')
        setProgress(100)
        setIsComplete(true)
        setExcelUrl(result.data?.arquivo_excel_url || null)
        setExcelFileName(result.data?.nome_arquivo || null)
      } else {
        throw new Error(result.error || 'Erro desconhecido')
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar finalização')
      setProgress(0)
      setCurrentStep('')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownload = () => {
    if (excelUrl) {
      const link = document.createElement('a')
      link.href = excelUrl
      link.download = excelFileName || `Inventario_${inventarioCodigo}_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleClose = () => {
    if (!isProcessing) {
      setIsComplete(false)
      setError('')
      setProgress(0)
      setCurrentStep('')
      setExcelUrl(null)
      setExcelFileName(null)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-gray-900 border-gray-700 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-gray-100 flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-blue-400" />
            Finalização de Inventário
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações do inventário */}
          <div className="p-4 bg-gray-800 rounded-lg">
            <h3 className="font-semibold text-gray-100 mb-2">Inventário: {inventarioCodigo}</h3>
            <p className="text-sm text-gray-400">
              Este processo irá gerar um arquivo Excel completo com todas as contagens organizadas por:
            </p>
            <ul className="mt-2 text-sm text-gray-400 space-y-1">
              <li>• <strong>Aba 1:</strong> Resumo geral do inventário</li>
              <li>• <strong>Aba 2:</strong> Inventário HB (ativos HB 618 e HB 623)</li>
              <li>• <strong>Aba 3:</strong> Inventário HNT (ativos HNT G e HNT P)</li>
            </ul>
          </div>

          {/* Opção de finalização */}
          {!isProcessing && !isComplete && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="finalizar-inventario"
                  checked={finalizarInventario}
                  onCheckedChange={(checked) => setFinalizarInventario(checked as boolean)}
                />
                <Label htmlFor="finalizar-inventario" className="text-gray-300">
                  Finalizar inventário após gerar Excel (recomendado)
                </Label>
              </div>
              
              <Alert className="bg-blue-900/20 border-blue-700">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-blue-300">
                  {finalizarInventario 
                    ? "O inventário será marcado como finalizado e não permitirá mais alterações."
                    : "O inventário permanecerá ativo e poderá receber novas contagens."
                  }
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Progress durante processamento */}
          {isProcessing && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">{currentStep}</span>
                  <span className="text-gray-400">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
              
              <div className="flex items-center gap-2 text-blue-400">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                <span className="text-sm">Processando...</span>
              </div>
            </div>
          )}

          {/* Erro */}
          {error && (
            <Alert className="bg-red-900/20 border-red-700">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-300">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Sucesso */}
          {isComplete && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <Alert className="bg-green-900/20 border-green-700">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription className="text-green-300">
                  Inventário finalizado com sucesso! O arquivo Excel foi gerado e está pronto para download.
                </AlertDescription>
              </Alert>

              {excelUrl && (
                <div className="flex items-center gap-2 p-3 bg-gray-800 rounded-lg">
                  <FileSpreadsheet className="h-5 w-5 text-green-400" />
                  <span className="text-sm text-gray-300 flex-1">
                    {excelFileName || 'Arquivo Excel gerado'}
                  </span>
                  <Button
                    onClick={handleDownload}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
              )}
            </motion.div>
          )}

          {/* Botões */}
          <div className="flex justify-end gap-3">
            {!isProcessing && !isComplete && (
              <>
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="border-gray-600 text-gray-300"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleFinalize}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Gerar Excel
                </Button>
              </>
            )}

            {isComplete && (
              <Button
                onClick={handleClose}
                className="bg-gray-600 hover:bg-gray-700"
              >
                <X className="h-4 w-4 mr-2" />
                Fechar
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
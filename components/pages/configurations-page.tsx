// components/pages/configurations-page.tsx
"use client"
import * as React from "react"
import { motion } from "framer-motion"
import { useTheme } from "next-themes"
import { Bell, Shield, Database, Palette, Trash2, AlertCircle, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
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
import { useInventario } from "@/hooks/useInventario"
import { useIntegrator } from "@/hooks/useIntegrator" // Importar hook do integrator
import { toast } from "sonner"

export function ConfigurationsPage() {
  const { theme, setTheme } = useTheme()
  const { inventarioAtivo } = useInventario()
  const { config: integratorConfig, toggleCleanupCron, loading: integratorLoading } = useIntegrator()
  const [isCleaning, setIsCleaning] = React.useState(false)
  
  const handleThemeChange = (checked: boolean) => {
    setTheme(checked ? "dark" : "light")
  }

  const handleLimparDuplicatas = async () => {
    if (!inventarioAtivo) {
      toast.error("Nenhum inventário ativo selecionado.")
      return
    }

    setIsCleaning(true)
    try {
      const response = await fetch('/api/inventarios/limpar-duplicatas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo_inventario: inventarioAtivo.codigo })
      })

      const result = await response.json()

      if (result.success) {
        toast.success("Limpeza concluída!", {
          description: `${result.data.deletedCount} contagens duplicadas foram removidas.`,
        })
      } else {
        toast.error("Falha na limpeza", {
          description: result.error || "Ocorreu um erro desconhecido.",
        })
      }
    } catch (error) {
      toast.error("Falha na limpeza", {
        description: "Erro de conexão com o servidor.",
      })
    } finally {
      setIsCleaning(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground mt-1">Configurações gerais e manutenção do sistema</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-pink-500" />
              Aparência
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-foreground">Tema escuro</span>
              <Switch 
                checked={theme === "dark"} 
                onCheckedChange={handleThemeChange}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-foreground">Animações</span>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-500" />
              Notificações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-foreground">Alertas de contagem</span>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-foreground">Notificações por email</span>
              <Switch />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-purple-500" />
              Manutenção
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700">
              <div>
                <h4 className="font-semibold text-foreground">Limpeza Automática de Duplicatas</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Ativa um job a cada 5 minutos para remover contagens duplicadas do inventário ativo.
                </p>
              </div>
              <Switch
                checked={integratorConfig.isCleanupCronActive}
                onCheckedChange={toggleCleanupCron}
                disabled={integratorLoading}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700">
              <div>
                <h4 className="font-semibold text-foreground">Limpeza Manual de Duplicatas</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Força a remoção imediata de duplicatas do inventário ({inventarioAtivo?.codigo || 'Nenhum'}). Use como último recurso.
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={!inventarioAtivo || isCleaning}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    {isCleaning ? "Limpando..." : "Executar Limpeza Manual"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-gray-900 border-gray-700">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-gray-100 flex items-center gap-2">
                      <AlertCircle className="text-red-500"/>
                      Confirmar Ação
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-400">
                      Esta ação removerá permanentemente todas as contagens duplicadas para o inventário 
                      <strong className="text-red-400"> {inventarioAtivo?.codigo}</strong>. 
                      Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="border-gray-600">Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleLimparDuplicatas} className="bg-red-600 hover:bg-red-700">
                      Sim, limpar duplicatas
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
"use client"
import { motion } from "framer-motion"
import { Bell, Shield, Database, Palette } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"

export function ConfigurationsPage() {
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-gray-100">Configurações</h1>
        <p className="text-gray-400 mt-1">Configurações gerais do sistema</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-100">
              <Bell className="h-5 w-5 text-blue-400" />
              Notificações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Alertas de contagem</span>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Notificações por email</span>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Relatórios automáticos</span>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-100">
              <Shield className="h-5 w-5 text-green-400" />
              Segurança
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Autenticação 2FA</span>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Log de atividades</span>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Backup automático</span>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-100">
              <Database className="h-5 w-5 text-purple-400" />
              Dados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full border-gray-600 text-gray-300 hover:bg-gray-800 bg-transparent">
              Exportar dados
            </Button>
            <Button variant="outline" className="w-full border-gray-600 text-gray-300 hover:bg-gray-800 bg-transparent">
              Importar dados
            </Button>
            <Button variant="destructive" className="w-full">
              Limpar cache
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-100">
              <Palette className="h-5 w-5 text-pink-400" />
              Aparência
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Tema escuro</span>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Animações</span>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Sidebar compacta</span>
              <Switch />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

"use client"
import { motion } from "framer-motion"
import { Package, Code, Heart } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-gray-100">Sobre</h1>
        <p className="text-gray-400 mt-1">Informações sobre o sistema Asset Inventory Manager</p>
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
              <Package className="h-5 w-5 text-blue-400" />
              Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Versão:</span>
              <span className="text-gray-100">2.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Build:</span>
              <span className="text-gray-100">2024.01.15</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Ambiente:</span>
              <span className="text-gray-100">Produção</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Licença:</span>
              <span className="text-gray-100">Empresarial</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-100">
              <Code className="h-5 w-5 text-green-400" />
              Tecnologias
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Frontend:</span>
              <span className="text-gray-100">Next.js 14</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">UI:</span>
              <span className="text-gray-100">Tailwind + shadcn/ui</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Animações:</span>
              <span className="text-gray-100">Framer Motion</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Ícones:</span>
              <span className="text-gray-100">Lucide React</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-100">
              <Heart className="h-5 w-5 text-red-400" />
              Desenvolvido com
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 leading-relaxed">
              Este sistema foi desenvolvido para otimizar o gerenciamento de ativos e inventário, proporcionando uma
              interface moderna, intuitiva e responsiva. Utilizando as mais recentes tecnologias web, oferece uma
              experiência fluida e eficiente para o controle completo do seu inventário.
            </p>
            <div className="mt-4 pt-4 border-t border-gray-700">
              <p className="text-sm text-gray-400 text-center">
                Asset Inventory Manager © 2024 - Todos os direitos reservados
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

"use client"
import { motion } from "framer-motion"
import { Package, Code, Heart, Users, Mail, Info } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-green-400 to-purple-400 drop-shadow-lg">
          Sobre o Sistema
        </h1>
        <p className="text-gray-400 mt-2 text-lg max-w-2xl">
          O <span className="font-semibold text-blue-300">HB Inventory Manager</span> é uma solução moderna para controle de ativos e inventário.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.7 }}
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
      >
        <motion.div whileHover={{ scale: 1.04, boxShadow: "0 8px 32px 0 rgba(0,0,0,0.25)" }}>
          <Card className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-gray-700 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-100">
                <Package className="h-5 w-5 text-blue-400 animate-bounce" />
                Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Versão:</span>
                <span className="text-gray-100">2.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Build:</span>
                <span className="text-gray-100">2025.01.15</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Ambiente:</span>
                <span className="text-gray-100">Produção</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Licença:</span>
                <span className="text-gray-100">Empresarial</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Status:</span>
                <span className="text-green-400 font-semibold">Ativo</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.04, boxShadow: "0 8px 32px 0 rgba(0,0,0,0.25)" }}>
          <Card className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-gray-700 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-100">
                <Code className="h-5 w-5 text-green-400 animate-spin-slow" />
                Tecnologias
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
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
              <div className="flex justify-between">
                <span className="text-gray-400">Backend:</span>
                <span className="text-gray-100">Supabase</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.04, boxShadow: "0 8px 32px 0 rgba(0,0,0,0.25)" }}>
          <Card className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-gray-700 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-100">
                <Users className="h-5 w-5 text-yellow-400 animate-pulse" />
                Equipe
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Desenvolvimento:</span>
                <span className="text-gray-100">Paulo Oliveira</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Design:</span>
                <span className="text-gray-100">Paulo Oiveira</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Gestão:</span>
                <span className="text-gray-100">Rafael Moraes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Contato:</span>
                <span className="text-blue-300 underline">paulo.cunha@hortifruti.com.br</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.7 }}>
        <Card className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-gray-700 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-100">
              <Info className="h-5 w-5 text-cyan-400 animate-fade-in" />
              Detalhes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-gray-300 leading-relaxed space-y-2 list-disc list-inside">
              <li>Controle de inventário em tempo real com dashboards dinâmicos.</li>
              <li>Gestão de múltiplos centros, lojas e fornecedores.</li>
              <li>Auditoria detalhada de todas as operações realizadas.</li>
              <li>Relatórios customizáveis e exportação de dados.</li>
              <li>Segurança avançada e permissões por perfil de usuário.</li>
              <li>Interface responsiva e acessível em qualquer dispositivo.</li>
            </ul>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.7 }}>
        <Card className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-gray-700 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-100">
              <Mail className="h-5 w-5 text-pink-400 animate-fade-in" />
              Contato & Suporte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 leading-relaxed">
              Precisa de ajuda ou quer saber mais? Entre em contato pelo e-mail <span className="text-blue-300 underline">paulo.cunha@hortifruti.com.br</span>
            </p>
            <div className="mt-4 pt-4 border-t border-gray-700">
              <p className="text-sm text-gray-400 text-center">
                HB Inventory Manager © 2025 - Todos os direitos reservados
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

// Animação customizada para spin lento
// Adicione no seu CSS global se quiser:
// .animate-spin-slow { animation: spin 2.5s linear infinite; }
// .animate-fade-in { animation: fadeIn 1.2s ease-in; }

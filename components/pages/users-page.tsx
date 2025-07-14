"use client"
import { motion } from "framer-motion"
import { UserPlus, Shield, Mail } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function UsersPage() {
  const users = [
    { id: 1, name: "João Silva", email: "joao@empresa.com", role: "admin", status: "ativo" },
    { id: 2, name: "Maria Santos", email: "maria@empresa.com", role: "operador", status: "ativo" },
    { id: 3, name: "Pedro Costa", email: "pedro@empresa.com", role: "visualizador", status: "inativo" },
  ]

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Usuários</h1>
          <p className="text-gray-400 mt-1">Gerenciamento de usuários e permissões</p>
        </div>

        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <UserPlus className="h-4 w-4 mr-2" />
          Novo Usuário
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {users.map((user, index) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 * index }}
          >
            <Card className="bg-gray-900 border-gray-700 hover:border-gray-600 transition-colors">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Avatar>
                    <AvatarFallback className="bg-blue-600 text-white">
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <Badge
                    variant={user.status === "ativo" ? "default" : "secondary"}
                    className={
                      user.status === "ativo"
                        ? "bg-green-900 text-green-300 border-green-700"
                        : "bg-gray-700 text-gray-300"
                    }
                  >
                    {user.status === "ativo" ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                <CardTitle className="text-gray-100">{user.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-300">{user.email}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Shield className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-300 capitalize">{user.role}</span>
                  </div>
                </div>
                <div className="pt-2">
                  <Button variant="ghost" size="sm" className="w-full text-gray-400 hover:text-gray-200">
                    Gerenciar permissões
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}

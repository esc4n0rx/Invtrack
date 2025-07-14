"use client"
import { motion } from "framer-motion"
import { Users, Building, Phone, Mail } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export function SuppliersPage() {
  const suppliers = [
    {
      id: 1,
      name: "Fornecedor Alpha",
      contact: "João Silva",
      phone: "(11) 9999-9999",
      email: "joao@alpha.com",
      status: "ativo",
    },
    {
      id: 2,
      name: "Beta Logistics",
      contact: "Maria Santos",
      phone: "(11) 8888-8888",
      email: "maria@beta.com",
      status: "ativo",
    },
    {
      id: 3,
      name: "Gamma Supply",
      contact: "Pedro Costa",
      phone: "(11) 7777-7777",
      email: "pedro@gamma.com",
      status: "inativo",
    },
  ]

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Fornecedores</h1>
          <p className="text-gray-400 mt-1">Gerenciamento de fornecedores e parceiros</p>
        </div>

        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <Users className="h-4 w-4 mr-2" />
          Novo Fornecedor
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {suppliers.map((supplier, index) => (
          <motion.div
            key={supplier.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 * index }}
          >
            <Card className="bg-gray-900 border-gray-700 hover:border-gray-600 transition-colors">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Building className="h-5 w-5 text-blue-400" />
                  <Badge
                    variant={supplier.status === "ativo" ? "default" : "secondary"}
                    className={
                      supplier.status === "ativo"
                        ? "bg-green-900 text-green-300 border-green-700"
                        : "bg-gray-700 text-gray-300"
                    }
                  >
                    {supplier.status === "ativo" ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                <CardTitle className="text-gray-100">{supplier.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-300">{supplier.contact}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-300">{supplier.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-300">{supplier.email}</span>
                  </div>
                </div>
                <div className="pt-2">
                  <Button variant="ghost" size="sm" className="w-full text-gray-400 hover:text-gray-200">
                    Ver detalhes
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

"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Home,
  Package,
  Calculator,
  Truck,
  Users,
  ClipboardCheck,
  FileText,
  BarChart3,
  Settings,
  Wrench,
  Zap,
  User,
  Info,
  Search,
  Bell,
  HelpCircle,
  LogOut,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// Componentes das páginas
import { DashboardHome } from "@/components/pages/dashboard-home"
import { InventoryPage } from "@/components/pages/inventory-page"
import { CountsPage } from "@/components/pages/counts-page"
import { TransitPage } from "@/components/pages/transit-page"
import { SuppliersPage } from "@/components/pages/suppliers-page"
import { ReportsPage } from "@/components/pages/reports-page"
import { ComparativesPage } from "@/components/pages/comparatives-page"
import { ConfigurationsPage } from "@/components/pages/configurations-page"
import { FinalizacoesPage } from "@/components/pages/finalizacoes-page"
import { IntegratorPage } from "@/components/pages/integrator-page"
import { AboutPage } from "@/components/pages/about-page"

const menuItems = [
  { id: "home", title: "Início", icon: Home, component: DashboardHome },
  { id: "inventory", title: "Inventário", icon: Package, component: InventoryPage },
  { id: "counts", title: "Contagens", icon: Calculator, component: CountsPage },
  { id: "transit", title: "Trânsito", icon: Truck, component: TransitPage },
  { id: "suppliers", title: "Fornecedores", icon: Users, component: SuppliersPage },
  { id: "reports", title: "Relatórios", icon: FileText, component: ReportsPage },
  { id: "comparatives", title: "Comparativos", icon: BarChart3, component: ComparativesPage },
  { id: "configurations", title: "Configurações", icon: Settings, component: ConfigurationsPage },
  { id: "Inventarios Finalizados", title: "Inventarios Finalizados", icon: Wrench, component: FinalizacoesPage},
  { id: "integrator", title: "Integrador", icon: Zap, component: IntegratorPage },
  { id: "about", title: "Sobre", icon: Info, component: AboutPage },
]

export function AssetInventoryManager() {
  const [activeSection, setActiveSection] = React.useState("home")
  const [search, setSearch] = React.useState("")
  const [searchResults, setSearchResults] = React.useState(menuItems)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (!search) {
      setSearchResults(menuItems)
      return
    }
    const lower = search.toLowerCase()
    setSearchResults(
      menuItems.filter(
        (item) =>
          item.title.toLowerCase().includes(lower) ||
          item.id.toLowerCase().includes(lower)
      )
    )
  }, [search])

  const ActiveComponent = menuItems.find((item) => item.id === activeSection)?.component || DashboardHome

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && searchResults.length > 0) {
      setActiveSection(searchResults[0].id)
      setSearch("")
      inputRef.current?.blur()
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header Principal - Estilo SAP */}
      <header className="bg-blue-600 text-white shadow-sm">
        <div className="flex items-center justify-between px-4 py-2">
          {/* Logo e Título */}
          <div className="flex items-center gap-3">
            <div className="bg-white text-blue-600 px-3 py-1 rounded font-bold text-lg">HB</div>
            <div>
              <h1 className="text-lg font-semibold">HB Inventory</h1>
              <p className="text-xs text-blue-100">Ambiente de Prdução</p>
            </div>
          </div>

          {/* Área de busca e ações */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                ref={inputRef}
                placeholder="Buscar..."
                className="pl-10 w-64 bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-400"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                autoComplete="off"
              />
              {search && searchResults.length > 0 && (
                <div className="absolute left-0 mt-1 w-64 bg-white rounded shadow-lg z-50 max-h-60 overflow-auto">
                  {searchResults.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-blue-100 text-gray-900"
                      onClick={() => {
                        setActiveSection(item.id)
                        setSearch("")
                        inputRef.current?.blur()
                      }}
                    >
                      <item.icon className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">{item.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                <HelpCircle className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                    <User className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white">
                  <DropdownMenuItem>
                    <User className="h-4 w-4 mr-2" />
                    Perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="h-4 w-4 mr-2" />
                    Configurações
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Barra de Ferramentas - Estilo SAP */}
      <div className="bg-gray-900 border-b border-gray-700 px-4 py-2">
        <div className="flex items-center gap-1 overflow-x-auto">
          {menuItems.map((item) => (
            <Button
              key={item.id}
              variant={activeSection === item.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveSection(item.id)}
              className={`flex flex-col items-center gap-1 h-auto py-2 px-3 min-w-[80px] ${
                activeSection === item.id
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}
            >
              <item.icon className="h-4 w-4" />
              <span className="text-xs font-medium">{item.title}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2">
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <span>Asset Manager</span>
          <span>›</span>
          <span className="text-blue-400 font-medium">
            {menuItems.find((item) => item.id === activeSection)?.title || "Início"}
          </span>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <main className="bg-gray-950 min-h-[calc(100vh-140px)]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="h-full"
          >
            <ActiveComponent />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}

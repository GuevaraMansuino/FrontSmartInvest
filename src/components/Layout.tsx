import { useState } from 'react'
import { Menu, X, TrendingUp, Wallet, Settings, LogOut, UserCheck, Shield } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { AuthModal } from './AuthModal'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { user, isAuthenticated, setAuthModalOpen, logout } = useAuth()

  const menuItems = [
    { icon: TrendingUp, label: 'Dashboard', href: '/' },
    { icon: Wallet, label: 'Portfolios', href: '/portfolios' },
    { icon: Settings, label: 'Configuración', href: '/settings' },
  ]

  return (
    <div className="flex h-screen bg-black">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-black text-white border-r border-white transition-all duration-300 ease-in-out flex flex-col`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-white">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-black" />
              </div>
              <h1 className="text-lg font-semibold tracking-tight">SmartInvest</h1>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 hover:bg-gray-900 rounded-lg transition-colors"
          >
            {sidebarOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-8 space-y-2">
          {menuItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-colors ${
                sidebarOpen
                  ? 'hover:bg-gray-900'
                  : 'hover:bg-gray-900 justify-center'
              }`}
              title={!sidebarOpen ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
            </a>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-6 border-t border-white">
          {isAuthenticated ? (
            <button
              onClick={() => logout()}
              className={`flex items-center gap-4 px-4 py-3 w-full rounded-lg transition-colors hover:bg-gray-900 text-gray-400 hover:text-white ${
                !sidebarOpen && 'justify-center'
              }`}
              title={!sidebarOpen ? 'Cerrar sesión' : undefined}
            >
              <LogOut className="w-5 h-5 flex-shrink-0 text-rose-400" />
              {sidebarOpen && <span className="text-sm font-medium">Cerrar Sesión</span>}
            </button>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className={`flex items-center gap-4 px-4 py-3 w-full rounded-lg transition-colors hover:bg-gray-900 text-emerald-400 hover:text-emerald-300 ${
                !sidebarOpen && 'justify-center'
              }`}
              title={!sidebarOpen ? 'Iniciar sesión' : undefined}
            >
              <Shield className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="text-sm font-medium">Iniciar Sesión</span>}
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="h-16 bg-black border-b border-white flex items-center px-8 sticky top-0 z-40">
          <div className="flex items-center justify-between w-full">
            <h2 className="text-xl font-semibold text-white">
              {isAuthenticated && user?.email
                ? `Bienvenido, ${user.email}`
                : 'Bienvenido a SmartInvest'}
            </h2>
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-emerald-400 font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    Conectado
                  </span>
                  <div className="w-9 h-9 bg-emerald-500 text-slate-950 rounded-full flex items-center justify-center font-bold text-sm">
                    {user?.email ? user.email[0].toUpperCase() : 'U'}
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:from-emerald-400 hover:to-teal-400 transition-all shadow-md shadow-emerald-500/10"
                >
                  Iniciar Sesión
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8">
          {children}
        </div>
      </main>

      {/* Auth Modal */}
      <AuthModal />
    </div>
  )
}
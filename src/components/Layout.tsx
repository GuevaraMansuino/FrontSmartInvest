import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, TrendingUp, Wallet, Target, Settings, LogOut, Shield, Home as HomeIcon, Lock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { AuthModal } from './AuthModal'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const { user, isAuthenticated, setAuthModalOpen, logout } = useAuth()
  const location = useLocation()

  const menuItems = [
    { icon: HomeIcon, label: 'Inicio', href: '/', requiresAuth: false },
    { icon: TrendingUp, label: 'Dashboard', href: '/dashboard', requiresAuth: false },
    { icon: Wallet, label: 'Portfolios', href: '/portfolios', requiresAuth: true },
    { icon: Target, label: 'Estrategias', href: '/strategies', requiresAuth: true },
    { icon: Settings, label: 'Configuración', href: '/settings', requiresAuth: true },
  ]

  const handleNavClick = (e: React.MouseEvent, item: typeof menuItems[0]) => {
    if (item.requiresAuth && !isAuthenticated) {
      e.preventDefault()
      setToastMessage(`Para acceder a "${item.label}" debes iniciar sesión en tu cuenta.`)
      setTimeout(() => {
        setToastMessage(null)
      }, 4500)
    }
    setMobileMenuOpen(false)
  }

  return (
    <div className="flex h-screen bg-black overflow-hidden">
      {/* Toast Notification over Sidebar/Screen */}
      {toastMessage && (
        <div
          style={{ top: 'max(64px, calc(env(safe-area-inset-top, 44px) + 14px))' }}
          className="fixed left-1/2 -translate-x-1/2 md:left-auto md:right-8 md:translate-x-0 z-[100] max-w-md w-[94%] md:w-auto animate-fade-in duration-300"
        >
          <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-neutral-900/95 backdrop-blur-md border border-emerald-500/50 shadow-2xl shadow-emerald-500/25 text-white">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Acceso Restringido</p>
                <p className="text-xs sm:text-sm font-medium text-gray-200 leading-snug">{toastMessage}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  setToastMessage(null)
                  setAuthModalOpen(true)
                }}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs sm:text-sm hover:from-emerald-400 hover:to-teal-400 transition shadow-md"
              >
                Iniciar Sesión
              </button>
              <button
                onClick={() => setToastMessage(null)}
                className="p-1.5 text-gray-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm md:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer Sidebar (< md) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-black text-white border-r border-white/30 transform transition-transform duration-300 ease-in-out md:hidden flex flex-col ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div
          style={{ paddingTop: 'max(42px, env(safe-area-inset-top, 42px))' }}
          className="min-h-[88px] pb-4 flex items-center justify-between px-6 border-b border-white/20"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-black" />
            </div>
            <h1 className="text-lg font-semibold tracking-tight">SmartInvest</h1>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-1.5 hover:bg-gray-900 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-8 space-y-2">
          {menuItems.map((item) => {
            const active = location.pathname === item.href;
            return (
              <Link
                key={item.label}
                to={item.href}
                onClick={(e) => handleNavClick(e, item)}
                className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-colors ${
                  active ? 'bg-white/15 text-emerald-400 font-semibold' : 'hover:bg-gray-900 text-gray-300'
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="px-3 py-6 border-t border-white/20">
          {isAuthenticated ? (
            <button
              onClick={() => {
                logout()
                setMobileMenuOpen(false)
              }}
              className="flex items-center gap-4 px-4 py-3 w-full rounded-lg transition-colors hover:bg-gray-900 text-gray-400 hover:text-white"
            >
              <LogOut className="w-5 h-5 flex-shrink-0 text-rose-400" />
              <span className="text-sm font-medium">Cerrar Sesión</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setAuthModalOpen(true)
                setMobileMenuOpen(false)
              }}
              className="flex items-center gap-4 px-4 py-3 w-full rounded-lg transition-colors hover:bg-gray-900 text-emerald-400 hover:text-emerald-300"
            >
              <Shield className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">Iniciar Sesión</span>
            </button>
          )}
        </div>
      </aside>

      {/* Desktop Sidebar (>= md) */}
      <aside
        className={`hidden md:flex flex-col bg-black text-white border-r border-white/30 transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-white/20">
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
          {menuItems.map((item) => {
            const active = location.pathname === item.href;
            return (
              <Link
                key={item.label}
                to={item.href}
                onClick={(e) => handleNavClick(e, item)}
                className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-colors ${
                  active
                    ? 'bg-white/15 text-emerald-400 font-semibold'
                    : 'hover:bg-gray-900 text-gray-300'
                } ${!sidebarOpen && 'justify-center'}`}
                title={!sidebarOpen ? item.label : undefined}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-6 border-t border-white/20">
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

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto flex flex-col min-w-0">
        {/* Responsive Header */}
        <header className="mobile-pwa-header md:min-h-16 md:py-0 bg-black/95 backdrop-blur-md border-b border-white/20 flex items-center px-4 sm:px-6 md:px-8 sticky top-0 z-40 shadow-lg">
          <div className="flex items-center justify-between w-full min-w-0 gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden p-2.5 text-white hover:bg-gray-900 rounded-xl flex-shrink-0 border border-white/10"
                aria-label="Abrir menú"
              >
                <Menu className="w-6 h-6" />
              </button>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white tracking-tight truncate">
                {isAuthenticated && user?.email
                  ? `Bienvenido, ${user.email.split('@')[0]}`
                  : 'Bienvenido a SmartInvest'}
              </h2>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              {isAuthenticated ? (
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="hidden sm:inline-block text-xs text-emerald-400 font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    Conectado
                  </span>
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-emerald-500 text-slate-950 rounded-full flex items-center justify-center font-bold text-base shadow-md">
                    {user?.email ? user.email[0].toUpperCase() : 'U'}
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 sm:px-5 sm:py-2.5 text-sm sm:text-base font-bold text-slate-950 hover:from-emerald-400 hover:to-teal-400 transition-all shadow-lg shadow-emerald-500/20 shrink-0"
                >
                  Iniciar Sesión
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Page Content with responsive padding */}
        <div className="p-4 sm:p-6 md:p-8 flex-1">
          {children}
        </div>
      </main>

      {/* Auth Modal */}
      <AuthModal />
    </div>
  )
}
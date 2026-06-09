import { useState } from 'react'
import { Menu, X, TrendingUp, Wallet, Settings, LogOut } from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

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
          <button
            className={`flex items-center gap-4 px-4 py-3 w-full rounded-lg transition-colors hover:bg-gray-900 text-gray-400 hover:text-white ${
              !sidebarOpen && 'justify-center'
            }`}
            title={!sidebarOpen ? 'Logout' : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="h-16 bg-black border-b border-white flex items-center px-8 sticky top-0 z-40">
          <div className="flex items-center justify-between w-full">
            <h2 className="text-xl font-semibold text-white">
              Bienvenido a SmartInvest
            </h2>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-black font-semibold">
                U
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
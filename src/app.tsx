import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Layout from './components/Layout'
import Watchlist from './components/Watchlist'
import Portfolios from './components/Portfolios'
import Settings from './components/Settings'
import CronStatusBadge from './components/CronStatusBadge'
import { getApiUrl } from './utils/api'
import { fetchWithAuth } from './utils/apiClient'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ArrowUpRight, Wallet, TrendingUp, Layers } from 'lucide-react'

function Dashboard() {
  const { isAuthenticated } = useAuth()
  const [totalWallet, setTotalWallet] = useState<number>(0)
  const [totalInvested, setTotalInvested] = useState<number>(0)
  const [reservedCash, setReservedCash] = useState<number>(0)
  const [totalAssets, setTotalAssets] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    async function fetchDashboardStats() {
      if (!isAuthenticated) {
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        const res = await fetchWithAuth('/api/portfolios')
        if (res.status === 401) {
          setLoading(false)
          return
        }
        if (!res.ok) throw new Error('Error cargando portafolios')
        const portfolios = await res.json()

        if (Array.isArray(portfolios) && portfolios.length > 0) {
          const assetSummaries: Record<string, { totalCost: number; savedCash: number; quantity: number }> = {}

          for (const p of portfolios) {
            const txRes = await fetchWithAuth(`/api/portfolios/${p.id}/transactions`)
            if (txRes.ok) {
              const txs = await txRes.json()
              if (Array.isArray(txs)) {
                txs.forEach((txn: any) => {
                  const actualAssetId = txn.asset_id || 'wallet-cash-global'
                  if (!assetSummaries[actualAssetId]) {
                    assetSummaries[actualAssetId] = { totalCost: 0, savedCash: 0, quantity: 0 }
                  }
                  const asset = assetSummaries[actualAssetId]
                  if (txn.type === 'BUY') {
                    asset.quantity += Number(txn.quantity || 0)
                    asset.totalCost += Number(txn.amount || 0)
                  } else if (txn.type === 'SELL') {
                    asset.quantity -= Number(txn.quantity || 0)
                    asset.totalCost -= Number(txn.amount || 0)
                  } else if (txn.type === 'DEPOSIT') {
                    asset.savedCash += Number(txn.amount || 0)
                  } else if (txn.type === 'WITHDRAW') {
                    asset.savedCash -= Number(txn.amount || 0)
                  }
                })
              }
            }
          }

          const assets = Object.values(assetSummaries).filter(a => a.quantity > 0 || Math.max(0, a.savedCash - a.totalCost) > 0)
          const totalInv = assets.reduce((acc, a) => acc + a.totalCost, 0)
          const totalGuard = assets.reduce((acc, a) => acc + Math.max(0, a.savedCash - a.totalCost), 0)
          const totalWall = totalInv + totalGuard

          setTotalInvested(totalInv)
          setReservedCash(totalGuard)
          setTotalWallet(totalWall)
          setTotalAssets(assets.filter(a => a.quantity > 0).length)
        } else {
          setTotalInvested(0)
          setReservedCash(0)
          setTotalWallet(0)
          setTotalAssets(0)
        }
      } catch (err) {
        console.error('Error fetching dashboard stats:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardStats()
  }, [isAuthenticated])

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val)
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <CronStatusBadge />
      <Watchlist />
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <div className="bg-black rounded-xl p-4 sm:p-6 border border-white/20 transition hover:border-white/40 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5 gap-1">
            <p className="text-[11px] sm:text-sm text-gray-400 font-medium">Total de Billetera</p>
            <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 flex-shrink-0" />
          </div>
          <p className="text-lg sm:text-3xl font-bold text-white truncate">
            {loading ? '...' : formatCurrency(totalWallet)}
          </p>
        </div>

        <div className="bg-black rounded-xl p-4 sm:p-6 border border-white/20 transition hover:border-white/40 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5 gap-1">
            <p className="text-[11px] sm:text-sm text-gray-400 font-medium">Total Invertido</p>
            <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 flex-shrink-0" />
          </div>
          <p className="text-lg sm:text-3xl font-bold text-emerald-400 truncate">
            {loading ? '...' : formatCurrency(totalInvested)}
          </p>
        </div>

        <div className="bg-black rounded-xl p-4 sm:p-6 border border-white/20 transition hover:border-white/40 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5 gap-1">
            <p className="text-[11px] sm:text-sm text-gray-400 font-medium">Plata Reservada</p>
            <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400 flex-shrink-0" />
          </div>
          <p className="text-lg sm:text-3xl font-bold text-white truncate">
            {loading ? '...' : formatCurrency(reservedCash)}
          </p>
        </div>

        <div className="bg-black rounded-xl p-4 sm:p-6 border border-white/20 transition hover:border-white/40 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5 gap-1">
            <p className="text-[11px] sm:text-sm text-gray-400 font-medium">Activos en Cartera</p>
            <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400 flex-shrink-0" />
          </div>
          <p className="text-lg sm:text-3xl font-bold text-white truncate">{loading ? '...' : totalAssets}</p>
        </div>
      </div>

      <div className="bg-black rounded-xl p-6 sm:p-8 border border-white/20 flex flex-col items-center justify-center text-center space-y-4">
        <div className="p-3 rounded-full bg-white/5 border border-white/10">
          <TrendingUp className="w-6 h-6 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-white">Resumen y Evolución de Carteras</h3>
          <p className="text-xs sm:text-sm text-gray-400 max-w-md mt-1">
            Gestiona tus portafolios e inversiones para ver la evolución de tus activos aquí.
          </p>
        </div>
        <Link
          to="/portfolios"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black font-medium text-xs sm:text-sm hover:bg-gray-200 transition"
        >
          Ir a Carteras
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/portfolios" element={<Portfolios />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  )
}
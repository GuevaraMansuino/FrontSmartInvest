import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Layout from './components/Layout'
import Watchlist from './components/Watchlist'
import Portfolios from './components/Portfolios'
import CronStatusBadge from './components/CronStatusBadge'
import { getApiUrl } from './utils/api'
import { ArrowUpRight, Wallet, TrendingUp, Layers } from 'lucide-react'

function Dashboard() {
  const [totalWallet, setTotalWallet] = useState<number>(0)
  const [totalInvested, setTotalInvested] = useState<number>(0)
  const [reservedCash, setReservedCash] = useState<number>(0)
  const [totalAssets, setTotalAssets] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    async function fetchDashboardStats() {
      try {
        setLoading(true)
        const res = await fetch(getApiUrl('/api/portfolios'))
        if (!res.ok) throw new Error('Error cargando portafolios')
        const portfolios = await res.json()

        if (Array.isArray(portfolios) && portfolios.length > 0) {
          const assetSummaries: Record<string, { totalCost: number; savedCash: number; quantity: number }> = {}

          for (const p of portfolios) {
            const txRes = await fetch(getApiUrl(`/api/portfolios/${p.id}/transactions`))
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
  }, [])

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val)
  }

  return (
    <div className="space-y-8">
      <CronStatusBadge />
      <Watchlist />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-black rounded-lg p-6 border border-white/20 transition hover:border-white/40">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-400">Total de Billetera</p>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl lg:text-3xl font-bold text-white">
            {loading ? '...' : formatCurrency(totalWallet)}
          </p>
        </div>

        <div className="bg-black rounded-lg p-6 border border-white/20 transition hover:border-white/40">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-400">Total Invertido</p>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl lg:text-3xl font-bold text-emerald-400">
            {loading ? '...' : formatCurrency(totalInvested)}
          </p>
        </div>

        <div className="bg-black rounded-lg p-6 border border-white/20 transition hover:border-white/40">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-400">Plata Reservada</p>
            <Wallet className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl lg:text-3xl font-bold text-white">
            {loading ? '...' : formatCurrency(reservedCash)}
          </p>
        </div>

        <div className="bg-black rounded-lg p-6 border border-white/20 transition hover:border-white/40">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-400">Activos en Cartera</p>
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl lg:text-3xl font-bold text-white">{loading ? '...' : totalAssets}</p>
        </div>
      </div>

      <div className="bg-black rounded-lg p-8 border border-white/20 flex flex-col items-center justify-center text-center space-y-4">
        <div className="p-3 rounded-full bg-white/5 border border-white/10">
          <TrendingUp className="w-6 h-6 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Resumen y Evolución de Carteras</h3>
          <p className="text-sm text-gray-400 max-w-md mt-1">
            Gestiona tus portafolios e inversiones para ver la evolución de tus activos aquí.
          </p>
        </div>
        <Link
          to="/portfolios"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black font-medium text-sm hover:bg-gray-200 transition"
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
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/portfolios" element={<Portfolios />} />
        </Routes>
      </Layout>
    </Router>
  )
}
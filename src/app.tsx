import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Layout from './components/Layout'
import Watchlist from './components/Watchlist'
import Portfolios from './components/Portfolios'
import CronStatusBadge from './components/CronStatusBadge'
import { getApiUrl } from './utils/api'
import { ArrowUpRight, Wallet, TrendingUp, Layers } from 'lucide-react'

function Dashboard() {
  const [totalValue, setTotalValue] = useState<number>(0)
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
          let valueSum = 0
          const uniqueAssets = new Set<string>()

          for (const p of portfolios) {
            const txRes = await fetch(getApiUrl(`/api/portfolios/${p.id}/transactions`))
            if (txRes.ok) {
              const txs = await txRes.json()
              if (Array.isArray(txs)) {
                for (const tx of txs) {
                  if (tx.asset_id) uniqueAssets.add(tx.asset_id)
                  const amt = Number(tx.amount || 0)
                  const qty = Number(tx.quantity || 0)
                  const price = Number(tx.price || 0)
                  if (amt > 0) {
                    valueSum += amt
                  } else if (qty > 0 && price > 0) {
                    valueSum += qty * price
                  }
                }
              }
            }
          }

          setTotalValue(valueSum)
          setTotalAssets(uniqueAssets.size)
        } else {
          setTotalValue(0)
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

  return (
    <div className="space-y-8">
      <CronStatusBadge />
      <Watchlist />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-black rounded-lg p-6 border border-white/20 transition hover:border-white/40">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-400">Valor Total</p>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-bold text-white">
            {loading ? '...' : `$${totalValue.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </p>
        </div>

        <div className="bg-black rounded-lg p-6 border border-white/20 transition hover:border-white/40">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-400">Rendimiento</p>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-bold text-emerald-400">+0.0%</p>
        </div>

        <div className="bg-black rounded-lg p-6 border border-white/20 transition hover:border-white/40">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-400">Activos en Cartera</p>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-3xl font-bold text-white">{loading ? '...' : totalAssets}</p>
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
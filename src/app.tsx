import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './components/Home'
import Watchlist from './components/Watchlist'
import Portfolios from './components/Portfolios'
import Strategies from './components/Strategies'
import Settings from './components/Settings'
import CronStatusBadge from './components/CronStatusBadge'
import { getApiUrl } from './utils/api'
import { fetchWithAuth } from './utils/apiClient'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ArrowUpRight, Wallet, TrendingUp, Layers, Shield } from 'lucide-react'

function Dashboard() {
  const { isAuthenticated, setAuthModalOpen } = useAuth()
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
          const assetSummaries: Record<string, any> = {}

          const allTxns: any[] = [];
          for (const p of portfolios) {
            const txRes = await fetchWithAuth(`/api/portfolios/${p.id}/transactions`)
            if (txRes.ok) {
              const txs = await txRes.json()
              if (Array.isArray(txs)) {
                allTxns.push(...txs)
              }
            }
          }

          const getOrCreateAsset = (txn: any, id: string) => {
            if (!assetSummaries[id]) {
              assetSummaries[id] = {
                asset_id: id,
                symbol: txn.asset_symbol || (id === 'wallet-cash-global' ? 'BILLETERA' : 'ACTIVO'),
                name: txn.asset_name || txn.asset_symbol || (id === 'wallet-cash-global' ? 'Liquidez General' : 'Activo'),
                quantity: 0,
                totalCost: 0,
                savedCash: 0,
                transactions: []
              };
            }
            return assetSummaries[id];
          };

          const sortedTxns = [...allTxns].sort(
            (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()
          );

          let globalReservedCash = 0;

          sortedTxns.forEach((txn: any) => {
            const amount = Number(txn.amount || 0);
            const qty = Number(txn.quantity || 0);

            if (txn.type === 'DEPOSIT') {
              if (txn.asset_id) {
                const asset = getOrCreateAsset(txn, txn.asset_id);
                asset.savedCash += amount;
                asset.transactions.push(txn);
              } else {
                globalReservedCash += amount;
              }
            } else if (txn.type === 'WITHDRAW') {
              if (txn.asset_id) {
                const asset = getOrCreateAsset(txn, txn.asset_id);
                asset.savedCash = Math.max(0, asset.savedCash - amount);
                asset.transactions.push(txn);
              } else {
                globalReservedCash = Math.max(0, globalReservedCash - amount);
              }
            } else if (txn.type === 'BUY') {
              if (!txn.asset_id) return;
              const asset = getOrCreateAsset(txn, txn.asset_id);
              asset.quantity += qty;
              asset.totalCost += amount;
              asset.transactions.push(txn);

              let rem = amount;
              const fromAsset = Math.min(asset.savedCash, rem);
              asset.savedCash -= fromAsset;
              rem -= fromAsset;

              if (rem > 0 && globalReservedCash > 0) {
                const fromGlobal = Math.min(globalReservedCash, rem);
                globalReservedCash -= fromGlobal;
              }
            } else if (txn.type === 'SELL') {
              if (!txn.asset_id) return;
              const asset = getOrCreateAsset(txn, txn.asset_id);
              asset.quantity = Math.max(0, asset.quantity - qty);
              asset.totalCost = Math.max(0, asset.totalCost - amount);
              asset.transactions.push(txn);
            }
          });

          if (globalReservedCash > 0) {
            if (!assetSummaries['wallet-cash-global']) {
              assetSummaries['wallet-cash-global'] = {
                asset_id: 'wallet-cash-global',
                symbol: 'BILLETERA',
                name: 'Liquidez General',
                quantity: 0,
                totalCost: 0,
                savedCash: globalReservedCash,
                transactions: []
              };
            } else {
              assetSummaries['wallet-cash-global'].savedCash = globalReservedCash;
            }
          } else {
            delete assetSummaries['wallet-cash-global'];
          }

          const assets = Object.values(assetSummaries).filter((a: any) => a.quantity > 0 || a.savedCash > 0)
          const totalInv = assets.reduce((acc: number, a: any) => acc + a.totalCost, 0)
          const totalGuard = assets.reduce((acc: number, a: any) => acc + a.savedCash, 0)
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
      
      {!isAuthenticated ? (
        <div className="bg-gradient-to-r from-neutral-900 via-neutral-950 to-black rounded-2xl p-6 sm:p-8 border border-white/15 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              <Shield className="w-4 h-4" />
              <span>Acceso a Carteras Personalizadas</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white">
              Estás viendo las cotizaciones en tiempo real del mercado
            </h3>
            <p className="text-xs sm:text-sm text-gray-400 max-w-xl">
              Para ver el resumen de tu patrimonio personal, crear carteras y registrar transacciones, inicia sesión o crea tu cuenta gratuita en SmartInvest.
            </p>
          </div>
          <button
            onClick={() => setAuthModalOpen(true)}
            className="shrink-0 flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-3 text-sm font-bold text-slate-950 hover:from-emerald-400 hover:to-teal-400 transition-all shadow-lg shadow-emerald-500/20"
          >
            <span>Iniciar Sesión para Ver Carteras</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <>
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
        </>
      )}
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/portfolios" element={<Portfolios />} />
            <Route path="/strategies" element={<Strategies />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  )
}
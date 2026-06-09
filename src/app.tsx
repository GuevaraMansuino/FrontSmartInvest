import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Watchlist from './components/Watchlist'
import Portfolios from './components/Portfolios'

function Dashboard() {
  return (
    <div className="space-y-8">
      <Watchlist />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-black rounded-lg p-6 border border-white">
          <p className="text-sm text-gray-400 mb-2">Valor Total</p>
          <p className="text-3xl font-bold text-white">$0.00</p>
        </div>
        <div className="bg-black rounded-lg p-6 border border-white">
          <p className="text-sm text-gray-400 mb-2">Rendimiento</p>
          <p className="text-3xl font-bold text-positive">+0%</p>
        </div>
        <div className="bg-black rounded-lg p-6 border border-white">
          <p className="text-sm text-gray-400 mb-2">Activos</p>
          <p className="text-3xl font-bold text-white">0</p>
        </div>
      </div>
      <div className="bg-black rounded-lg p-6 border border-white h-96 flex items-center justify-center text-gray-500">
        Gráficos y análisis aquí
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
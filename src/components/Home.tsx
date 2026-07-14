import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Wallet,
  Sparkles,
  PieChart,
  BarChart3,
  Lock,
  CheckCircle2,
} from 'lucide-react';

export default function Home() {
  const { isAuthenticated, setAuthModalOpen } = useAuth();

  return (
    <div className="space-y-12 pb-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-neutral-900/80 via-neutral-950 to-black border border-white/10 p-6 sm:p-10 md:p-14 shadow-2xl shadow-emerald-500/5">
        {/* Glow de fondo */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs sm:text-sm font-semibold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Gestión Inteligente de Inversiones</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-tight">
            Toma el control de tus inversiones con{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              SmartInvest
            </span>
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Monitorea el mercado en tiempo real, administra tus portafolios multi-activos y diseña estrategias personalizadas de distribución patrimonial con total seguridad.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            {!isAuthenticated ? (
              <>
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3.5 text-sm sm:text-base font-bold text-slate-950 shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-400 transition-all transform hover:-translate-y-0.5"
                >
                  <span>Comenzar Ahora</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 rounded-xl bg-white/10 border border-white/15 px-6 py-3.5 text-sm sm:text-base font-semibold text-white hover:bg-white/15 transition-all"
                >
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>Ver Mercado en Vivo</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/portfolios"
                  className="flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3.5 text-sm sm:text-base font-bold text-slate-950 shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-400 transition-all transform hover:-translate-y-0.5"
                >
                  <Wallet className="w-4 h-4" />
                  <span>Mis Portafolios</span>
                </Link>
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 rounded-xl bg-white/10 border border-white/15 px-6 py-3.5 text-sm sm:text-base font-semibold text-white hover:bg-white/15 transition-all"
                >
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>Dashboard Principal</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Imagen Destacada / Preview de la Plataforma */}
      <section className="relative mx-auto max-w-6xl">
        <div className="p-1.5 sm:p-2.5 rounded-3xl bg-gradient-to-tr from-emerald-500/30 via-white/10 to-teal-500/20 shadow-2xl shadow-emerald-500/10">
          <div className="overflow-hidden rounded-2xl bg-neutral-950 border border-white/10">
            <img
              src="/SmartInvestHome.jpg"
              alt="SmartInvest Landing Overview"
              className="w-full h-auto object-cover max-h-[520px] transition-transform duration-700 hover:scale-[1.01]"
            />
          </div>
        </div>
      </section>

      {/* Características principales */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            ¿Por qué elegir SmartInvest?
          </h2>
          <p className="text-sm sm:text-base text-gray-400 max-w-xl mx-auto">
            Herramientas diseñadas tanto para inversores experimentados como para quienes comienzan a gestionar sus finanzas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-neutral-900/60 border border-white/10 hover:border-emerald-500/40 transition-all space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <PieChart className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Gestión de Carteras</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Crea múltiples portafolios de inversión, registra compras, ventas y depósitos para observar el crecimiento real de tu patrimonio.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-neutral-900/60 border border-white/10 hover:border-emerald-500/40 transition-all space-y-3">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Mercado en Tiempo Real</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Consulta en el Dashboard cotizaciones y variaciones de activos populares, criptomonedas y fondos actualizados al instante.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-neutral-900/60 border border-white/10 hover:border-emerald-500/40 transition-all space-y-3">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Seguridad & Privacidad</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Autenticación nativa protegida con contraseñas encriptadas y sesiones en cookies HttpOnly para máxima tranquilidad.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action Final si no está autenticado */}
      {!isAuthenticated && (
        <section className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-emerald-950/60 via-neutral-900 to-teal-950/60 border border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <h3 className="text-xl sm:text-2xl font-bold text-white">
              ¿Listo para empezar tu viaje financiero?
            </h3>
            <p className="text-sm text-gray-300">
              Regístrate en menos de un minuto y accede a todas las herramientas de gestión.
            </p>
          </div>
          <button
            onClick={() => setAuthModalOpen(true)}
            className="shrink-0 flex items-center gap-2 rounded-xl bg-emerald-400 px-6 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-300 transition-all shadow-lg shadow-emerald-500/20"
          >
            <span>Crear mi Cuenta Gratis</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </section>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Activity, CheckCircle2, AlertTriangle, RefreshCw, Database, Server } from 'lucide-react';
import { getApiUrl } from '../utils/api';

interface KeepAliveResponse {
  status: string;
  message: string;
  database: string;
  timestamp: string;
  service?: string;
}

export default function CronStatusBadge() {
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<KeepAliveResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const triggerPing = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(getApiUrl('/api/cron/keep-alive'));
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json: KeepAliveResponse = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || 'Error al conectar con Keep-Alive');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Al cargar, hacemos una verificación silenciosa inicial
    triggerPing();
  }, []);

  const isHealthy = data?.database === 'pong' && data?.status === 'awake';

  return (
    <div className="hidden md:block bg-black/80 backdrop-blur-md rounded-2xl border border-white/10 p-5 shadow-xl transition-all hover:border-white/20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Izquierda: Estado general y Títulos */}
        <div className="flex items-center gap-3.5">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
              isHealthy
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            }`}
          >
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white">Estado del Sistema & Keep-Alive</h3>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                  isHealthy
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                }`}
              >
                {isHealthy ? (
                  <>
                    <CheckCircle2 className="w-3 h-3" /> Supabase & Render Protegidos
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3 h-3" /> Verificando...
                  </>
                )}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Cron externo (cron-job.org) evita suspensión por inactividad en Supabase y Render.
            </p>
          </div>
        </div>

        {/* Derecha: Botón de verificación y métricas */}
        <div className="flex items-center gap-3">
          {data && (
            <div className="hidden md:flex items-center gap-4 text-xs text-gray-400 border-r border-white/10 pr-4">
              <div className="flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-blue-400" />
                <span>Render: <strong className="text-white">Activo</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span>Supabase DB: <strong className="text-white">Pong</strong></span>
              </div>
            </div>
          )}

          <button
            onClick={triggerPing}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-white border border-white/10 transition-colors disabled:opacity-50"
            title="Probar Keep-Alive manual"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Probar ping...' : 'Probar Keep-Alive'}</span>
          </button>
        </div>
      </div>

      {/* Detalle o mensaje inferior */}
      {(data || error) && (
        <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className={error ? 'text-rose-400' : 'text-gray-400'}>
            {error ? `Error: ${error}` : data?.message}
          </span>
          {data?.timestamp && (
            <span className="text-gray-500 font-mono text-[11px]">
              Último ping: {new Date(data.timestamp).toLocaleTimeString('es-AR')}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

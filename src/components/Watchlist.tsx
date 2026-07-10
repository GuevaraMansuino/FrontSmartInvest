import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { getApiUrl } from '../utils/api';

interface FeaturedAsset {
  symbol: string;
  quote_symbol: string | null;
  name: string;
  price: number;
  currency: string | null;
  instrument_type: string | null;
  change_percent: number | null;
  change_value: number | null;
}

const REQUEST_TIMEOUT_MS = 1200;
const WARMUP_RETRY_DELAY_MS = 1500;
const MAX_WARMUP_RETRIES = 5;
const FALLBACK_ASSETS: FeaturedAsset[] = [
  { symbol: 'SPY', quote_symbol: 'SPY.BA', name: 'SPDR S&P 500 ETF Trust', price: 0, currency: 'ARS', instrument_type: 'CEDEAR', change_percent: null, change_value: null },
  { symbol: 'NVDA', quote_symbol: 'NVDA.BA', name: 'NVIDIA Corporation', price: 0, currency: 'ARS', instrument_type: 'CEDEAR', change_percent: null, change_value: null },
  { symbol: 'MSFT', quote_symbol: 'MSFT.BA', name: 'Microsoft Corporation', price: 0, currency: 'ARS', instrument_type: 'CEDEAR', change_percent: null, change_value: null },
  { symbol: 'AMZN', quote_symbol: 'AMZN.BA', name: 'Amazon.com Inc.', price: 0, currency: 'ARS', instrument_type: 'CEDEAR', change_percent: null, change_value: null },
  { symbol: 'GOOGL', quote_symbol: 'GOOGL.BA', name: 'Alphabet Inc.', price: 0, currency: 'ARS', instrument_type: 'CEDEAR', change_percent: null, change_value: null },
];

function hasRealPrices(items: FeaturedAsset[]) {
  return items.some((asset) => asset.price > 0);
}

function formatAssetPrice(asset: FeaturedAsset) {
  if ((asset.currency ?? 'ARS') === 'ARS') {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 2,
    }).format(asset.price);
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: asset.currency ?? 'USD',
    maximumFractionDigits: 2,
  }).format(asset.price);
}

export default function Watchlist() {
  const [assets, setAssets] = useState<FeaturedAsset[]>(FALLBACK_ASSETS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const warmupRetryCountRef = useRef(0);
  const warmupRetryTimerRef = useRef<number | null>(null);

  const clearWarmupRetry = () => {
    if (warmupRetryTimerRef.current !== null) {
      window.clearTimeout(warmupRetryTimerRef.current);
      warmupRetryTimerRef.current = null;
    }
  };

  const scheduleWarmupRetry = () => {
    if (warmupRetryCountRef.current >= MAX_WARMUP_RETRIES) {
      return;
    }

    clearWarmupRetry();
    warmupRetryTimerRef.current = window.setTimeout(() => {
      warmupRetryCountRef.current += 1;
      void fetchFeatured(false);
    }, WARMUP_RETRY_DELAY_MS);
  };

  const fetchFeatured = async (manual = false) => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      if (manual) {
        warmupRetryCountRef.current = 0;
        clearWarmupRetry();
      }

      setLoading(true);
      const response = await fetch(getApiUrl('/api/market/featured'), { signal: controller.signal });
      if (!response.ok) throw new Error('Error fetching market data');

      const data = await response.json();
      const nextAssets = Array.isArray(data) && data.length > 0 ? data : FALLBACK_ASSETS;

      setAssets(nextAssets);
      setError(false);

      if (hasRealPrices(nextAssets)) {
        warmupRetryCountRef.current = 0;
        clearWarmupRetry();
      } else {
        scheduleWarmupRetry();
      }
    } catch (err) {
      console.error(err);
      setAssets((current) => current.length > 0 ? current : FALLBACK_ASSETS);
      setError(true);
      scheduleWarmupRetry();
    } finally {
      window.clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchFeatured();
    const interval = window.setInterval(() => {
      warmupRetryCountRef.current = 0;
      void fetchFeatured();
    }, 300000);

    return () => {
      window.clearInterval(interval);
      clearWarmupRetry();
    };
  }, []);

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Activos Destacados</h2>
        <button 
          onClick={() => void fetchFeatured(true)}
          disabled={loading}
          className="p-1.5 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-gray-900"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {assets.map((asset) => {
          const isPositive = (asset.change_percent || 0) >= 0;
          return (
            <div 
              key={asset.symbol} 
              className="group bg-black rounded-xl p-4 border border-white hover:border-gray-400 transition-all hover:shadow-sm"
            >
              <div className="flex justify-between items-start mb-1 gap-2">
                <div>
                  <span className="text-sm font-bold text-white group-hover:text-gray-300 transition-colors">
                    {asset.symbol}
                  </span>
                  {asset.quote_symbol && (
                    <div className="text-[11px] text-gray-500">{asset.quote_symbol}</div>
                  )}
                </div>
                {asset.change_percent !== null && (
                  <div className={`flex items-center text-xs font-medium ${isPositive ? 'text-positive' : 'text-negative'}`}>
                    {isPositive ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                    {Math.abs(asset.change_percent).toFixed(2)}%
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-500 truncate mb-2" title={asset.name}>
                {asset.name}
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] uppercase tracking-wider border border-gray-700 rounded-full px-2 py-0.5 text-gray-400">
                  {asset.instrument_type ?? 'Activo'}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-gray-500">
                  {asset.currency ?? 'ARS'}
                </span>
              </div>
              <div className="text-lg font-bold text-white">
                {formatAssetPrice(asset)}
              </div>
            </div>
          );
        })}
      </div>
      {error && (
        <p className="text-xs text-negative mt-2 text-center">
          No se pudo actualizar en tiempo real. Se muestran valores de respaldo.
        </p>
      )}
    </div>
  );
}

import React, { useEffect, useState } from "react";
import {
  Target,
  Wallet,
  Plus,
  Trash2,
  Check,
  Search,
  ArrowRight,
  Sparkles,
  DollarSign,
  PieChart,
  Percent,
  X,
  TrendingUp,
  AlertCircle,
  Save,
  CheckCircle2,
} from "lucide-react";
import { fetchWithAuth } from "../utils/apiClient";
import { useAuth } from "../context/AuthContext";

interface Portfolio {
  id: string;
  name: string;
  monthly_amount: number;
  created_at: string;
}

interface AssetDef {
  id: string;
  symbol: string;
  name: string;
}

interface StrategyItem {
  id: string;
  portfolio_id: string;
  asset_id: string;
  percentage: number;
  target_amount?: number | null;
  asset_symbol?: string | null;
  asset_name?: string | null;
}

interface Transaction {
  id: string;
  portfolio_id: string;
  type: string;
  date: string;
  amount: number;
  asset_id: string | null;
  quantity: number | null;
  price: number | null;
  notes: string | null;
  asset_symbol: string | null;
  asset_name: string | null;
}

interface AssetPositionSummary {
  savedCash: number;
  quantity: number;
  totalCost: number;
}

export default function Strategies() {
  const { isAuthenticated, setAuthModalOpen } = useAuth();

  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null);
  const [strategyItems, setStrategyItems] = useState<StrategyItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [assetsList, setAssetsList] = useState<AssetDef[]>([]);
  const [loading, setLoading] = useState(true);

  // Budget states
  const [monthlyBudgetInput, setMonthlyBudgetInput] = useState<string>("0");
  const [savingBudget, setSavingBudget] = useState(false);

  // Strategy edit buffer
  const [editedItems, setEditedItems] = useState<
    {
      asset_id: string;
      percentage: string;
      target_amount: string;
      symbol: string;
      name: string;
    }[]
  >([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [savingStrategy, setSavingStrategy] = useState(false);

  // Add Asset Modal
  const [showAddAssetModal, setShowAddAssetModal] = useState(false);
  const [assetSearch, setAssetSearch] = useState("");

  // Deposit Modal
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [customDepositAmount, setCustomDepositAmount] = useState<string>("");
  const [depositing, setDepositing] = useState(false);

  // Buy Modal
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [buyAssetId, setBuyAssetId] = useState<string | null>(null);
  const [buyQuantity, setBuyQuantity] = useState<string>("");
  const [buyPrice, setBuyPrice] = useState<string>("");
  const [buyAmount, setBuyAmount] = useState<string>("");
  const [submittingBuy, setSubmittingBuy] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToastMsg = (msg: string, type: "success" | "error" = "success") => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 rounded-2xl bg-black border border-white/20 text-center space-y-6 shadow-2xl">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
          <Target className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white">
            Para acceder a Estrategias debes iniciar sesión
          </h2>
          <p className="text-sm text-gray-400">
            Inicia sesión o crea tu cuenta gratuita para configurar tu presupuesto mensual,
            diseñar la distribución ideal de tus activos y automatizar depósitos.
          </p>
        </div>
        <button
          onClick={() => setAuthModalOpen(true)}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-sm hover:from-emerald-400 hover:to-teal-400 transition shadow-lg shadow-emerald-500/20"
        >
          Iniciar Sesión
        </button>
      </div>
    );
  }

  const selectedPortfolio = portfolios.find((p) => p.id === selectedPortfolioId);
  const currentBudget = Number(monthlyBudgetInput || "0");

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);

    Promise.all([
      fetchWithAuth("/api/portfolios").then((res) => (res.ok ? res.json() : [])),
      fetchWithAuth("/api/assets").then((res) => (res.ok ? res.json() : [])),
    ])
      .then(([portsData, assetsData]) => {
        if (Array.isArray(portsData)) {
          if (portsData.length > 0) {
            setPortfolios(portsData);
            setSelectedPortfolioId(portsData[0].id);
            setMonthlyBudgetInput(portsData[0].monthly_amount?.toString() || "0");
          } else {
            fetchWithAuth("/api/portfolios", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: "Mi Cartera Principal" }),
            })
              .then((res) => (res.ok ? res.json() : null))
              .then((newPort) => {
                if (newPort) {
                  setPortfolios([newPort]);
                  setSelectedPortfolioId(newPort.id);
                  setMonthlyBudgetInput(newPort.monthly_amount?.toString() || "0");
                }
                setLoading(false);
              })
              .catch(() => setLoading(false));
            return;
          }
        }
        if (Array.isArray(assetsData)) {
          setAssetsList(assetsData);
        }
      })
      .catch((err) => {
        console.error("Error al cargar datos de estrategia:", err);
        setLoading(false);
      });
  }, [isAuthenticated]);

  useEffect(() => {
    if (!selectedPortfolioId) return;
    setLoading(true);

    const port = portfolios.find((p) => p.id === selectedPortfolioId);
    if (port) {
      setMonthlyBudgetInput(port.monthly_amount?.toString() || "0");
    }

    Promise.all([
      fetchWithAuth(`/api/portfolios/${selectedPortfolioId}/strategy`).then((res) =>
        res.ok ? res.json() : [],
      ),
      fetchWithAuth(`/api/portfolios/${selectedPortfolioId}/transactions`).then((res) =>
        res.ok ? res.json() : [],
      ),
    ])
      .then(([stratData, txnsData]) => {
        if (Array.isArray(stratData)) {
          setStrategyItems(stratData);
          const buffer = stratData.map((item) => ({
            asset_id: item.asset_id,
            percentage: item.percentage.toString(),
            target_amount: item.target_amount ? item.target_amount.toString() : "",
            symbol: item.asset_symbol || "???",
            name: item.asset_name || "Activo",
          }));
          setEditedItems(buffer);
          setHasUnsavedChanges(false);
        }
        if (Array.isArray(txnsData)) {
          setTransactions(txnsData);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [selectedPortfolioId, portfolios]);

  // Calculate asset positions (savedCash, quantity, totalCost)
  const assetPositions: Record<string, AssetPositionSummary> = {};
  const sortedTxns = [...transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  let globalReservedCash = 0;

  sortedTxns.forEach((txn) => {
    const amount = Number(txn.amount || 0);
    const qty = Number(txn.quantity || 0);

    const getOrInit = (id: string) => {
      if (!assetPositions[id]) {
        assetPositions[id] = { savedCash: 0, quantity: 0, totalCost: 0 };
      }
      return assetPositions[id];
    };

    if (txn.type === "DEPOSIT") {
      if (txn.asset_id) {
        const asset = getOrInit(txn.asset_id);
        asset.savedCash += amount;
      } else {
        globalReservedCash += amount;
      }
    } else if (txn.type === "WITHDRAW") {
      if (txn.asset_id) {
        const asset = getOrInit(txn.asset_id);
        asset.savedCash = Math.max(0, asset.savedCash - amount);
      } else {
        globalReservedCash = Math.max(0, globalReservedCash - amount);
      }
    } else if (txn.type === "BUY") {
      if (!txn.asset_id) return;
      const asset = getOrInit(txn.asset_id);
      asset.quantity += qty;
      asset.totalCost += amount;

      let rem = amount;
      const fromAsset = Math.min(asset.savedCash, rem);
      asset.savedCash -= fromAsset;
      rem -= fromAsset;

      if (rem > 0 && globalReservedCash > 0) {
        const fromGlobal = Math.min(globalReservedCash, rem);
        globalReservedCash -= fromGlobal;
      }
    } else if (txn.type === "SELL") {
      if (!txn.asset_id) return;
      const asset = getOrInit(txn.asset_id);
      asset.quantity = Math.max(0, asset.quantity - qty);
      asset.totalCost = Math.max(0, asset.totalCost - amount);
    }
  });

  const handleSaveBudget = async () => {
    if (!selectedPortfolioId || !selectedPortfolio) return;
    const val = parseFloat(monthlyBudgetInput);
    if (isNaN(val) || val < 0) {
      showToastMsg("Ingresa un monto mensual válido y positivo.", "error");
      return;
    }

    setSavingBudget(true);
    try {
      const res = await fetchWithAuth(`/api/portfolios/${selectedPortfolioId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: selectedPortfolio.name, monthly_amount: val }),
      });
      if (res.ok) {
        const updated = await res.json();
        setPortfolios((prev) =>
          prev.map((p) => (p.id === updated.id ? { ...p, monthly_amount: updated.monthly_amount } : p)),
        );
        showToastMsg("Presupuesto mensual actualizado correctamente.");
      } else {
        showToastMsg("Error al guardar el presupuesto mensual.", "error");
      }
    } catch (err) {
      showToastMsg("Error de conexión al guardar.", "error");
    } finally {
      setSavingBudget(false);
    }
  };

  const handleAddAssetToStrategy = (asset: AssetDef) => {
    if (editedItems.some((item) => item.asset_id === asset.id)) {
      showToastMsg(`El activo ${asset.symbol} ya está en la estrategia.`, "error");
      return;
    }
    setEditedItems((prev) => [
      ...prev,
      {
        asset_id: asset.id,
        percentage: "0",
        target_amount: "0",
        symbol: asset.symbol,
        name: asset.name,
      },
    ]);
    setHasUnsavedChanges(true);
    setShowAddAssetModal(false);
    setAssetSearch("");
  };

  const handleRemoveFromStrategy = (asset_id: string) => {
    setEditedItems((prev) => prev.filter((item) => item.asset_id !== asset_id));
    setHasUnsavedChanges(true);
  };

  const handlePercentageChange = (index: number, newPctStr: string) => {
    const updated = [...editedItems];
    updated[index].percentage = newPctStr;

    const pctVal = parseFloat(newPctStr || "0");
    if (!isNaN(pctVal) && currentBudget > 0) {
      const calculatedAmt = (currentBudget * (pctVal / 100)).toFixed(2);
      updated[index].target_amount = calculatedAmt;
    }
    setEditedItems(updated);
    setHasUnsavedChanges(true);
  };

  const handleAmountChange = (index: number, newAmtStr: string) => {
    const updated = [...editedItems];
    updated[index].target_amount = newAmtStr;

    const amtVal = parseFloat(newAmtStr || "0");
    if (!isNaN(amtVal) && currentBudget > 0) {
      const calculatedPct = ((amtVal / currentBudget) * 100).toFixed(2);
      updated[index].percentage = calculatedPct;
    }
    setEditedItems(updated);
    setHasUnsavedChanges(true);
  };

  const totalAllocatedPct = editedItems.reduce(
    (sum, item) => sum + (parseFloat(item.percentage) || 0),
    0,
  );
  const totalAllocatedAmt = editedItems.reduce(
    (sum, item) => sum + (parseFloat(item.target_amount) || 0),
    0,
  );

  const handleSaveStrategy = async () => {
    if (!selectedPortfolioId) return;

    if (totalAllocatedPct > 100.01) {
      showToastMsg(`La suma de porcentajes (${totalAllocatedPct.toFixed(2)}%) supera el 100%.`, "error");
      return;
    }

    if (editedItems.length === 0) {
      showToastMsg("Añade al menos un activo para guardar la estrategia.", "error");
      return;
    }

    setSavingStrategy(true);
    try {
      const payload = {
        items: editedItems.map((item) => ({
          asset_id: item.asset_id,
          percentage: parseFloat(item.percentage) || 0,
          target_amount: parseFloat(item.target_amount) || null,
        })),
      };

      const res = await fetchWithAuth(`/api/portfolios/${selectedPortfolioId}/strategy`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const newData = await res.json();
        setStrategyItems(newData);
        setHasUnsavedChanges(false);
        showToastMsg("Estrategia objetivo guardada con éxito.");
      } else {
        const errData = await res.json().catch(() => ({ detail: "Error del servidor" }));
        showToastMsg(errData.detail || "Error al guardar estrategia.", "error");
      }
    } catch (err) {
      showToastMsg("Error de conexión al guardar la estrategia.", "error");
    } finally {
      setSavingStrategy(false);
    }
  };

  const handleDepositStrategy = async () => {
    if (!selectedPortfolioId) return;

    const amt = customDepositAmount ? parseFloat(customDepositAmount) : currentBudget;
    if (isNaN(amt) || amt <= 0) {
      showToastMsg("El monto a depositar debe ser mayor a $0.", "error");
      return;
    }

    if (strategyItems.length === 0 && !hasUnsavedChanges) {
      showToastMsg("Configura y guarda una estrategia antes de realizar el depósito.", "error");
      return;
    }

    if (hasUnsavedChanges) {
      showToastMsg("Guarda los cambios de tu estrategia antes de depositar.", "error");
      return;
    }

    setDepositing(true);
    try {
      const payload = customDepositAmount ? { amount: amt } : {};
      const res = await fetchWithAuth(`/api/portfolios/${selectedPortfolioId}/strategy/deposit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const newTxns = await res.json();
        const txnsRes = await fetchWithAuth(`/api/portfolios/${selectedPortfolioId}/transactions`);
        if (txnsRes.ok) {
          const freshTxns = await txnsRes.json();
          setTransactions(freshTxns);
        }
        setShowDepositModal(false);
        setCustomDepositAmount("");
        showToastMsg(`¡Depósito de $${amt.toFixed(2)} dividido y reservado entre tus activos!`);
      } else {
        const errData = await res.json().catch(() => ({ detail: "Error en el servidor" }));
        showToastMsg(errData.detail || "Error al realizar depósito.", "error");
      }
    } catch (err) {
      showToastMsg("Error de conexión durante el depósito.", "error");
    } finally {
      setDepositing(false);
    }
  };

  const openBuyModalForAsset = (assetId: string) => {
    setBuyAssetId(assetId);
    const pos = assetPositions[assetId];
    if (pos && pos.savedCash > 0) {
      setBuyAmount(pos.savedCash.toFixed(2));
    } else {
      const strat = editedItems.find((i) => i.asset_id === assetId);
      if (strat && strat.target_amount) {
        setBuyAmount(parseFloat(strat.target_amount).toFixed(2));
      } else {
        setBuyAmount("");
      }
    }
    setBuyQuantity("");
    setBuyPrice("");
    setShowBuyModal(true);
  };

  const handlePriceChangeForBuy = (newPriceStr: string) => {
    setBuyPrice(newPriceStr);
    const p = parseFloat(newPriceStr);
    const a = parseFloat(buyAmount);
    if (!isNaN(p) && p > 0 && !isNaN(a) && a > 0) {
      setBuyQuantity((a / p).toFixed(6));
    }
  };

  const handleQuantityChangeForBuy = (newQtyStr: string) => {
    setBuyQuantity(newQtyStr);
    const q = parseFloat(newQtyStr);
    const p = parseFloat(buyPrice);
    if (!isNaN(q) && q > 0 && !isNaN(p) && p > 0) {
      setBuyAmount((q * p).toFixed(2));
    }
  };

  const handleBuySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPortfolioId || !buyAssetId) return;

    const qty = parseFloat(buyQuantity);
    const price = parseFloat(buyPrice);
    if (isNaN(qty) || qty <= 0 || isNaN(price) || price <= 0) {
      showToastMsg("Ingresa una cantidad y precio unitario válidos.", "error");
      return;
    }

    setSubmittingBuy(true);
    try {
      const res = await fetchWithAuth(`/api/portfolios/${selectedPortfolioId}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "BUY",
          asset_id: buyAssetId,
          quantity: qty,
          price: price,
          amount: qty * price,
          date: new Date().toISOString(),
          notes: "Nómina ejecutada desde Estrategias",
        }),
      });

      if (res.ok) {
        const txnsRes = await fetchWithAuth(`/api/portfolios/${selectedPortfolioId}/transactions`);
        if (txnsRes.ok) {
          setTransactions(await txnsRes.json());
        }
        setShowBuyModal(false);
        setBuyAssetId(null);
        setBuyQuantity("");
        setBuyPrice("");
        setBuyAmount("");
        showToastMsg("¡Nómina comprada! Monto descontado automáticamente de la reserva.");
      } else {
        const errData = await res.json().catch(() => ({ detail: "Error del servidor" }));
        showToastMsg(errData.detail || "Error al comprar nómina.", "error");
      }
    } catch (err) {
      showToastMsg("Error de conexión al intentar comprar.", "error");
    } finally {
      setSubmittingBuy(false);
    }
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(val);

  const filteredAssetsToSelect = assetsList.filter(
    (a) =>
      !editedItems.some((item) => item.asset_id === a.id) &&
      (a.symbol.toLowerCase().includes(assetSearch.toLowerCase()) ||
        a.name.toLowerCase().includes(assetSearch.toLowerCase())),
  );

  const activeBuyAsset = assetsList.find((a) => a.id === buyAssetId);
  const activeBuyReservedCash = buyAssetId ? assetPositions[buyAssetId]?.savedCash || 0 : 0;

  if (loading && portfolios.length === 0) {
    return (
      <div className="flex items-center justify-center p-12 text-white animate-pulse">
        <Sparkles className="w-6 h-6 text-emerald-400 animate-spin mr-3" />
        Cargando tus estrategias...
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-16 relative">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-8 right-8 z-[100] max-w-md animate-slide-in">
          <div
            className={`flex items-center gap-3 p-4 rounded-2xl border backdrop-blur-md shadow-2xl text-white ${
              toast.type === "success"
                ? "bg-neutral-900/95 border-emerald-500/50 shadow-emerald-500/20"
                : "bg-neutral-900/95 border-rose-500/50 shadow-rose-500/20"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <p className="text-sm font-medium">{toast.message}</p>
            <button onClick={() => setToast(null)} className="ml-auto text-gray-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header with Portfolio Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30">
              <Target className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Estrategia y Presupuesto
            </h1>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            Configura tus montos mensuales y asigna presupuestos por activo con reservas automáticas.
          </p>
        </div>

        {portfolios.length > 0 && (
          <div className="flex items-center gap-3 bg-gray-900/90 border border-gray-800 rounded-2xl px-4 py-2 shadow-lg">
            <Wallet className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-xs text-gray-400 font-medium uppercase">Cartera:</span>
            <select
              value={selectedPortfolioId || ""}
              onChange={(e) => setSelectedPortfolioId(e.target.value)}
              className="bg-transparent text-white font-bold text-sm focus:outline-none cursor-pointer"
            >
              {portfolios.map((p) => (
                <option key={p.id} value={p.id} className="bg-black text-white">
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {portfolios.length === 0 ? (
        <div className="p-8 rounded-2xl bg-gray-900/40 border border-gray-800 text-center space-y-4 max-w-lg mx-auto">
          <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">No tienes carteras creadas</h3>
          <p className="text-sm text-gray-400">
            Debes crear un portafolio desde la sección de Portfolios antes de configurar tu estrategia.
          </p>
        </div>
      ) : (
        <>
          {/* Section 1: Presupuesto y Monto Mensual */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-gray-900/80 via-black to-gray-900/60 border border-white/10 shadow-2xl relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
              <div>
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-white">
                        Presupuesto Mensual Objetivo
                      </h3>
                      <p className="text-xs text-gray-400">
                        Dinero destinado cada mes para invertir en esta cartera
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-6">
                  <div className="relative flex-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">
                      $
                    </span>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={monthlyBudgetInput}
                      onChange={(e) => setMonthlyBudgetInput(e.target.value)}
                      className="w-full bg-black/80 border border-gray-700 focus:border-emerald-500 text-white font-extrabold text-2xl sm:text-3xl pl-10 pr-4 py-3 rounded-2xl focus:outline-none transition-all shadow-inner"
                      placeholder="1000"
                    />
                  </div>
                  <button
                    onClick={handleSaveBudget}
                    disabled={savingBudget}
                    className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm border border-white/10 transition-all shrink-0"
                  >
                    <Save className="w-4 h-4 text-emerald-400" />
                    {savingBudget ? "Guardando..." : "Fijar Monto"}
                  </button>
                </div>
              </div>

              {/* Progress bar info */}
              <div className="mt-8 pt-6 border-t border-white/10 space-y-3">
                <div className="flex justify-between items-center text-xs sm:text-sm">
                  <span className="text-gray-400 font-medium">Asignación de Activos en Estrategia:</span>
                  <span
                    className={`font-bold ${
                      totalAllocatedPct > 100 ? "text-rose-400" : totalAllocatedPct === 100 ? "text-emerald-400" : "text-amber-400"
                    }`}
                  >
                    {totalAllocatedPct.toFixed(2)}% ({formatCurrency(totalAllocatedAmt)}) de{" "}
                    {formatCurrency(currentBudget)}
                  </span>
                </div>
                <div className="w-full h-3 bg-gray-950 rounded-full overflow-hidden border border-gray-800 p-0.5">
                  <div
                    style={{ width: `${Math.min(totalAllocatedPct, 100)}%` }}
                    className={`h-full rounded-full transition-all duration-500 ${
                      totalAllocatedPct > 100
                        ? "bg-rose-500"
                        : totalAllocatedPct === 100
                          ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                          : "bg-amber-400"
                    }`}
                  />
                </div>
                {totalAllocatedPct > 100 && (
                  <p className="text-xs text-rose-400 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> La asignación supera el 100% del presupuesto.
                  </p>
                )}
              </div>
            </div>

            {/* Action Card: Deposit Strategy Budget */}
            <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-emerald-950/40 via-black to-gray-900/80 border border-emerald-500/30 shadow-2xl flex flex-col justify-between relative overflow-hidden">
              <div className="absolute -right-12 -top-12 w-44 h-44 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <PieChart className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      Depósito Automático
                    </h3>
                    <p className="text-xs text-emerald-400/80 font-medium">
                      Distribución al instante por porcentaje
                    </p>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                  Al depositar, el monto se divide automáticamente entre tus acciones o CEDEARs según su porcentaje y queda reservado en su billetera listos para comprar.
                </p>
              </div>

              <div className="mt-6 pt-6 border-t border-emerald-500/20 space-y-3">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Monto a distribuir:</span>
                  <span className="text-white font-bold">{formatCurrency(currentBudget)}</span>
                </div>
                <button
                  onClick={() => setShowDepositModal(true)}
                  disabled={depositing || currentBudget <= 0}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-4 h-4 fill-slate-950" />
                  {depositing ? "Procesando..." : "Depositar y Reservar Dinero"}
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Configuración de la Estrategia */}
          <div className="p-6 sm:p-8 rounded-3xl bg-black border border-white/10 shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  Distribución Objetivo de Activos
                </h3>
                <p className="text-xs sm:text-sm text-gray-400">
                  Ajusta el porcentaje (%) o monto fijo ($) para cada nómina. Al guardar, se aplicará al próximo depósito.
                </p>
              </div>
              <div className="flex items-center gap-3">
                {hasUnsavedChanges && (
                  <button
                    onClick={handleSaveStrategy}
                    disabled={savingStrategy}
                    className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm transition flex items-center gap-2 shadow-lg shadow-emerald-500/20 animate-pulse"
                  >
                    <Save className="w-4 h-4" />
                    {savingStrategy ? "Guardando..." : "Guardar Cambios"}
                  </button>
                )}
                <button
                  onClick={() => setShowAddAssetModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-semibold text-xs sm:text-sm border border-gray-700 transition flex items-center gap-2"
                >
                  <Plus className="w-4 h-4 text-emerald-400" />
                  Añadir Activo
                </button>
              </div>
            </div>

            {editedItems.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-gray-950 border border-dashed border-gray-800 space-y-3">
                <Target className="w-10 h-10 text-gray-600 mx-auto" />
                <p className="text-sm font-semibold text-gray-400">
                  Tu estrategia aún no tiene activos configurados.
                </p>
                <button
                  onClick={() => setShowAddAssetModal(true)}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold text-xs border border-emerald-500/30 transition inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Añadir primer activo
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-gray-800 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      <th className="pb-4 pl-3">Activo / CEDEAR</th>
                      <th className="pb-4 px-3 w-36">Porcentaje (%)</th>
                      <th className="pb-4 px-3 w-40">Monto Asignado ($)</th>
                      <th className="pb-4 px-3 w-44">Reserva Disponible</th>
                      <th className="pb-4 px-3 w-40">Total Invertido</th>
                      <th className="pb-4 pr-3 text-right">Acción Rápida</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-900">
                    {editedItems.map((item, index) => {
                      const pos = assetPositions[item.asset_id] || {
                        savedCash: 0,
                        quantity: 0,
                        totalCost: 0,
                      };
                      return (
                        <tr key={item.asset_id} className="hover:bg-gray-950/60 transition-colors">
                          <td className="py-4 pl-3">
                            <div className="flex items-center gap-3">
                              <span className="px-2.5 py-1 rounded-lg bg-gray-900 border border-gray-800 text-white font-extrabold text-xs">
                                {item.symbol}
                              </span>
                              <div>
                                <p className="font-bold text-white text-sm">{item.name}</p>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-3">
                            <div className="relative">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                value={item.percentage}
                                onChange={(e) => handlePercentageChange(index, e.target.value)}
                                className="w-full bg-black border border-gray-800 focus:border-emerald-500 text-white font-bold text-sm px-3 py-2 rounded-xl pr-8 focus:outline-none transition"
                                placeholder="0"
                              />
                              <Percent className="w-3.5 h-3.5 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                          </td>

                          <td className="py-4 px-3">
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">
                                $
                              </span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.target_amount}
                                onChange={(e) => handleAmountChange(index, e.target.value)}
                                className="w-full bg-black border border-gray-800 focus:border-emerald-500 text-white font-bold text-sm pl-7 pr-3 py-2 rounded-xl focus:outline-none transition"
                                placeholder="0.00"
                              />
                            </div>
                          </td>

                          <td className="py-4 px-3">
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-extrabold text-sm ${
                                  pos.savedCash > 0 ? "text-emerald-400" : "text-gray-500"
                                }`}
                              >
                                {formatCurrency(pos.savedCash)}
                              </span>
                              {pos.savedCash > 0 && (
                                <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-1.5 py-0.5 rounded-md font-bold">
                                  Listo para comprar
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-4 px-3">
                            <div>
                              <p className="text-sm font-bold text-white">
                                {formatCurrency(pos.totalCost)}
                              </p>
                              <p className="text-[11px] text-gray-500">
                                {Number(pos.quantity).toFixed(4)} nominales
                              </p>
                            </div>
                          </td>

                          <td className="py-4 pr-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openBuyModalForAsset(item.asset_id)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 font-bold text-xs border border-emerald-500/30 transition flex items-center gap-1.5"
                                title="Ejecutar Compra con Reserva"
                              >
                                <TrendingUp className="w-3.5 h-3.5" />
                                Comprar
                              </button>
                              <button
                                onClick={() => handleRemoveFromStrategy(item.asset_id)}
                                className="p-2 rounded-xl text-gray-500 hover:text-rose-400 hover:bg-gray-900 transition"
                                title="Quitar de estrategia"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal: Add Asset to Strategy */}
      {showAddAssetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-black border border-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-in">
            <div className="flex justify-between items-center p-5 border-b border-gray-800">
              <h3 className="text-lg font-bold text-white">Añadir Activo a Estrategia</h3>
              <button
                onClick={() => setShowAddAssetModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 border-b border-gray-800 bg-gray-950 flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={assetSearch}
                onChange={(e) => setAssetSearch(e.target.value)}
                placeholder="Buscar por símbolo o nombre..."
                className="bg-transparent border-none text-white text-sm w-full focus:outline-none"
                autoFocus
              />
            </div>
            <div className="max-h-72 overflow-y-auto divide-y divide-gray-900">
              {filteredAssetsToSelect.length > 0 ? (
                filteredAssetsToSelect.map((a) => (
                  <div
                    key={a.id}
                    onClick={() => handleAddAssetToStrategy(a)}
                    className="p-4 flex items-center justify-between hover:bg-gray-900 cursor-pointer transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-md bg-gray-800 text-white font-bold text-xs">
                        {a.symbol}
                      </span>
                      <span className="text-sm text-gray-300 font-medium">{a.name}</span>
                    </div>
                    <Plus className="w-4 h-4 text-emerald-400" />
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-sm text-gray-500">
                  No se encontraron activos o ya están agregados.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Deposit Budget Confirmation */}
      {showDepositModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-black border border-emerald-500/30 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-in">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                <PieChart className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-white">Depositar Presupuesto</h3>
                <p className="text-xs text-gray-400 mt-1">
                  El dinero se reservará en cada activo de tu estrategia listo para comprar nóminas.
                </p>
              </div>

              <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 text-left space-y-2">
                <label className="block text-xs uppercase text-gray-400 font-bold">
                  Monto Total a Ingresar ($)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={customDepositAmount || monthlyBudgetInput}
                    onChange={(e) => setCustomDepositAmount(e.target.value)}
                    className="w-full bg-black border border-gray-700 text-white font-extrabold text-lg pl-8 pr-4 py-2 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-gray-500">
                  Por defecto utiliza el presupuesto mensual de {formatCurrency(currentBudget)}.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setShowDepositModal(false)}
                  className="flex-1 py-3 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 font-bold text-sm transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDepositStrategy}
                  disabled={depositing}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-extrabold text-sm hover:from-emerald-400 hover:to-teal-400 transition shadow-lg shadow-emerald-500/20"
                >
                  {depositing ? "Procesando..." : "Confirmar Depósito"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Quick Buy Nominal */}
      {showBuyModal && activeBuyAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-black border border-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-in">
            <div className="flex justify-between items-center p-5 border-b border-gray-800 bg-gradient-to-r from-gray-950 to-black">
              <div>
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                  Ejecutar Nómina
                </span>
                <h3 className="text-lg font-bold text-white flex items-center gap-2 mt-0.5">
                  Comprar {activeBuyAsset.symbol}
                </h3>
              </div>
              <button
                onClick={() => setShowBuyModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBuySubmit} className="p-5 space-y-4">
              {/* Reserved Cash Banner */}
              <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                      Reserva Disponible en Estrategia
                    </p>
                    <p className="text-sm font-extrabold text-white">
                      {formatCurrency(activeBuyReservedCash)}
                    </p>
                  </div>
                </div>
                {activeBuyReservedCash > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setBuyAmount(activeBuyReservedCash.toFixed(2));
                      if (buyPrice && parseFloat(buyPrice) > 0) {
                        setBuyQuantity((activeBuyReservedCash / parseFloat(buyPrice)).toFixed(6));
                      }
                    }}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition shadow-sm"
                  >
                    Usar Todo
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 font-bold mb-1.5">
                  Precio Unitario ($)
                </label>
                <input
                  type="number"
                  step="0.00000001"
                  min="0.00000001"
                  value={buyPrice}
                  onChange={(e) => handlePriceChangeForBuy(e.target.value)}
                  placeholder="Ej: 150.00"
                  className="w-full bg-black border border-gray-800 text-white font-bold text-sm rounded-xl p-3 focus:outline-none focus:border-emerald-500 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 font-bold mb-1.5">
                  Monto Total a Invertir ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={buyAmount}
                  onChange={(e) => {
                    setBuyAmount(e.target.value);
                    const a = parseFloat(e.target.value);
                    const p = parseFloat(buyPrice);
                    if (!isNaN(a) && a > 0 && !isNaN(p) && p > 0) {
                      setBuyQuantity((a / p).toFixed(6));
                    }
                  }}
                  placeholder="0.00"
                  className="w-full bg-black border border-gray-800 text-white font-bold text-sm rounded-xl p-3 focus:outline-none focus:border-emerald-500 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 font-bold mb-1.5">
                  Cantidad (Nominales calculados)
                </label>
                <input
                  type="number"
                  step="0.00000001"
                  min="0.00000001"
                  value={buyQuantity}
                  onChange={(e) => handleQuantityChangeForBuy(e.target.value)}
                  placeholder="0.0000"
                  className="w-full bg-gray-950 border border-gray-800 text-gray-300 font-medium text-sm rounded-xl p-3 focus:outline-none focus:border-emerald-500 transition"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submittingBuy}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-extrabold text-sm hover:from-emerald-400 hover:to-teal-400 transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  <TrendingUp className="w-4 h-4" />
                  {submittingBuy ? "Procesando..." : "Confirmar Compra y Descontar de Reserva"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

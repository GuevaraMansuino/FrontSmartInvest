import React, { useEffect, useState } from "react";
import {
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  History,
  LayoutGrid,
  List,
  Plus,
  X,
  Search,
  Check,
  Edit2,
  Trash2,
  ArrowRightLeft,
  Coins,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { getApiUrl } from "../utils/api";
import { fetchWithAuth } from "../utils/apiClient";
import { useAuth } from "../context/AuthContext";

interface Portfolio {
  id: string;
  name: string;
  created_at: string;
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

interface AssetSummary {
  asset_id: string;
  symbol: string;
  name: string;
  quantity: number;
  totalCost: number;
  savedCash: number;
  transactions: Transaction[];
}

interface AssetDef {
  id: string;
  symbol: string;
  name: string;
}

export default function Portfolios() {
  const { isAuthenticated, setAuthModalOpen } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 rounded-2xl bg-black border border-white/20 text-center space-y-6">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
          <Wallet className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white">
            Para acceder a Portfolios debes iniciar sesión
          </h2>
          <p className="text-sm text-gray-400">
            Inicia sesión o crea tu cuenta gratuita para administrar tus
            carteras, registrar compras y hacer seguimiento de tu patrimonio.
          </p>
        </div>
        <button
          onClick={() => setAuthModalOpen(true)}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-sm hover:from-emerald-400 hover:to-teal-400 transition"
        >
          Iniciar Sesión
        </button>
      </div>
    );
  }

  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(
    null,
  );
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "history">("grid");

  const [assetsList, setAssetsList] = useState<AssetDef[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formAssetId, setFormAssetId] = useState("");
  const [formQuantity, setFormQuantity] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formType, setFormType] = useState<"BUY" | "DEPOSIT">("BUY");

  const [assetSearch, setAssetSearch] = useState("");
  const [assetDropdownOpen, setAssetDropdownOpen] = useState(false);
  const [editingTxnId, setEditingTxnId] = useState<string | null>(null);

  // Manage Reserve Modal
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [reserveModalAssetId, setReserveModalAssetId] = useState<string | null>(null);
  const [reserveAction, setReserveAction] = useState<"TO_GLOBAL" | "TO_ASSET" | "CLEAR">("TO_GLOBAL");
  const [reserveAmount, setReserveAmount] = useState<string>("");
  const [reserveTargetAssetId, setReserveTargetAssetId] = useState<string>("");
  const [submittingReserve, setSubmittingReserve] = useState(false);

  const filteredAssets = assetsList.filter(
    (a) =>
      a.symbol.toLowerCase().includes(assetSearch.toLowerCase()) ||
      a.name.toLowerCase().includes(assetSearch.toLowerCase()),
  );

  const handleSelectAsset = (id: string) => {
    setFormAssetId(id);
    setAssetDropdownOpen(false);
    setAssetSearch("");
    const resCash = id ? assetSummaries[id]?.savedCash || 0 : 0;
    if (resCash > 0 && formType === "BUY") {
      setFormAmount(resCash.toFixed(2));
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchWithAuth("/api/portfolios")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          if (data.length > 0) {
            setPortfolios(data);
            setSelectedPortfolioId(data[0].id);
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
                }
                setLoading(false);
              })
              .catch(() => setLoading(false));
          }
        } else {
          setPortfolios([]);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });

    fetchWithAuth("/api/assets")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setAssetsList(data);
        } else {
          setAssetsList([]);
        }
      })
      .catch((err) => console.error(err));
  }, [isAuthenticated]);

  useEffect(() => {
    if (selectedPortfolioId) {
      setLoading(true);
      fetchWithAuth(`/api/portfolios/${selectedPortfolioId}/transactions`)
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          if (Array.isArray(data)) {
            setTransactions(data);
          } else {
            setTransactions([]);
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [selectedPortfolioId]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let activePortfolioId = selectedPortfolioId;
    if (!activePortfolioId) {
      try {
        const createRes = await fetchWithAuth("/api/portfolios", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Mi Portafolio Principal" }),
        });
        if (createRes.ok) {
          const newPortfolio = await createRes.json();
          activePortfolioId = newPortfolio.id;
          setPortfolios((prev) => [...prev, newPortfolio]);
          setSelectedPortfolioId(newPortfolio.id);
        } else {
          alert(
            "No tienes un portafolio seleccionado y ocurrió un error al crearlo automáticamente.",
          );
          return;
        }
      } catch (err) {
        console.error("Error al crear portafolio inicial:", err);
        alert("Error de conexión al crear tu portafolio.");
        return;
      }
    }

    if (formType === "BUY" && !formAssetId) {
      alert("Por favor selecciona un activo para comprar.");
      return;
    }

    const qty = parseFloat(formQuantity || "0");
    const price = parseFloat(formPrice || "0");
    const overrideAmount = parseFloat(formAmount || "0");

    if (
      formType === "BUY" &&
      (isNaN(qty) || qty <= 0 || isNaN(price) || price <= 0)
    ) {
      alert("Por favor ingresa una cantidad y precio válidos mayores a 0.");
      return;
    }
    if (
      formType === "DEPOSIT" &&
      (isNaN(overrideAmount) || overrideAmount <= 0)
    ) {
      alert("Por favor ingresa un monto válido mayor a 0 para reservar.");
      return;
    }

    setSubmitting(true);
    const isEditing = !!editingTxnId;

    const payload = isEditing
      ? {
          amount: formType === "BUY" ? qty * price : overrideAmount,
          quantity: formType === "BUY" ? qty : null,
          price: formType === "BUY" ? price : null,
        }
      : {
          type: formType,
          date: new Date().toISOString(),
          amount: formType === "BUY" ? qty * price : overrideAmount,
          asset_id: formAssetId || null,
          quantity: formType === "BUY" ? qty : null,
          price: formType === "BUY" ? price : null,
        };

    const url = isEditing
      ? `/api/portfolios/${activePortfolioId}/transactions/${editingTxnId}`
      : `/api/portfolios/${activePortfolioId}/transactions`;

    try {
      const res = await fetchWithAuth(url, {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const txnsRes = await fetchWithAuth(
          `/api/portfolios/${activePortfolioId}/transactions`,
        );
        const txnsData = await txnsRes.json();
        if (Array.isArray(txnsData)) {
          setTransactions(txnsData);
        } else {
          setTransactions([]);
        }
        setShowAddModal(false);
        setEditingTxnId(null);
        setFormQuantity("");
        setFormPrice("");
        setFormAmount("");
        setFormAssetId("");
      } else {
        const errorData = await res
          .json()
          .catch(() => ({ detail: "Error en el servidor" }));
        alert(`Error al guardar: ${errorData.detail || "Ocurrió un error"}`);
      }
    } catch (err) {
      console.error(err);
      alert("Error de conexión al intentar guardar.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (txn: Transaction) => {
    setEditingTxnId(txn.id);
    setFormAssetId(txn.asset_id || "");
    setFormType(txn.type === "DEPOSIT" ? "DEPOSIT" : "BUY");
    setFormQuantity(txn.quantity ? Number(txn.quantity).toString() : "");
    setFormPrice(txn.price ? Number(txn.price).toString() : "");
    setFormAmount(txn.amount ? Number(txn.amount).toString() : "");
    setShowAddModal(true);
  };

  const handleDeleteTxn = async (txnId: string) => {
    if (
      !selectedPortfolioId ||
      !window.confirm("¿Estás seguro de que quieres eliminar esta transacción?")
    )
      return;
    try {
      const res = await fetchWithAuth(
        `/api/portfolios/${selectedPortfolioId}/transactions/${txnId}`,
        { method: "DELETE" },
      );
      if (res.ok) {
        setTransactions(transactions.filter((t) => t.id !== txnId));
      } else {
        alert("Error al eliminar");
      }
    } catch {
      alert("Error de conexión al intentar eliminar");
    }
  };

  const openReserveModal = (
    assetId: string | null,
    defaultAction: "TO_GLOBAL" | "TO_ASSET" | "CLEAR" = "TO_GLOBAL",
  ) => {
    const cleanAssetId = assetId === "wallet-cash-global" ? null : assetId;
    setReserveModalAssetId(cleanAssetId);
    setReserveAction(defaultAction);
    const available = cleanAssetId
      ? assetSummaries[cleanAssetId]?.savedCash || 0
      : globalReservedCash;
    setReserveAmount(available > 0 ? available.toFixed(2) : "");

    const other = assetsList.find((a) => a.id !== cleanAssetId);
    setReserveTargetAssetId(other ? other.id : "");
    setShowReserveModal(true);
  };

  const handleManageReserveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPortfolioId) return;

    const amt = parseFloat(reserveAmount);
    if (reserveAction !== "CLEAR" && (isNaN(amt) || amt <= 0)) {
      alert("Ingresa un monto válido mayor a $0.");
      return;
    }
    if (reserveAction === "TO_ASSET" && !reserveTargetAssetId) {
      alert("Selecciona el activo de destino.");
      return;
    }

    setSubmittingReserve(true);
    try {
      const payload: {
        action: string;
        source_asset_id: string | null;
        target_asset_id?: string | null;
        amount: number | null;
      } = {
        action: reserveAction,
        source_asset_id: reserveModalAssetId,
        amount: !isNaN(amt) && amt > 0 ? amt : null,
      };
      if (reserveAction === "TO_ASSET") {
        payload.target_asset_id = reserveTargetAssetId;
      }

      const res = await fetchWithAuth(
        `/api/portfolios/${selectedPortfolioId}/strategy/reserves/manage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (res.ok) {
        const txnsRes = await fetchWithAuth(
          `/api/portfolios/${selectedPortfolioId}/transactions`,
        );
        if (txnsRes.ok) {
          setTransactions(await txnsRes.json());
        }
        setShowReserveModal(false);
      } else {
        const errData = await res
          .json()
          .catch(() => ({ detail: "Error del servidor" }));
        alert(errData.detail || "Error al gestionar la reserva.");
      }
    } catch {
      alert("Error de conexión al gestionar la reserva.");
    } finally {
      setSubmittingReserve(false);
    }
  };

  const assetSummaries: Record<string, AssetSummary> = {};

  const getOrCreateAsset = (txn: Transaction, id: string) => {
    if (!assetSummaries[id]) {
      assetSummaries[id] = {
        asset_id: id,
        symbol:
          txn.asset_symbol ||
          (id === "wallet-cash-global" ? "BILLETERA" : "ACTIVO"),
        name:
          txn.asset_name ||
          txn.asset_symbol ||
          (id === "wallet-cash-global" ? "Liquidez General" : "Activo"),
        quantity: 0,
        totalCost: 0,
        savedCash: 0,
        transactions: [],
      };
    }
    return assetSummaries[id];
  };

  const sortedTxns = [...transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  let globalReservedCash = 0;

  sortedTxns.forEach((txn) => {
    const amount = Number(txn.amount || 0);
    const qty = Number(txn.quantity || 0);

    if (txn.type === "DEPOSIT") {
      if (txn.asset_id) {
        const asset = getOrCreateAsset(txn, txn.asset_id);
        asset.savedCash += amount;
        asset.transactions.push(txn);
      } else {
        globalReservedCash += amount;
      }
    } else if (txn.type === "WITHDRAW") {
      if (txn.asset_id) {
        const asset = getOrCreateAsset(txn, txn.asset_id);
        asset.savedCash = Math.max(0, asset.savedCash - amount);
        asset.transactions.push(txn);
      } else {
        globalReservedCash = Math.max(0, globalReservedCash - amount);
      }
    } else if (txn.type === "BUY") {
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
    } else if (txn.type === "SELL") {
      if (!txn.asset_id) return;
      const asset = getOrCreateAsset(txn, txn.asset_id);
      asset.quantity = Math.max(0, asset.quantity - qty);
      asset.totalCost = Math.max(0, asset.totalCost - amount);
      asset.transactions.push(txn);
    }
  });

  if (globalReservedCash > 0) {
    if (!assetSummaries["wallet-cash-global"]) {
      assetSummaries["wallet-cash-global"] = {
        asset_id: "wallet-cash-global",
        symbol: "BILLETERA",
        name: "Liquidez General",
        quantity: 0,
        totalCost: 0,
        savedCash: globalReservedCash,
        transactions: [],
      };
    } else {
      assetSummaries["wallet-cash-global"].savedCash = globalReservedCash;
    }
  } else {
    delete assetSummaries["wallet-cash-global"];
  }

  const assets = Object.values(assetSummaries).filter(
    (a) => a.quantity > 0 || a.savedCash > 0,
  );
  const totalInvertido = assets.reduce((acc, a) => acc + a.totalCost, 0);
  const totalGuardado = assets.reduce((acc, a) => acc + a.savedCash, 0);
  const totalWalletValue = totalInvertido + totalGuardado;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(val);
  };

  const getAverageBuyPrice = (asset: AssetSummary) => {
    const buyTxns = asset.transactions.filter((t) => t.type === "BUY");
    const totalQty = buyTxns.reduce(
      (sum, t) => sum + Number(t.quantity || 0),
      0,
    );
    const totalCost = buyTxns.reduce(
      (sum, t) => sum + Number(t.amount || 0),
      0,
    );
    return totalQty > 0 ? totalCost / totalQty : 0;
  };

  if (loading && portfolios.length === 0) {
    return (
      <div className="text-white p-8 animate-pulse">
        Cargando portafolios...
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in relative">
      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-black border border-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-in">
            <div className="flex justify-between items-center p-5 border-b border-gray-800">
              <h2 className="text-xl font-bold text-white">
                {editingTxnId ? "Editar Operación" : "Registrar Nómina"}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingTxnId(null);
                  setFormAssetId("");
                  setFormQuantity("");
                  setFormPrice("");
                  setFormAmount("");
                }}
                className="text-gray-400 hover:text-white transition-colors"
                title="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-5 space-y-4">
              {!editingTxnId && (
                <div className="flex bg-gray-900 rounded-lg p-1.5 mb-2">
                  <button
                    type="button"
                    onClick={() => setFormType("BUY")}
                    className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-colors ${formType === "BUY" ? "bg-black text-white border border-gray-700 shadow-sm" : "text-gray-500 hover:text-white"}`}
                  >
                    Comprar Nóminas
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormType("DEPOSIT")}
                    className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-colors ${formType === "DEPOSIT" ? "bg-black text-white border border-gray-700 shadow-sm" : "text-gray-500 hover:text-white"}`}
                  >
                    Guardar Plata
                  </button>
                </div>
              )}

              <div className="relative">
                <label className="block text-xs uppercase tracking-wider text-gray-400 font-medium mb-2">
                  Activo
                </label>
                <div
                  className={`w-full bg-black border border-gray-700 rounded-lg p-3 text-sm flex justify-between items-center transition-colors ${editingTxnId ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-gray-500"}`}
                  onClick={() =>
                    !editingTxnId && setAssetDropdownOpen(!assetDropdownOpen)
                  }
                >
                  <span
                    className={
                      formAssetId ? "text-white font-medium" : "text-gray-500"
                    }
                  >
                    {formAssetId
                      ? (() => {
                          const a = assetsList.find(
                            (x) => x.id === formAssetId,
                          );
                          return a
                            ? `${a.symbol} - ${a.name}`
                            : "Activo seleccionado";
                        })()
                      : formType === "DEPOSIT"
                        ? "Ninguno (Billetera General)"
                        : "Selecciona un activo..."}
                  </span>
                  <Search className="w-4 h-4 text-gray-500" />
                </div>

                {assetDropdownOpen && (
                  <div className="absolute z-10 w-full mt-2 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden animate-fade-in">
                    <div className="p-3 border-b border-gray-800 flex items-center gap-2 bg-black">
                      <Search className="w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        className="bg-transparent border-none text-white w-full text-sm focus:outline-none"
                        placeholder="Buscar por símbolo o nombre..."
                        value={assetSearch}
                        onChange={(e) => setAssetSearch(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {formType === "DEPOSIT" && (
                        <div
                          className={`p-3 text-sm cursor-pointer hover:bg-gray-800 flex justify-between items-center transition-colors ${!formAssetId ? "bg-gray-800" : ""}`}
                          onClick={() => handleSelectAsset("")}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white bg-blue-900/50 px-2 py-1 rounded">
                              EFECTIVO
                            </span>
                            <span className="text-gray-400">
                              Liquidez General (Sin activo)
                            </span>
                          </div>
                          {!formAssetId && (
                            <Check className="w-4 h-4 text-white" />
                          )}
                        </div>
                      )}
                      {filteredAssets.length > 0 ? (
                        filteredAssets.map((a) => (
                          <div
                            key={a.id}
                            className={`p-3 text-sm cursor-pointer hover:bg-gray-800 flex justify-between items-center transition-colors ${formAssetId === a.id ? "bg-gray-800" : ""}`}
                            onClick={() => handleSelectAsset(a.id)}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white bg-gray-800 px-2 py-1 rounded">
                                {a.symbol}
                              </span>
                              <span className="text-gray-400">{a.name}</span>
                            </div>
                            {formAssetId === a.id && (
                              <Check className="w-4 h-4 text-white" />
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-sm text-gray-500">
                          Ningún activo coincide
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {editingTxnId && (
                  <p className="text-[10px] text-gray-500 mt-1">
                    El activo no se puede cambiar al editar.
                  </p>
                )}
              </div>

              {formType === "BUY" && formAssetId && (
                <div className="space-y-2 my-3">
                  {(assetSummaries[formAssetId]?.savedCash || 0) > 0 && (
                    <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between gap-3 animate-fade-in">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                          <Check className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                            Reserva de {assetSummaries[formAssetId].symbol}
                          </p>
                          <p className="text-sm font-extrabold text-white">
                            {formatCurrency(assetSummaries[formAssetId].savedCash)}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const resAmt = assetSummaries[formAssetId].savedCash;
                          setFormAmount(resAmt.toFixed(2));
                          if (formPrice && parseFloat(formPrice) > 0) {
                            setFormQuantity((resAmt / parseFloat(formPrice)).toFixed(6));
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition shadow-sm shrink-0"
                      >
                        Usar Reserva
                      </button>
                    </div>
                  )}

                  {globalReservedCash > 0 && (
                    <div className="p-3 rounded-xl bg-sky-950/30 border border-sky-500/20 flex items-center justify-between gap-3 animate-fade-in">
                      <div className="flex items-center gap-2">
                        <Coins className="w-4 h-4 text-sky-400 shrink-0" />
                        <div>
                          <p className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">
                            Fondo General Disponible
                          </p>
                          <p className="text-xs font-bold text-white">
                            {formatCurrency(globalReservedCash)}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const assetRes = assetSummaries[formAssetId]?.savedCash || 0;
                          const totalAvail = assetRes + globalReservedCash;
                          setFormAmount(totalAvail.toFixed(2));
                          if (formPrice && parseFloat(formPrice) > 0) {
                            setFormQuantity((totalAvail / parseFloat(formPrice)).toFixed(6));
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 font-bold text-xs transition shrink-0"
                      >
                        Usar Total (+ Fondo)
                      </button>
                    </div>
                  )}
                </div>
              )}

              {formType === "BUY" ? (
                <>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-400 font-medium mb-2">
                      Cantidad (Nóminas)
                    </label>
                    <input
                      type="number"
                      step="0.00001"
                      min="0.00001"
                      className="w-full bg-black border border-gray-700 text-white rounded-lg p-3 text-sm focus:outline-none focus:border-white transition-colors"
                      placeholder="Ej: 10"
                      value={formQuantity}
                      onChange={(e) => setFormQuantity(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-400 font-medium mb-2">
                      Precio de Compra por Nómina
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      className="w-full bg-black border border-gray-700 text-white rounded-lg p-3 text-sm focus:outline-none focus:border-white transition-colors"
                      placeholder="Ej: 450.50"
                      value={formPrice}
                      onChange={(e) => {
                        setFormPrice(e.target.value);
                        const p = parseFloat(e.target.value);
                        const a = parseFloat(formAmount);
                        if (!isNaN(p) && p > 0 && !isNaN(a) && a > 0) {
                          setFormQuantity((a / p).toFixed(6));
                        }
                      }}
                      required
                    />
                  </div>

                  <div className="bg-gray-900/50 p-4 rounded-lg flex justify-between items-center mt-4">
                    <span className="text-sm text-gray-400">
                      Total a invertir
                    </span>
                    <span className="text-lg font-bold text-white">
                      {formatCurrency(
                        parseFloat(formQuantity || "0") * parseFloat(formPrice || "0") || parseFloat(formAmount || "0"),
                      )}
                    </span>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-400 font-medium mb-2">
                    Monto a Guardar ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="w-full bg-black border border-gray-700 text-white rounded-lg p-3 text-sm focus:outline-none focus:border-white transition-colors"
                    placeholder="Ej: 1000.00"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    required
                  />
                  <div className="bg-gray-900/50 p-4 rounded-lg flex justify-between items-center mt-4">
                    <span className="text-sm text-gray-400">
                      Total a reservar
                    </span>
                    <span className="text-lg font-bold text-white">
                      {formatCurrency(parseFloat(formAmount || "0"))}
                    </span>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingTxnId(null);
                      setFormAssetId("");
                      setFormQuantity("");
                      setFormPrice("");
                      setFormAmount("");
                    }}
                    className="flex-1 py-3 px-4 border border-gray-700 text-white rounded-lg font-medium hover:bg-gray-900 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-3 px-4 bg-white text-black rounded-lg font-bold hover:bg-gray-200 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                  >
                    {submitting ? "Guardando..." : "Guardar"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            Mi Billetera
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">
            Resumen de tus activos y transacciones
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3">
          {portfolios.length > 1 && (
            <select
              className="bg-black border border-gray-700 text-white rounded-lg p-2 text-xs sm:text-sm focus:outline-none focus:border-white transition-colors"
              value={selectedPortfolioId || ""}
              onChange={(e) => setSelectedPortfolioId(e.target.value)}
            >
              {portfolios.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => openReserveModal(null, "TO_ASSET")}
            className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-900 hover:bg-gray-800 text-white text-xs sm:text-sm font-bold rounded-lg border border-gray-700 transition-all hover:scale-[1.02]"
            title="Reasignar fondos entre acciones, al fondo general o borrar reservas"
          >
            <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
            Gestionar Reservas
          </button>

          <button
            onClick={() => {
              setEditingTxnId(null);
              setFormAssetId("");
              setFormQuantity("");
              setFormPrice("");
              setFormAmount("");
              setFormType("BUY");
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-white text-black text-xs sm:text-sm font-bold rounded-lg hover:bg-gray-200 transition-all hover:scale-[1.02] shadow-lg shadow-white/10"
          >
            <Plus className="w-4 h-4" />
            Ingresar Nómina
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-black rounded-xl p-5 sm:p-6 border border-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-40 transition-opacity">
            <Wallet className="w-16 h-16 text-white" />
          </div>
          <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">
            Total de Billetera
          </p>
          <p className="text-2xl sm:text-3xl font-black text-white">
            {formatCurrency(totalWalletValue)}
          </p>
        </div>
        <div className="bg-black rounded-xl p-5 sm:p-6 border border-gray-800">
          <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">
            Total Invertido
          </p>
          <p className="text-2xl sm:text-3xl font-black text-green-400">
            {formatCurrency(totalInvertido)}
          </p>
        </div>
        <div className="bg-black rounded-xl p-5 sm:p-6 border border-gray-800">
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Plata Reservada
            </p>
            {globalReservedCash > 0 && (
              <span className="text-[10px] bg-sky-500/10 border border-sky-500/30 text-sky-400 px-2 py-0.5 rounded-full font-bold">
                {formatCurrency(globalReservedCash)} General
              </span>
            )}
          </div>
          <p className="text-2xl sm:text-3xl font-black text-blue-400">
            {formatCurrency(totalGuardado)}
          </p>
        </div>
      </div>

      {/* Tabs / Filters */}
      <div className="flex items-center gap-4 border-b border-gray-800 pb-2">
        <button
          onClick={() => setViewMode("grid")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2 ${viewMode === "grid" ? "text-white border-white" : "text-gray-500 hover:text-gray-300 border-transparent"}`}
        >
          <LayoutGrid className="w-4 h-4" />
          Activos
        </button>
        <button
          onClick={() => setViewMode("history")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2 ${viewMode === "history" ? "text-white border-white" : "text-gray-500 hover:text-gray-300 border-transparent"}`}
        >
          <History className="w-4 h-4" />
          Historial de Operaciones
        </button>
      </div>

      {/* Asssets Grid View */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {assets.map((asset) => {
            const avgPrice = getAverageBuyPrice(asset);
            const liquidez = asset.savedCash;
            const isComprado = asset.quantity > 0;
            return (
              <div
                key={asset.asset_id}
                className="bg-black border border-white rounded-xl p-5 hover:border-gray-400 transition-all hover:shadow-lg group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span
                      className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${isComprado ? "text-green-400 bg-green-900/30 border-green-800" : "text-blue-400 bg-blue-900/30 border-blue-800"} mb-2 inline-block`}
                    >
                      {isComprado ? "COMPRA" : "RESERVA"}
                    </span>
                    <h3 className="text-lg font-bold text-white group-hover:text-gray-200">
                      {asset.symbol}
                    </h3>
                    <p className="text-xs text-gray-500 truncate max-w-[150px]">
                      {asset.name}
                    </p>
                  </div>
                  <div className="text-right">
                    {isComprado ? (
                      <>
                        <p className="text-2xl font-black text-white">
                          {Number(asset.quantity)}
                        </p>
                        <p className="text-[10px] uppercase tracking-wider text-gray-500 mt-1">
                          Nóminas
                        </p>
                      </>
                    ) : (
                      <p className="text-2xl font-bold text-blue-400 pt-1">-</p>
                    )}
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-gray-800">
                  {isComprado && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">
                          Total Invertido
                        </span>
                        <span className="text-sm font-bold text-white">
                          {formatCurrency(asset.totalCost)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">
                          Precio Prom. Compra
                        </span>
                        <span className="text-sm font-medium text-gray-300">
                          {formatCurrency(avgPrice)}
                        </span>
                      </div>
                    </>
                  )}
                  {(liquidez > 0 || !isComprado) && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">
                        Plata Reservada
                      </span>
                      <span className="text-sm font-bold text-emerald-400">
                        {formatCurrency(liquidez)}
                      </span>
                    </div>
                  )}
                  {liquidez > 0 && (
                    asset.asset_id === "wallet-cash-global" ? (
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => openReserveModal(null, "TO_ASSET")}
                          className="flex-1 py-2 px-3 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 font-bold text-xs border border-sky-500/30 transition flex items-center justify-center gap-1.5"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          Distribuir a Nómina
                        </button>
                        <button
                          onClick={() => openReserveModal(null, "CLEAR")}
                          className="py-2 px-3 rounded-xl bg-gray-900 hover:bg-rose-500/20 text-gray-400 hover:text-rose-300 font-semibold text-xs border border-gray-800 transition flex items-center justify-center gap-1.5"
                          title="Liberar o vaciar fondo general"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Vaciar
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2 mt-2">
                        <button
                          onClick={() => {
                            setEditingTxnId(null);
                            setFormAssetId(asset.asset_id);
                            setFormType("BUY");
                            setFormAmount(liquidez.toString());
                            setFormQuantity("");
                            setFormPrice("");
                            setShowAddModal(true);
                          }}
                          className="w-full py-2 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 font-bold text-xs border border-emerald-500/30 transition flex items-center justify-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Comprar Nómina con Reserva ({formatCurrency(liquidez)})
                        </button>
                        <div className="flex gap-2">
                          <button
                            onClick={() => openReserveModal(asset.asset_id, "TO_GLOBAL")}
                            className="flex-1 py-1.5 px-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white font-semibold text-xs border border-gray-800 transition flex items-center justify-center gap-1.5"
                            title="Reasignar a Fondo General o a otra acción"
                          >
                            <ArrowRightLeft className="w-3 h-3 text-emerald-400" />
                            Reasignar
                          </button>
                          <button
                            onClick={() => openReserveModal(asset.asset_id, "CLEAR")}
                            className="py-1.5 px-2.5 rounded-xl bg-gray-900 hover:bg-rose-500/20 text-gray-400 hover:text-rose-300 font-semibold text-xs border border-gray-800 transition flex items-center justify-center gap-1"
                            title="Borrar o liberar reserva remanente"
                          >
                            <Trash2 className="w-3 h-3" />
                            Borrar
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            );
          })}
          {assets.length === 0 && !loading && (
            <div className="col-span-1 md:col-span-3 text-center py-12 text-gray-500 border border-dashed border-gray-800 rounded-xl flex flex-col items-center gap-3">
              <span className="text-lg">
                No tienes activos en este portafolio aún.
              </span>
              <button
                onClick={() => setShowAddModal(true)}
                className="text-sm font-bold text-white hover:underline uppercase tracking-wider mt-2"
              >
                + Comprar Nóminas
              </button>
            </div>
          )}
        </div>
      )}

      {/* History List View */}
      {viewMode === "history" && (
        <div className="bg-black border border-white rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[650px]">
              <thead>
                <tr className="border-b border-gray-800 text-xs uppercase tracking-wider text-gray-500 bg-gray-900/20">
                  <th className="p-4 font-medium">Fecha</th>
                  <th className="p-4 font-medium">Tipo</th>
                  <th className="p-4 font-medium">Activo</th>
                  <th className="p-4 font-medium text-right">Cantidad</th>
                  <th className="p-4 font-medium text-right">
                    Precio Unitario
                  </th>
                  <th className="p-4 font-medium text-right">Total</th>
                  <th className="p-4 font-medium text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {transactions.map((txn) => (
                  <tr
                    key={txn.id}
                    className="hover:bg-gray-900/30 transition-colors"
                  >
                    <td className="p-4 text-sm text-gray-300">
                      {new Date(txn.date).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                          txn.type === "BUY"
                            ? "bg-green-900/30 text-green-400 border border-green-800/50"
                            : txn.type === "SELL"
                              ? "bg-red-900/30 text-red-400 border border-red-800/50"
                              : txn.type === "DEPOSIT"
                                ? "bg-blue-900/30 text-blue-400 border border-blue-800/50"
                                : txn.type === "WITHDRAW"
                                  ? "bg-rose-900/30 text-rose-400 border border-rose-800/50"
                                  : "bg-gray-800 text-gray-400 border border-gray-700"
                        }`}
                      >
                        {txn.type}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-white">
                          {!txn.asset_id ? "FONDO GENERAL" : txn.asset_symbol || "-"}
                        </span>
                        {txn.notes && (
                          <span
                            className="text-[11px] text-gray-400 max-w-[220px] truncate"
                            title={txn.notes}
                          >
                            {txn.notes}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-sm font-medium text-white text-right">
                      {txn.quantity ? Number(txn.quantity) : "-"}
                    </td>
                    <td className="p-4 text-sm text-gray-300 text-right">
                      {txn.price ? formatCurrency(txn.price) : "-"}
                    </td>
                    <td className="p-4 text-sm font-bold text-white text-right">
                      {formatCurrency(txn.amount)}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEditClick(txn)}
                          className="text-gray-400 hover:text-white transition-colors"
                          title="Editar Transacción"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTxn(txn.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                          title="Eliminar Transacción"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      No hay transacciones registradas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Manage Reserves */}
      {showReserveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-black border border-gray-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-in">
            <div className="flex justify-between items-center p-5 sm:p-6 border-b border-gray-800 bg-gradient-to-r from-gray-950 to-black">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    {reserveModalAssetId
                      ? `Gestionar Reserva de ${
                          assetsList.find((a) => a.id === reserveModalAssetId)
                            ?.symbol || "Activo"
                        }`
                      : "Gestionar Fondo General"}
                  </h3>
                  <p className="text-xs text-gray-400">
                    Saldo disponible:{" "}
                    <span className="font-bold text-emerald-400">
                      {formatCurrency(
                        reserveModalAssetId
                          ? assetSummaries[reserveModalAssetId]?.savedCash || 0
                          : globalReservedCash,
                      )}
                    </span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowReserveModal(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-900 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManageReserveSubmit} className="p-6 space-y-5">
              {/* Action Selector */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 font-bold mb-2">
                  ¿Qué deseas hacer con estos fondos?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {reserveModalAssetId ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setReserveAction("TO_GLOBAL")}
                        className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                          reserveAction === "TO_GLOBAL"
                            ? "bg-emerald-500/15 border-emerald-500 text-white"
                            : "bg-gray-950 border-gray-800 text-gray-400 hover:text-white"
                        }`}
                      >
                        <Coins
                          className={`w-4 h-4 mb-2 ${
                            reserveAction === "TO_GLOBAL"
                              ? "text-emerald-400"
                              : "text-gray-500"
                          }`}
                        />
                        <span className="font-bold text-xs">A Fondo General</span>
                        <span className="text-[10px] text-gray-500 mt-1 leading-tight">
                          Guardar como liquidez libre
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setReserveAction("TO_ASSET")}
                        className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                          reserveAction === "TO_ASSET"
                            ? "bg-emerald-500/15 border-emerald-500 text-white"
                            : "bg-gray-950 border-gray-800 text-gray-400 hover:text-white"
                        }`}
                      >
                        <ArrowRightLeft
                          className={`w-4 h-4 mb-2 ${
                            reserveAction === "TO_ASSET"
                              ? "text-emerald-400"
                              : "text-gray-500"
                          }`}
                        />
                        <span className="font-bold text-xs">A otra Nómina</span>
                        <span className="text-[10px] text-gray-500 mt-1 leading-tight">
                          Pasar a otra acción
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setReserveAction("CLEAR")}
                        className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                          reserveAction === "CLEAR"
                            ? "bg-rose-500/15 border-rose-500 text-white"
                            : "bg-gray-950 border-gray-800 text-gray-400 hover:text-white"
                        }`}
                      >
                        <Trash2
                          className={`w-4 h-4 mb-2 ${
                            reserveAction === "CLEAR"
                              ? "text-rose-400"
                              : "text-gray-500"
                          }`}
                        />
                        <span className="font-bold text-xs">Borrar Reserva</span>
                        <span className="text-[10px] text-gray-500 mt-1 leading-tight">
                          Vaciar remanente
                        </span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setReserveAction("TO_ASSET")}
                        className={`sm:col-span-2 p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                          reserveAction === "TO_ASSET"
                            ? "bg-emerald-500/15 border-emerald-500 text-white"
                            : "bg-gray-950 border-gray-800 text-gray-400 hover:text-white"
                        }`}
                      >
                        <ArrowRightLeft
                          className={`w-4 h-4 mb-2 ${
                            reserveAction === "TO_ASSET"
                              ? "text-emerald-400"
                              : "text-gray-500"
                          }`}
                        />
                        <span className="font-bold text-xs">
                          Distribuir a una Nómina
                        </span>
                        <span className="text-[10px] text-gray-500 mt-1">
                          Sumar saldo a la reserva de una acción
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setReserveAction("CLEAR")}
                        className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                          reserveAction === "CLEAR"
                            ? "bg-rose-500/15 border-rose-500 text-white"
                            : "bg-gray-950 border-gray-800 text-gray-400 hover:text-white"
                        }`}
                      >
                        <Trash2
                          className={`w-4 h-4 mb-2 ${
                            reserveAction === "CLEAR"
                              ? "text-rose-400"
                              : "text-gray-500"
                          }`}
                        />
                        <span className="font-bold text-xs">Borrar Fondo</span>
                        <span className="text-[10px] text-gray-500 mt-1">
                          Liberar remanente
                        </span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Target Asset selector if TO_ASSET */}
              {reserveAction === "TO_ASSET" && (
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-400 font-bold mb-1.5">
                    Activo / Nómina de Destino
                  </label>
                  <select
                    value={reserveTargetAssetId}
                    onChange={(e) => setReserveTargetAssetId(e.target.value)}
                    className="w-full bg-black border border-gray-800 focus:border-emerald-500 text-white font-bold text-sm px-4 py-3 rounded-2xl focus:outline-none transition cursor-pointer"
                    required
                  >
                    <option value="" disabled>
                      Selecciona el activo...
                    </option>
                    {assetsList
                      .filter((a) => a.id !== reserveModalAssetId)
                      .map((a) => (
                        <option
                          key={a.id}
                          value={a.id}
                          className="bg-neutral-900 text-white"
                        >
                          {a.symbol} — {a.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Amount input */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs uppercase tracking-wider text-gray-400 font-bold">
                    {reserveAction === "CLEAR"
                      ? "Monto a Liberar / Borrar ($)"
                      : "Monto a Transferir ($)"}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const avail = reserveModalAssetId
                        ? assetSummaries[reserveModalAssetId]?.savedCash || 0
                        : globalReservedCash;
                      setReserveAmount(avail.toFixed(2));
                    }}
                    className="text-xs font-bold text-emerald-400 hover:text-emerald-300"
                  >
                    Usar Total (
                    {formatCurrency(
                      reserveModalAssetId
                        ? assetSummaries[reserveModalAssetId]?.savedCash || 0
                        : globalReservedCash,
                    )}
                    )
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={reserveAmount}
                    onChange={(e) => setReserveAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-black border border-gray-800 text-white font-extrabold text-lg pl-9 pr-4 py-3 rounded-2xl focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <p className="text-[11px] text-gray-500 mt-1.5">
                  {reserveAction === "TO_GLOBAL" &&
                    "Este saldo pasará a tu Fondo General y podrás usarlo en compras libres o distribuirlo en cualquier momento."}
                  {reserveAction === "TO_ASSET" &&
                    "El saldo se sumará inmediatamente a la reserva del activo seleccionado listo para ejecutar órdenes."}
                  {reserveAction === "CLEAR" &&
                    "Se descontará este monto de la reserva sin generar compras, dejándola limpia o en cero."}
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReserveModal(false)}
                  className="flex-1 py-3 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 font-bold text-sm transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingReserve}
                  className={`flex-1 py-3 rounded-xl font-extrabold text-sm transition shadow-lg flex items-center justify-center gap-2 ${
                    reserveAction === "CLEAR"
                      ? "bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20"
                      : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/20"
                  }`}
                >
                  {submittingReserve
                    ? "Procesando..."
                    : reserveAction === "CLEAR"
                      ? "Confirmar y Borrar Reserva"
                      : "Confirmar Reasignación"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

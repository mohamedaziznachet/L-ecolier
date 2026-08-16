import { useState, useEffect, useMemo } from "react";
import { useNavigation } from "../context/AppContext";
import { getOrdersForUser } from "../services/api";
import { Order } from "../types";
import { ArrowLeft, Clock, ShoppingBag, MapPin, Phone, CreditCard, Mail, Package, Search, AlertCircle, Printer, MessageCircle } from "lucide-react";
import Seo from "../components/common/Seo";

export function OrderHistoryPage() {
  const { navigateTo, user } = useNavigation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Filtering & Search
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    async function fetchOrders() {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      try {
        const userOrders = await getOrdersForUser(user.id);
        setOrders(userOrders);
        if (userOrders.length > 0) {
          setSelectedOrder(userOrders[0]);
        }
      } catch (err) {
        console.error("Failed to load user orders:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, [user]);

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter(ord => {
      const matchesSearch = 
        (ord.id || '').toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ord.items || []).some(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      const statusStr = (ord.status || '').toLowerCase();
      if (statusFilter === "all") return true;
      if (statusFilter === "in_progress") return ["pending", "processing", "shipped", "confirmed"].includes(statusStr);
      if (statusFilter === "delivered") return statusStr === "delivered";
      if (statusFilter === "cancelled") return ["cancelled", "expired"].includes(statusStr);
      return true;
    });
  }, [orders, statusFilter, searchQuery]);

  const getStatusBadge = (status = 'pending') => {
    const map: Record<string, { label: string; color: string; bg: string }> = {
      pending: { label: "En attente", color: "#b45309", bg: "#fef3c7" },
      confirmed: { label: "Confirmée", color: "#0d2b6b", bg: "#f0f6ff" },
      processing: { label: "En préparation", color: "#1d4ed8", bg: "#eff6ff" },
      shipped: { label: "Expédiée", color: "#0284c7", bg: "#f0f9ff" },
      delivered: { label: "Livrée", color: "#15803d", bg: "#dcfce7" },
      cancelled: { label: "Annulée", color: "#b91c1c", bg: "#fef2f2" },
      expired: { label: "Expirée", color: "#475569", bg: "#f1f5f9" },
    };
    const s = map[status.toLowerCase()] || map.pending;
    return (
      <span className="order-badge" style={{ color: s.color, background: s.bg, border: `1px solid ${s.color}20` }}>
        {s.label}
      </span>
    );
  };

  const renderStatusTracker = (status = 'pending') => {
    const current = status.toLowerCase();
    const steps = [
      { key: "confirmed", label: "Confirmée" },
      { key: "processing", label: "Préparation" },
      { key: "shipped", label: "Expédiée" },
      { key: "delivered", label: "Livrée" },
    ];

    if (current === "cancelled" || current === "expired") {
      return (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-800 text-xs font-semibold flex items-center gap-2 mb-4">
          <AlertCircle size={16} /> Cette commande a été annulée.
        </div>
      );
    }

    let activeStepIndex = 0;
    if (current === "processing") activeStepIndex = 1;
    else if (current === "shipped") activeStepIndex = 2;
    else if (current === "delivered") activeStepIndex = 3;

    return (
      <div className="order-status-tracker-card mb-6">
        <div className="order-status-tracker-title font-bold text-slate-800 text-sm mb-3">
          Suivi de l'acheminement
        </div>

        <div className="order-tracker-steps">
          {steps.map((step, idx) => {
            const isCompleted = idx <= activeStepIndex;
            const isCurrent = idx === activeStepIndex;

            return (
              <div key={step.key} className="order-tracker-step-node">
                <div 
                  className="order-tracker-step-dot"
                  style={{
                    background: isCompleted ? (isCurrent ? "#0d2b6b" : "#16a34a") : "#ffffff",
                    color: isCompleted ? "#ffffff" : "#94a3b8",
                    border: isCompleted ? "none" : "1px solid #cbd5e1",
                  }}
                >
                  {isCompleted ? "✓" : idx + 1}
                </div>
                <div 
                  className="order-tracker-step-lbl"
                  style={{ 
                    fontWeight: isCurrent ? 800 : 600, 
                    color: isCompleted ? "#0f172a" : "#64748b" 
                  }}
                >
                  {step.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="page-section min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page-section text-center py-16 min-h-[60vh]">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <ShoppingBag size={32} className="text-slate-400" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-800 mb-2">Espace réservé aux clients</h2>
        <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">
          Veuillez vous connecter pour accéder à l'historique et au suivi de vos commandes.
        </p>
        <button onClick={() => navigateTo("auth")} className="btn-primary">
          Se connecter à mon compte
        </button>
      </div>
    );
  }

  const orderIdShort = selectedOrder ? (selectedOrder.id || '').toString().slice(-8).toUpperCase() : '';
  const supportWaUrl = `https://wa.me/+21658982121?text=${encodeURIComponent(`Bonjour, j'ai une question concernant ma commande #${orderIdShort}.`)}`;

  return (
    <div className="page-section" style={{ minHeight: "75vh", paddingBottom: "4rem" }}>
      <Seo title="Mes Commandes – Librairie l'Écolier" />
      
      {/* Top Header */}
      <button 
        onClick={() => navigateTo("home")} 
        className="btn-back mb-4"
      >
        <ArrowLeft size={16} />
        <span>Retour à l'accueil</span>
      </button>

      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-primary m-0">Historique de Mes Commandes</h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-1">
          Suivez l'acheminement de vos colis et consultez vos reçus d'achat.
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <ShoppingBag size={32} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">Aucune commande enregistrée</h3>
          <p className="text-slate-500 text-xs sm:text-sm mb-6">Vous n'avez pas encore passé de commande avec ce compte.</p>
          <button onClick={() => navigateTo("category", "")} className="btn-primary">
            Découvrir la boutique
          </button>
        </div>
      ) : (
        <>
          {/* Status Filter Tabs & Search Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="flex gap-1 bg-white p-1 rounded-xl border border-slate-200">
              {[
                { id: "all", label: "Toutes" },
                { id: "in_progress", label: "En cours" },
                { id: "delivered", label: "Livrées" },
                { id: "cancelled", label: "Annulées" },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-none cursor-pointer ${
                    statusFilter === tab.id ? "bg-primary text-white" : "bg-transparent text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative min-w-[240px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="N° de commande ou article..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-primary bg-white"
              />
            </div>
          </div>

          {/* Master Detail Grid */}
          <div className="order-history-layout">
            
            {/* Left Column: Order Selector List */}
            <div className="flex flex-col gap-3">
              {filteredOrders.length === 0 ? (
                <div className="p-6 bg-white rounded-2xl border border-slate-200 text-center text-slate-500 text-xs">
                  Aucune commande ne correspond aux filtres.
                </div>
              ) : (
                filteredOrders.map((order) => {
                  const isSelected = selectedOrder?.id === order.id;
                  const dateStr = new Date(order.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
                  const totalItems = (order.items || []).reduce((acc, i) => acc + (i.quantity || 1), 0) || order.productIds?.length || 0;

                  return (
                    <div
                      key={order.id}
                      onClick={() => {
                        setSelectedOrder(order);
                        if (window.innerWidth < 900) {
                          setTimeout(() => {
                            const detailsEl = document.getElementById("order-details-section");
                            if (detailsEl) {
                              detailsEl.scrollIntoView({ behavior: "smooth", block: "start" });
                            }
                          }, 100);
                        }
                      }}
                      className={`bg-white rounded-2xl p-4 cursor-pointer transition-all border ${
                        isSelected ? "border-primary shadow-md ring-2 ring-blue-100" : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono font-extrabold text-sm text-slate-800">
                          #{(order.id || '').toString().slice(-8).toUpperCase()}
                        </span>
                        {getStatusBadge(order.status)}
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
                        <span>{dateStr} • {totalItems} article(s)</span>
                        <strong className="text-primary font-extrabold text-sm">{Number(order.total).toFixed(3)} DT</strong>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Right Column: Detailed View */}
            {selectedOrder && (
              <div id="order-details-section" className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                
                {/* Order Summary Line */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4 flex-wrap gap-2">
                  <div>
                    <span className="text-lg font-mono font-black text-primary">
                      Commande #{orderIdShort}
                    </span>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <Clock size={13} /> {new Date(selectedOrder.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => window.print()}
                      className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border-none cursor-pointer transition-colors"
                      title="Imprimer le bon de commande"
                    >
                      <Printer size={13} />
                      <span>Imprimer</span>
                    </button>
                    <a
                      href={supportWaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border-none cursor-pointer transition-colors no-underline"
                    >
                      <MessageCircle size={13} />
                      <span>Aide WhatsApp</span>
                    </a>
                  </div>
                </div>

                {/* Status Step Progress Bar */}
                {renderStatusTracker(selectedOrder.status)}

                {/* Delivery & Payment Info Cards */}
                <div className="order-info-cards-grid">
                  
                  {/* Shipping Address */}
                  <div className="order-info-card">
                    <div className="order-info-card-header">
                      <MapPin size={14} /> Destinataire & Livraison
                    </div>
                    <div className="order-info-card-body">
                      <div className="order-info-card-name font-bold text-slate-900">{selectedOrder.customerName || user.name}</div>
                      <div className="text-slate-700 text-xs">{selectedOrder.customerAddress || "Adresse non spécifiée"}</div>
                      <div className="order-info-card-gov text-xs font-semibold text-primary">{selectedOrder.customerGovernorate}</div>
                      {selectedOrder.customerPhone && (
                        <div className="order-info-card-meta">
                          <Phone size={12} /> {selectedOrder.customerPhone}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payment Details */}
                  <div className="order-info-card">
                    <div className="order-info-card-header">
                      <CreditCard size={14} /> Modalités de règlement
                    </div>
                    <div className="order-info-card-body">
                      <div className="order-info-card-row">
                        <span className="text-slate-500 text-xs">Moyen :</span>
                        <strong className="text-slate-900 text-xs">{selectedOrder.paymentMethod || "Paiement en espèces à la livraison"}</strong>
                      </div>
                      <div className="order-info-card-row">
                        <span className="text-slate-500 text-xs">Statut :</span>
                        <span className={`font-bold text-xs ${selectedOrder.paymentStatus === "paid" ? "text-emerald-600" : "text-amber-700"}`}>
                          {selectedOrder.paymentStatus === "paid" ? "Payé" : "À régler lors de la livraison"}
                        </span>
                      </div>
                      <div className="order-info-card-meta">
                        <Mail size={12} /> {selectedOrder.customerEmail || user.email}
                      </div>
                    </div>
                  </div>

                </div>

                {/* Items Table */}
                <div className="mb-4">
                  <div className="text-xs font-extrabold text-slate-800 mb-2 flex items-center gap-1.5">
                    <Package size={15} className="text-primary" />
                    <span>Détail des articles ({(selectedOrder.items || []).reduce((acc, i) => acc + (i.quantity || 1), 0)})</span>
                  </div>

                  <div className="order-table-wrap">
                    <table className="order-table">
                      <thead>
                        <tr>
                          <th>Produit</th>
                          <th style={{ textAlign: "center" }}>Prix</th>
                          <th style={{ textAlign: "center" }}>Qté</th>
                          <th style={{ textAlign: "right" }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedOrder.items || []).map((item, idx) => {
                          const price = item.unitPrice || item.price || 0;
                          const qty = item.quantity || 1;
                          const itemTotal = price * qty;
                          const img = item.image || item.img || "https://via.placeholder.com/40";

                          return (
                            <tr key={idx}>
                              <td>
                                <div className="order-item-flex">
                                  <img src={img} alt={item.name} className="order-item-img" />
                                  <div>
                                    <div className="order-item-name">{item.name}</div>
                                    {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                                      <div className="order-item-options">
                                        {Object.entries(item.selectedOptions).map(([k, v]) => `${k}: ${v}`).join(", ")}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td style={{ textAlign: "center", fontWeight: "600", color: "#334155" }}>
                                {Number(price).toFixed(3)} DT
                              </td>
                              <td style={{ textAlign: "center" }}>
                                <span className="order-item-qty">
                                  x{qty}
                                </span>
                              </td>
                              <td className="order-item-total" style={{ textAlign: "right" }}>
                                {Number(itemTotal).toFixed(3)} DT
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Total Box */}
                <div className="order-total-card">
                  <div className="order-total-row">
                    <span>Sous-total articles</span>
                    <span className="font-bold text-slate-800">{Number(selectedOrder.total).toFixed(3)} DT</span>
                  </div>
                  <div className="order-total-row">
                    <span>Livraison</span>
                    <span className="font-bold text-emerald-600">Offerte / Inclus</span>
                  </div>
                  <div className="order-total-row grand">
                    <span className="text-sm font-extrabold text-slate-900">Total Net TTC</span>
                    <span className="order-total-val-primary text-base font-black">
                      {Number(selectedOrder.total).toFixed(3)} DT
                    </span>
                  </div>
                </div>

              </div>
            )}

          </div>
        </>
      )}
    </div>
  );
}


import { useState, useEffect, useMemo } from "react";
import { useNavigation } from "../context/AppContext";
import { getOrdersForUser } from "../services/api";
import { Order } from "../types";
import { ArrowLeft, Clock, ShoppingBag, MapPin, Phone, CreditCard, Mail, Package, Search, AlertCircle } from "lucide-react";

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
      <span style={{ padding: "0.3rem 0.8rem", borderRadius: "8px", fontSize: "0.78rem", fontWeight: 700, color: s.color, background: s.bg, border: `1px solid ${s.color}20` }}>
        {s.label}
      </span>
    );
  };

  // Clean, realistic step-by-step progress indicator
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
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "0.75rem 1rem", color: "#991b1b", fontSize: "0.85rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
          <AlertCircle size={16} /> Cette commande a été annulée.
        </div>
      );
    }

    let activeStepIndex = 0;
    if (current === "processing") activeStepIndex = 1;
    else if (current === "shipped") activeStepIndex = 2;
    else if (current === "delivered") activeStepIndex = 3;

    return (
      <div style={{ background: "#f8fafc", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "1.2rem 1.4rem", marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "0.8rem", fontWeight: 800, color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "1rem" }}>
          État de l'acheminement
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem" }}>
          {steps.map((step, idx) => {
            const isCompleted = idx <= activeStepIndex;
            const isCurrent = idx === activeStepIndex;

            return (
              <div key={step.key} style={{ textAlign: "center" }}>
                <div style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  margin: "0 auto 0.4rem auto",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: isCompleted ? (isCurrent ? "#0d2b6b" : "#16a34a") : "#ffffff",
                  color: isCompleted ? "#ffffff" : "#94a3b8",
                  border: isCompleted ? "none" : "1px solid #cbd5e1",
                  fontWeight: 800,
                  fontSize: "0.8rem",
                  transition: "all 0.15s ease"
                }}>
                  {isCompleted ? "✓" : idx + 1}
                </div>
                <div style={{ fontSize: "0.8rem", fontWeight: isCurrent ? 800 : 600, color: isCompleted ? "#0f172a" : "#64748b" }}>
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
      <div className="page-section" style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#64748b", fontWeight: 600 }}>Chargement de vos commandes...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page-section" style={{ textAlign: "center", padding: "4rem 1rem", minHeight: "60vh" }}>
        <ShoppingBag size={48} style={{ color: "#94a3b8", marginBottom: "1rem" }} />
        <h2 style={{ color: "#0f172a", fontWeight: 800 }}>Connexion requise</h2>
        <p style={{ color: "#64748b" }}>Veuillez vous connecter à votre compte pour consulter vos commandes.</p>
        <button onClick={() => navigateTo("auth")} className="btn-primary" style={{ marginTop: "1rem", padding: "0.75rem 1.75rem", borderRadius: "9999px", fontWeight: 700 }}>
          Se connecter
        </button>
      </div>
    );
  }

  return (
    <div className="page-section" style={{ minHeight: "75vh", paddingBottom: "4rem" }}>
      
      {/* Top Header */}
      <button 
        onClick={() => navigateTo("home")} 
        style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", color: "#0d2b6b", fontWeight: 700, fontSize: "0.88rem", border: "none", background: "none", cursor: "pointer", marginBottom: "1.25rem" }}
      >
        <ArrowLeft size={16} /> Retour à l'accueil
      </button>

      {/* Page Title */}
      <div style={{ marginBottom: "1.75rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 900, color: "#0d2b6b", margin: 0 }}>Mes Commandes</h1>
        <p style={{ color: "#64748b", fontSize: "0.88rem", marginTop: "0.25rem" }}>
          Retrouvez l'historique et le détail de vos achats en toute simplicité.
        </p>
      </div>

      {orders.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3.5rem 1.5rem", background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
          <ShoppingBag size={44} style={{ color: "#94a3b8", marginBottom: "0.75rem" }} />
          <h3 style={{ color: "#0f172a", fontWeight: 800, margin: "0 0 0.35rem 0" }}>Aucune commande</h3>
          <p style={{ color: "#64748b", fontSize: "0.88rem", marginBottom: "1.25rem" }}>Vous n'avez pas encore passé de commande sur notre boutique.</p>
          <button onClick={() => navigateTo("category", "")} className="btn-primary" style={{ padding: "0.65rem 1.5rem", borderRadius: "9999px", fontWeight: 700, fontSize: "0.88rem" }}>
            Parcourir le catalogue
          </button>
        </div>
      ) : (
        <>
          {/* Status Filter Tabs & Search Bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: "0.4rem", background: "#ffffff", padding: "4px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
              {[
                { id: "all", label: "Toutes" },
                { id: "in_progress", label: "En cours" },
                { id: "delivered", label: "Livrées" },
                { id: "cancelled", label: "Annulées" },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  style={{
                    padding: "0.4rem 0.9rem",
                    borderRadius: "6px",
                    border: "none",
                    background: statusFilter === tab.id ? "#0d2b6b" : "transparent",
                    color: statusFilter === tab.id ? "#ffffff" : "#475569",
                    fontWeight: 700,
                    fontSize: "0.82rem",
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div style={{ position: "relative", minWidth: 220 }}>
              <Search size={15} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
              <input
                type="text"
                placeholder="N° de commande ou article..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.5rem 0.85rem 0.5rem 2rem",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.84rem",
                  outline: "none",
                  background: "#ffffff"
                }}
              />
            </div>
          </div>

          {/* Master Detail Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem", alignItems: "start" }}>
            
            {/* Left Column: Order Selector List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {filteredOrders.length === 0 ? (
                <div style={{ padding: "1.5rem", background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", textAlign: "center", color: "#64748b", fontSize: "0.85rem" }}>
                  Aucune commande trouvée.
                </div>
              ) : (
                filteredOrders.map((order) => {
                  const isSelected = selectedOrder?.id === order.id;
                  const dateStr = new Date(order.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
                  const totalItems = (order.items || []).reduce((acc, i) => acc + (i.quantity || 1), 0) || order.productIds?.length || 0;

                  return (
                    <div
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      style={{
                        background: "#ffffff",
                        borderRadius: "14px",
                        padding: "1rem 1.15rem",
                        border: isSelected ? "2px solid #0d2b6b" : "1px solid #e2e8f0",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        boxShadow: isSelected ? "0 4px 14px rgba(13, 43, 107, 0.08)" : "none"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                        <span style={{ fontWeight: 800, fontSize: "0.9rem", color: "#0f172a", fontFamily: "monospace" }}>
                          #{(order.id || '').toString().slice(-8).toUpperCase()}
                        </span>
                        {getStatusBadge(order.status)}
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.82rem", color: "#64748b", marginTop: "0.4rem" }}>
                        <span>{dateStr} • {totalItems} article(s)</span>
                        <strong style={{ color: "#0d2b6b", fontSize: "0.95rem", fontWeight: 800 }}>{Number(order.total).toFixed(3)} DT</strong>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Right Column: Detailed View */}
            {selectedOrder && (
              <div style={{ background: "#ffffff", borderRadius: "18px", border: "1px solid #e2e8f0", padding: "1.5rem", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)" }}>
                
                {/* Order Summary Line */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "1rem", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
                  <div>
                    <span style={{ fontSize: "1.25rem", fontWeight: 900, color: "#0d2b6b", fontFamily: "monospace" }}>
                      Commande #{(selectedOrder.id || '').toString().slice(-8).toUpperCase()}
                    </span>
                    <div style={{ fontSize: "0.82rem", color: "#64748b", marginTop: "0.2rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      <Clock size={13} /> {new Date(selectedOrder.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>

                  <div>
                    {getStatusBadge(selectedOrder.status)}
                  </div>
                </div>

                {/* Status Step Progress Bar */}
                {renderStatusTracker(selectedOrder.status)}

                {/* Delivery & Payment Info */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem", marginBottom: "1.25rem" }}>
                  
                  {/* Shipping Address */}
                  <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#0d2b6b", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      <MapPin size={14} /> Adresse de livraison
                    </div>
                    <div style={{ fontSize: "0.85rem", display: "flex", flexDirection: "column", gap: "0.25rem", color: "#1e293b" }}>
                      <div style={{ fontWeight: 800, color: "#0f172a" }}>{selectedOrder.customerName || user.name}</div>
                      <div style={{ color: "#334155" }}>{selectedOrder.customerAddress || "Adresse non spécifiée"}</div>
                      <div style={{ fontWeight: 700, color: "#0d2b6b" }}>{selectedOrder.customerGovernorate}</div>
                      {selectedOrder.customerPhone && (
                        <div style={{ fontSize: "0.8rem", color: "#64748b", display: "flex", alignItems: "center", gap: "0.3rem", marginTop: "0.15rem" }}>
                          <Phone size={12} /> {selectedOrder.customerPhone}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payment Details */}
                  <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#0d2b6b", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      <CreditCard size={14} /> Règlement & Contact
                    </div>
                    <div style={{ fontSize: "0.85rem", display: "flex", flexDirection: "column", gap: "0.35rem", color: "#1e293b" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#64748b", fontSize: "0.8rem" }}>Paiement:</span>
                        <strong style={{ color: "#0f172a" }}>{selectedOrder.paymentMethod || "Paiement Cash à la livraison"}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#64748b", fontSize: "0.8rem" }}>Statut:</span>
                        <span style={{ fontWeight: 700, fontSize: "0.75rem", color: selectedOrder.paymentStatus === "paid" ? "#15803d" : "#b45309" }}>
                          {selectedOrder.paymentStatus === "paid" ? "Payé" : "À régler à la livraison"}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: "#64748b", fontSize: "0.8rem", marginTop: "0.15rem" }}>
                        <Mail size={12} /> {selectedOrder.customerEmail || user.email}
                      </div>
                    </div>
                  </div>

                </div>

                {/* Items Table */}
                <div style={{ marginBottom: "1.25rem" }}>
                  <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.65rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    <Package size={16} style={{ color: "#0d2b6b" }} />
                    Détail des articles ({(selectedOrder.items || []).reduce((acc, i) => acc + (i.quantity || 1), 0)})
                  </div>

                  <div style={{ border: "1px solid #e2e8f0", borderRadius: "12px", overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
                      <thead>
                        <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", fontWeight: 700 }}>
                          <th style={{ padding: "0.65rem 0.85rem" }}>Produit</th>
                          <th style={{ padding: "0.65rem 0.85rem", textAlign: "center" }}>Prix</th>
                          <th style={{ padding: "0.65rem 0.85rem", textAlign: "center" }}>Qté</th>
                          <th style={{ padding: "0.65rem 0.85rem", textAlign: "right" }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedOrder.items || []).map((item, idx) => {
                          const price = item.unitPrice || item.price || 0;
                          const qty = item.quantity || 1;
                          const itemTotal = price * qty;
                          const img = item.image || item.img || "https://via.placeholder.com/40";

                          return (
                            <tr key={idx} style={{ borderBottom: idx < (selectedOrder.items || []).length - 1 ? "1px solid #f1f5f9" : "none" }}>
                              <td style={{ padding: "0.75rem 0.85rem" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                  <img src={img} alt={item.name} style={{ width: "38px", height: "38px", objectFit: "contain", borderRadius: "6px", background: "#ffffff", border: "1px solid #e2e8f0", padding: "2px" }} />
                                  <div>
                                    <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.85rem" }}>{item.name}</div>
                                    {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                                        {Object.entries(item.selectedOptions).map(([k, v]) => `${k}: ${v}`).join(", ")}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: "0.75rem 0.85rem", textAlign: "center", fontWeight: "600", color: "#334155" }}>
                                {Number(price).toFixed(3)} DT
                              </td>
                              <td style={{ padding: "0.75rem 0.85rem", textAlign: "center" }}>
                                <span style={{ background: "#f1f5f9", padding: "0.15rem 0.5rem", borderRadius: "6px", fontWeight: 800, fontSize: "0.78rem", color: "#0d2b6b" }}>
                                  x{qty}
                                </span>
                              </td>
                              <td style={{ padding: "0.75rem 0.85rem", textAlign: "right", fontWeight: 800, color: "#0d2b6b" }}>
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
                <div style={{ background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "1rem 1.15rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#475569", marginBottom: "0.4rem" }}>
                    <span>Sous-total</span>
                    <span style={{ fontWeight: 700, color: "#0f172a" }}>{Number(selectedOrder.total).toFixed(3)} DT</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#475569", marginBottom: "0.65rem" }}>
                    <span>Livraison</span>
                    <span style={{ fontWeight: 700, color: "#16a34a" }}>Gratuite</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1.5px solid #e2e8f0", paddingTop: "0.65rem" }}>
                    <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0f172a" }}>Montant Total</span>
                    <span style={{ fontSize: "1.4rem", fontWeight: 900, color: "#0d2b6b" }}>
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

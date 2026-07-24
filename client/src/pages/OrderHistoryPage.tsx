import { useState, useEffect } from "react";
import { useNavigation } from "../context/AppContext";
import { getOrdersForUser } from "../services/api";
import { Order } from "../types";
import { ArrowLeft, Clock, ShoppingBag, CreditCard, MapPin } from "lucide-react";

export function OrderHistoryPage() {
  const { navigateTo, user } = useNavigation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    async function fetchOrders() {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      try {
        const userOrders = await getOrdersForUser(user.id);
        setOrders(userOrders);
      } catch (err) {
        console.error("Failed to load user orders:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, [user]);

  if (loading) {
    return (
      <div className="page-section" style={{ textAlign: "center", padding: "4rem" }}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" style={{ margin: "0 auto" }}></div>
        <p style={{ marginTop: "1rem", color: "var(--c-gray-500)" }}>Chargement de votre historique...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page-section" style={{ textAlign: "center", padding: "4rem" }}>
        <ShoppingBag size={48} style={{ color: "var(--c-gray-400)", marginBottom: "1rem" }} />
        <h3>Accès refusé</h3>
        <p>Veuillez vous connecter pour consulter votre historique d'achats.</p>
        <button onClick={() => navigateTo("auth")} className="btn-primary" style={{ marginTop: "1.5rem" }}>
          Connexion
        </button>
      </div>
    );
  }

  const getStatusLabel = (status = 'pending') => {
    const statuses: Record<string, string> = {
      pending: "En attente",
      processing: "En traitement",
      confirmed: "Confirmée",
      shipped: "Expédiée",
      delivered: "Livrée",
      cancelled: "Annulée",
      expired: "Expirée"
    };
    return statuses[status] || status;
  };

  return (
    <div className="page-section" style={{ minHeight: "60vh" }}>
      <button onClick={() => navigateTo("home")} className="btn-back" style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem", color: "var(--c-primary)", fontWeight: "600" }}>
        <ArrowLeft size={16} />
        Retourner à l'accueil
      </button>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", color: "var(--c-primary)" }}>Mon Historique d'Achats</h1>
        <span style={{ background: "rgba(13, 43, 107, 0.1)", color: "var(--c-primary)", padding: "0.35rem 0.75rem", borderRadius: "12px", fontSize: "0.85rem", fontWeight: "600" }}>
          {orders.length} {orders.length > 1 ? "commandes" : "commande"}
        </span>
      </div>

      {orders.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 2rem", background: "var(--c-white)", borderRadius: "var(--radius-lg)", border: "1px solid var(--c-gray-200)" }}>
          <ShoppingBag size={48} style={{ color: "var(--c-gray-400)", marginBottom: "1rem" }} />
          <h3>Aucune commande trouvée</h3>
          <p>Vous n'avez pas encore passé de commande sur notre boutique.</p>
          <button onClick={() => navigateTo("category")} className="btn-primary" style={{ marginTop: "1.5rem" }}>
            Commencer mes achats
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: selectedOrder ? "1fr 1fr" : "1fr", gap: "2rem", alignItems: "start" }}>
          {/* Orders List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {orders.map((order) => {
              const formattedDate = new Date(order.date).toLocaleDateString("fr-FR", {
                year: "numeric",
                month: "long",
                day: "numeric"
              });
              const isActive = selectedOrder?.id === order.id;

              return (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  style={{
                    background: "var(--c-white)",
                    borderRadius: "var(--radius-lg)",
                    padding: "1.25rem",
                    border: isActive ? "2px solid var(--c-primary)" : "1px solid var(--c-gray-200)",
                    cursor: "pointer",
                    transition: "all var(--transition)",
                    boxShadow: isActive ? "var(--shadow-md)" : "var(--shadow-sm)"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                    <span style={{ fontWeight: "700", color: "var(--c-gray-800)" }}>Commande #{String(order.id).slice(-6).toUpperCase()}</span>
                    <span style={{
                      padding: "0.25rem 0.6rem",
                      borderRadius: "8px",
                      fontSize: "0.75rem",
                      fontWeight: "700",
                      background: order.status === "delivered" ? "rgba(34, 197, 94, 0.15)" : order.status === "cancelled" ? "rgba(229, 57, 53, 0.15)" : "rgba(251, 191, 36, 0.15)",
                      color: order.status === "delivered" ? "var(--c-success-dark)" : order.status === "cancelled" ? "var(--c-danger)" : "var(--c-primary)"
                    }}>
                      {getStatusLabel(order.status)}
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: "1.5rem", fontSize: "0.85rem", color: "var(--c-gray-600)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <Clock size={14} />
                      <span>{formattedDate}</span>
                    </div>
                    <div>
                      <span>Total : </span>
                      <strong style={{ color: "var(--c-primary)" }}>{Number(order.total).toFixed(3)} DT</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Details Panel */}
          {selectedOrder && (
            <div style={{ background: "var(--c-white)", borderRadius: "var(--radius-lg)", padding: "1.5rem", border: "1px solid var(--c-gray-200)", boxShadow: "var(--shadow-md)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--c-gray-200)", paddingBottom: "1rem", marginBottom: "1.25rem" }}>
                <h2 style={{ fontSize: "1.25rem", color: "var(--c-primary)" }}>Détails de la commande</h2>
                <button onClick={() => setSelectedOrder(null)} style={{ fontSize: "0.85rem", color: "var(--c-gray-500)" }}>Fermer</button>
              </div>

              {/* Items Snapshot */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} style={{ display: "flex", justifyItems: "center", gap: "1rem" }}>
                    {item.image && (
                      <img src={item.image} alt={item.name} style={{ width: "40px", height: "40px", objectFit: "contain", borderRadius: "4px", background: "var(--c-gray-50)" }} />
                    )}
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: "0.875rem", fontWeight: "600", color: "var(--c-gray-800)" }}>{item.name}</p>
                      <p style={{ fontSize: "0.75rem", color: "var(--c-gray-500)" }}>{item.quantity} x {Number(item.unitPrice || item.price).toFixed(3)} DT</p>
                    </div>
                    <span style={{ fontSize: "0.875rem", fontWeight: "600", color: "var(--c-primary)" }}>{((item.unitPrice || item.price || 0) * item.quantity).toFixed(3)} DT</span>
                  </div>
                ))}
              </div>

              {/* Totals & Delivery Address */}
              <div style={{ borderTop: "1px solid var(--c-gray-200)", paddingTop: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
                  <span style={{ color: "var(--c-gray-600)" }}>Mode de paiement</span>
                  <span style={{ fontWeight: "600", display: "flex", alignItems: "center", gap: "0.25rem" }}><CreditCard size={14} /> Cash à la livraison</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
                  <span style={{ color: "var(--c-gray-600)" }}>Adresse de livraison</span>
                  <span style={{ fontWeight: "600", display: "flex", alignItems: "center", gap: "0.25rem", maxWidth: "70%", textAlign: "right" }}><MapPin size={14} /> {selectedOrder.customerGovernorate}, {selectedOrder.customerAddress}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1rem", fontWeight: "700", color: "var(--c-primary)", borderTop: "1px dashed var(--c-gray-200)", paddingTop: "0.75rem", marginTop: "0.75rem" }}>
                  <span>Total Payé</span>
                  <span>{Number(selectedOrder.total).toFixed(3)} DT</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

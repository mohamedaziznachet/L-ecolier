import React, { useState } from 'react';
import { useAdmin } from '../../../context/AdminContext';
import { Search, Eye, Trash2, X } from 'lucide-react';
import { useToast } from '../components/Toast';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Pagination } from '../components/Pagination';
import { StatusBadge } from '../components/StatusBadge';
import * as api from '../../../services/api';

export const OrdersPage: React.FC = () => {
  const { orders, deleteOrder, updateOrder, products } = useAdmin();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);

  const { showToast, ToastComponent } = useToast();

  // Optimistic local status map: immediately reflects user selection before API refresh
  const [pendingStatuses, setPendingStatuses] = useState<Record<string, string>>({});

  const handleStatusChange = async (orderId: string | undefined, newStatus: string) => {
    if (!orderId) {
      showToast('ID de la commande manquant', 'error');
      return;
    }
    // Optimistically update the local display immediately
    setPendingStatuses(prev => ({ ...prev, [orderId]: newStatus }));
    try {
      // Server returns updated status + paymentStatus
      const result = await api.updateOrderStatus(orderId, newStatus);
      // Refresh orders list via context helper with both fields
      await updateOrder(orderId, { status: result.status, paymentStatus: result.paymentStatus } as any);
      showToast('Statut de la commande mis à jour', 'success');
      // Keep modal in sync
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev: any) => ({ ...prev, status: result.status, paymentStatus: result.paymentStatus }));
      }
    } catch (err: any) {
      // Revert optimistic update on error
      setPendingStatuses(prev => { const next = { ...prev }; delete next[orderId]; return next; });
      showToast(err.message || 'Impossible de mettre à jour le statut', 'error');
    } finally {
      // Clean up once the real state has settled
      setPendingStatuses(prev => { const next = { ...prev }; delete next[orderId]; return next; });
    }
  };

  const openOrderDetails = (order: any) => {
    setSelectedOrder(order);
    setDetailsModalOpen(true);
  };

  const triggerDelete = (id: string) => {
    setOrderToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (orderToDelete) {
      try {
        await deleteOrder(orderToDelete);
        showToast('Commande supprimée avec succès', 'success');
      } catch (err: any) {
        showToast(err.message || 'Échec de la suppression', 'error');
      } finally {
        setOrderToDelete(null);
      }
    }
  };

  const getOrderProducts = (productIds: any[], orderItems?: any[]) => {
    if (orderItems && orderItems.length > 0) {
      return orderItems;
    }
    // Fallback if full items info doesn't exist
    return productIds.map(id => {
      const p = products.find(prod => prod.id === id);
      return p ? { name: p.name, price: p.priceNum, img: p.img, quantity: 1 } : null;
    }).filter(Boolean);
  };

  // Filter
  const filtered = orders.filter(o => {
    const matchSearch = (o.id || '').toString().toLowerCase().includes(search.toLowerCase()) ||
                        (o.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
                        (o.customerPhone || '').toLowerCase().includes(search.toLowerCase()) ||
                        (o.userId || '').toString().toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? o.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Revenue statistics for filtered view
  const filteredValidTotal = filtered
    .filter(o => o.status !== 'cancelled' && o.status !== 'expired')
    .reduce((sum, o) => sum + (o.total || 0), 0);
  const filteredDeliveredTotal = filtered
    .filter(o => o.status === 'delivered')
    .reduce((sum, o) => sum + (o.total || 0), 0);
  const filteredPendingTotal = filtered
    .filter(o => o.status === 'pending')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  return (
    <>
      <div className="admin-page-header">
        <div>
          <div className="admin-page-title">Commandes</div>
          <div className="admin-page-sub">Gérez et suivez le statut des commandes clients ({orders.length})</div>
        </div>
      </div>

      <div className="a-card">
        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <div className="a-input-wrap" style={{ flex: 1, minWidth: 200 }}>
            <span className="a-input-icon"><Search size={15} /></span>
            <input 
              className="a-input" 
              placeholder="Rechercher par ID, client, téléphone..." 
              value={search} 
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} 
            />
          </div>
          <select
            className="a-input"
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            style={{ width: 200 }}
          >
            <option value="">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="processing">Préparation</option>
            <option value="shipped">Expédié</option>
            <option value="delivered">Livré</option>
            <option value="expired">Expiré</option>
            <option value="cancelled">Annulé</option>
          </select>
        </div>

        {/* Revenue Summary Banner for Filtered View */}
        <div style={{
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
          background: 'var(--a-sidebar)',
          border: '1px solid var(--a-border)',
          borderRadius: 8,
          padding: '10px 16px',
          marginBottom: 16,
          fontSize: '0.85rem'
        }}>
          <div>
            <span style={{ color: 'var(--a-text-muted)' }}>Montant total des résultats: </span>
            <strong style={{ color: 'var(--a-success)' }}>{filteredValidTotal.toFixed(2)} DT</strong>
          </div>
          <div>
            <span style={{ color: 'var(--a-text-muted)' }}>Livré: </span>
            <strong style={{ color: '#10b981' }}>{filteredDeliveredTotal.toFixed(2)} DT</strong>
          </div>
          <div>
            <span style={{ color: 'var(--a-text-muted)' }}>En attente: </span>
            <strong style={{ color: '#f59e0b' }}>{filteredPendingTotal.toFixed(2)} DT</strong>
          </div>
        </div>

        {/* Table */}
        <div className="a-table-wrap">
          <table className="a-table">
            <thead>
              <tr>
                <th>ID Commande</th>
                <th>Client</th>
                <th>Articles</th>
                <th>Total</th>
                <th>Date</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((o, idx) => (
                <tr key={o.id || idx}>
                  <td>
                    <span style={{ fontFamily: 'monospace', color: 'var(--a-accent)', fontSize: '0.82rem', fontWeight: 600 }}>
                      #{(o.id || 'N/A').toString().slice(-8).toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500, color: 'var(--a-text-bright)' }}>{o.customerName || 'Client anonyme'}</div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--a-text-muted)' }}>{o.customerPhone || '—'}</span>
                  </td>
                  <td>
                    <span className="a-badge a-badge-blue">
                      {o.productIds?.length || 0} article(s)
                    </span>
                  </td>
                  <td style={{ color: 'var(--a-success)', fontWeight: 700 }}>
                    {o.total?.toFixed(2)} DT
                  </td>
                  <td style={{ color: 'var(--a-text-muted)', fontSize: '0.8rem' }}>
                    {new Date(o.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td>
                    <select
                      className={`a-status-dropdown ${(() => {
                        const s = pendingStatuses[o.id] ?? o.status;
                        if (s === 'delivered') return 'a-badge-green';
                        if (s === 'shipped') return 'a-badge-purple';
                        if (s === 'processing') return 'a-badge-blue';
                        if (s === 'cancelled' || s === 'expired') return 'a-badge-red';
                        return 'a-badge-orange';
                      })()}`}
                      value={pendingStatuses[o.id] ?? o.status ?? 'pending'}
                      onChange={(e) => handleStatusChange(o.id, e.target.value)}
                      style={{ fontSize: '0.8rem', padding: '2px 8px', borderRadius: 4 }}
                    >
                      <option value="pending">En attente</option>
                      <option value="processing">Préparation</option>
                      <option value="shipped">Expédié</option>
                      <option value="delivered">Livré</option>
                      <option value="expired">Expiré</option>
                      <option value="cancelled">Annulé</option>
                    </select>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="a-btn a-btn-ghost a-btn-sm" onClick={() => openOrderDetails(o)}>
                        <Eye size={13} />
                      </button>
                      <button className="a-btn a-btn-danger a-btn-sm" onClick={() => triggerDelete(o.id)}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <div className="a-empty">
                      <div className="a-empty-icon">🛒</div>
                      <div className="a-empty-text">Aucune commande trouvée</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          onPageChange={setCurrentPage} 
        />
      </div>

      {/* Order Details Modal */}
      {detailsModalOpen && selectedOrder && (
        <div className="a-modal-overlay" onClick={() => setDetailsModalOpen(false)}>
          <div className="a-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="a-modal-header">
              <span className="a-modal-title">📦 Détails de la Commande #{(selectedOrder.id || 'N/A').toString().slice(-8).toUpperCase()}</span>
              <button className="a-modal-close" onClick={() => setDetailsModalOpen(false)}><X size={18} /></button>
            </div>
            <div className="a-modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ marginBottom: 12, color: 'var(--a-text-bright)' }}>Informations Client</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: '0.9rem' }}>
                  <div>
                    <span style={{ color: 'var(--a-text-muted)' }}>Nom:</span>
                    <span style={{ marginLeft: 8, color: 'var(--a-text)' }}>{selectedOrder.customerName || 'N/A'}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--a-text-muted)' }}>Téléphone:</span>
                    <span style={{ marginLeft: 8, color: 'var(--a-text)' }}>{selectedOrder.customerPhone || 'N/A'}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--a-text-muted)' }}>Email:</span>
                    <span style={{ marginLeft: 8, color: 'var(--a-text)', wordBreak: 'break-all' }}>{selectedOrder.customerEmail || selectedOrder.userId}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--a-text-muted)' }}>Statut:</span>
                    <span style={{ marginLeft: 8 }}><StatusBadge type="order" value={selectedOrder.status || 'pending'} /></span>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <h4 style={{ marginBottom: 12, color: 'var(--a-text-bright)' }}>Adresse de Livraison</h4>
                <div style={{ fontSize: '0.9rem', color: 'var(--a-text)' }}>
                  <div>{selectedOrder.customerAddress || 'Adresse non spécifiée'}</div>
                  <div>{selectedOrder.customerGovernorate || ''}</div>
                </div>
              </div>



              {selectedOrder.deliveryNotes && (
                <div style={{ marginBottom: 20 }}>
                  <h4 style={{ marginBottom: 12, color: 'var(--a-text-bright)' }}>Instructions de Livraison</h4>
                  <div style={{ padding: 12, background: 'var(--a-sidebar)', borderRadius: 8, fontSize: '0.9rem', color: 'var(--a-text)' }}>
                    {selectedOrder.deliveryNotes}
                  </div>
                </div>
              )}

              <div style={{ marginBottom: 20 }}>
                <h4 style={{ marginBottom: 12, color: 'var(--a-text-bright)' }}>Articles Commandés</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {getOrderProducts(selectedOrder.productIds, selectedOrder.items).map((item: any, idx: number) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'var(--a-sidebar)', borderRadius: 8 }}>
                      <img src={item?.img || 'https://via.placeholder.com/50'} alt={item?.name} style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 4 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500, color: 'var(--a-text-bright)' }}>{item?.name || 'Produit inconnu'}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--a-text-muted)' }}>Quantité: {item?.quantity || 1}</div>
                        {item?.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--a-text-muted)', marginTop: 4 }}>
                            Options: {Object.entries(item.selectedOptions).map(([key, val]) => `${key}: ${val}`).join(', ')}
                          </div>
                        )}
                      </div>
                      <div style={{ fontWeight: 700, color: 'var(--a-success)' }}>
                        {((item?.price || 0) * (item?.quantity || 1)).toFixed(2)} DT
                      </div>
                    </div>
                  ))}
                  {getOrderProducts(selectedOrder.productIds, selectedOrder.items).length === 0 && (
                    <div style={{ color: 'var(--a-text-muted)', fontSize: '0.9rem' }}>Aucun produit trouvé</div>
                  )}
                </div>
              </div>

              <div style={{ padding: 16, background: 'var(--a-sidebar)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--a-text-bright)' }}>Total</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--a-success)' }}>{selectedOrder.total?.toFixed(2)} DT</span>
              </div>
            </div>
            <div className="a-modal-footer">
              <div style={{ display: 'flex', gap: 12, width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--a-text-muted)' }}>Changer statut:</span>
                  <select
                    className="a-input"
                    value={selectedOrder.status || 'pending'}
                    onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value)}
                    style={{ width: 150, padding: '4px 8px' }}
                  >
                    <option value="pending">En attente</option>
                    <option value="processing">Préparation</option>
                    <option value="shipped">Expédié</option>
                    <option value="delivered">Livré</option>
                    <option value="expired">Expiré</option>
                    <option value="cancelled">Annulé</option>
                  </select>
                </div>
                <button className="a-btn a-btn-ghost" onClick={() => setDetailsModalOpen(false)}>Fermer</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title="Supprimer la commande"
        message="Êtes-vous sûr de vouloir supprimer cette commande ? Cette action est irréversible."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmOpen(false)}
      />

      {ToastComponent}
    </>
  );
};

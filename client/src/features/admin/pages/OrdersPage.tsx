import React, { useState } from 'react';
import { useAdmin } from '../../../context/AdminContext';
import { Search, Eye, Trash2, X, Printer, User, Phone, Mail, MapPin, CreditCard, Calendar, Package, FileText } from 'lucide-react';
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

  // Revenue statistics for filtered view (strictly delivered counts as Revenue)
  const filteredDeliveredTotal = filtered
    .filter(o => o.status === 'delivered')
    .reduce((sum, o) => sum + (o.total || 0), 0);
  const filteredPendingTotal = filtered
    .filter(o => o.status !== 'delivered' && o.status !== 'cancelled' && o.status !== 'expired')
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
          gap: 20,
          flexWrap: 'wrap',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 10,
          padding: '12px 18px',
          marginBottom: 16,
          fontSize: '0.85rem'
        }}>
          <div>
            <span style={{ color: '#64748b', fontWeight: 600 }}>Revenu Réel (Commandes Livrées): </span>
            <strong style={{ color: '#0d2b6b', fontSize: '0.95rem' }}>{filteredDeliveredTotal.toFixed(2)} DT</strong>
          </div>
          <div>
            <span style={{ color: '#64748b', fontWeight: 600 }}>Commandes En Cours / En Attente: </span>
            <strong style={{ color: '#d97706' }}>{filteredPendingTotal.toFixed(2)} DT</strong>
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
                    <span style={{ fontFamily: 'monospace', color: '#0d2b6b', fontSize: '0.85rem', fontWeight: 700 }}>
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
          <div className="a-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '720px', width: '90vw' }}>
            
            {/* Modal Header */}
            <div className="a-modal-header" style={{ padding: '1.15rem 1.5rem', borderBottom: '1px solid var(--a-border)' }}>
              <div>
                <span className="a-modal-title" style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                  Commande #{(selectedOrder.id || 'N/A').toString().slice(-8).toUpperCase()}
                </span>
                <div style={{ fontSize: '0.8rem', color: 'var(--a-text-muted)', marginTop: '2px' }}>
                  Reçue le {new Date(selectedOrder.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <StatusBadge type="order" value={selectedOrder.status || 'pending'} />
                <button className="a-modal-close" onClick={() => setDetailsModalOpen(false)}><X size={18} /></button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="a-modal-body" style={{ maxHeight: '70vh', overflowY: 'auto', padding: '1.5rem' }}>
              
              {/* Summary info cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem', background: '#f8fafc', padding: '1.15rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0d2b6b', textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '0.04em' }}>Client</div>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>{selectedOrder.customerName || 'N/A'}</div>
                  {selectedOrder.customerPhone && <div style={{ fontSize: '0.85rem', color: '#334155', marginTop: '2px' }}>Tél: {selectedOrder.customerPhone}</div>}
                  <div style={{ fontSize: '0.82rem', color: '#64748b', wordBreak: 'break-all', marginTop: '2px' }}>{selectedOrder.customerEmail || selectedOrder.userId}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0d2b6b', textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '0.04em' }}>Livraison</div>
                  <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>{selectedOrder.customerAddress || 'Adresse non spécifiée'}</div>
                  <div style={{ fontSize: '0.85rem', color: '#0d2b6b', fontWeight: 700, marginTop: '2px' }}>{selectedOrder.customerGovernorate || ''}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0d2b6b', textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '0.04em' }}>Paiement</div>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem' }}>{selectedOrder.paymentMethod || 'Paiement à la livraison'}</div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: selectedOrder.paymentStatus === 'paid' ? '#15803d' : '#b45309', marginTop: '4px' }}>
                    {selectedOrder.paymentStatus === 'paid' ? '✔ Payé' : '⏳ À régler à la livraison'}
                  </div>
                </div>
              </div>

              {selectedOrder.deliveryNotes && (
                <div style={{ marginBottom: '1.25rem', padding: '0.85rem 1rem', background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '10px', fontSize: '0.85rem', color: '#92400e' }}>
                  <strong>Instructions de livraison:</strong> {selectedOrder.deliveryNotes}
                </div>
              )}

              {/* Items List */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>
                  Articles commandés ({getOrderProducts(selectedOrder.productIds, selectedOrder.items).reduce((acc: number, item: any) => acc + (item?.quantity || 1), 0)})
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {getOrderProducts(selectedOrder.productIds, selectedOrder.items).map((item: any, idx: number) => {
                    const price = item?.unitPrice || item?.price || 0;
                    const qty = item?.quantity || 1;
                    const itemTotal = price * qty;
                    const img = item?.img || item?.image || 'https://via.placeholder.com/50';

                    return (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                          <img src={img} alt={item?.name} style={{ width: 44, height: 44, objectFit: 'contain', borderRadius: 8, background: '#ffffff', padding: 2, border: '1px solid #e2e8f0' }} />
                          <div>
                            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>{item?.name || 'Produit'}</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                              {qty} x {Number(price).toFixed(3)} DT
                            </div>
                            {item?.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                                {Object.entries(item.selectedOptions).map(([k, v]) => `${k}: ${v}`).join(', ')}
                              </div>
                            )}
                          </div>
                        </div>
                        <div style={{ fontWeight: 800, color: '#0d2b6b', fontSize: '0.98rem' }}>
                          {Number(itemTotal).toFixed(3)} DT
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Total Banner */}
              <div style={{ background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>Montant Total Règlement</span>
                <span style={{ fontSize: '1.55rem', fontWeight: 900, color: '#0d2b6b' }}>
                  {Number(selectedOrder.total || 0).toFixed(3)} DT
                </span>
              </div>

            </div>


            {/* Modal Footer */}
            <div className="a-modal-footer" style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--a-border)' }}>
              <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Statut:</span>
                  <select
                    className="a-input"
                    value={selectedOrder.status || 'pending'}
                    onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value)}
                    style={{ width: 150, padding: '4px 8px', fontWeight: 600 }}
                  >
                    <option value="pending">En attente</option>
                    <option value="processing">Préparation</option>
                    <option value="shipped">Expédié</option>
                    <option value="delivered">Livré</option>
                    <option value="expired">Expiré</option>
                    <option value="cancelled">Annulé</option>
                  </select>
                </div>

                <div>
                  <button className="a-btn a-btn-ghost" onClick={() => setDetailsModalOpen(false)}>Fermer</button>
                </div>
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

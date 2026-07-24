import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../../context/AdminContext';
import { Search, Eye, Trash2, ShieldAlert, ShieldCheck, X } from 'lucide-react';
import { useToast } from '../components/Toast';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Pagination } from '../components/Pagination';
import { StatusBadge } from '../components/StatusBadge';
import { SkeletonLoader } from '../components/SkeletonLoader';
import * as api from '../../../services/api';

export const CustomersPage: React.FC = () => {
  const { users, deleteUser, blockUser, unblockUser, loading, fetchUsers } = useAdmin();
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  const { showToast, ToastComponent } = useToast();

  useEffect(() => {
    fetchUsers(currentPage, itemsPerPage, search);
  }, [currentPage, search]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleBlockToggle = async (user: any) => {
    try {
      if (user.isBlocked) {
        await unblockUser(user.id);
        showToast(`Client ${user.name} a été débloqué`, 'success');
      } else {
        await blockUser(user.id);
        showToast(`Client ${user.name} a été bloqué`, 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Impossible de mettre à jour le statut du client', 'error');
    }
  };

  const openUserProfile = async (userId: string) => {
    setLoadingProfile(true);
    setProfileModalOpen(true);
    try {
      const data = await api.getUserById(userId);
      if (data) {
        setSelectedUser(data.user);
        setUserOrders(data.orders || []);
      } else {
        showToast('Impossible de charger le profil', 'error');
        setProfileModalOpen(false);
      }
    } catch (err: any) {
      showToast(err.message || 'Erreur lors du chargement du profil', 'error');
      setProfileModalOpen(false);
    } finally {
      setLoadingProfile(false);
    }
  };

  const triggerDelete = (id: string) => {
    setUserToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (userToDelete) {
      try {
        await deleteUser(userToDelete);
        showToast('Client supprimé avec succès', 'success');
      } catch (err: any) {
        showToast(err.message || 'Échec de la suppression', 'error');
      } finally {
        setUserToDelete(null);
      }
    }
  };

  // Safe filtration - backend paginates but local check handles client sync
  const filteredUsers = users.filter(u => u.statut !== 'admin');

  return (
    <>
      <div className="admin-page-header">
        <div>
          <div className="admin-page-title">Clients</div>
          <div className="admin-page-sub">Gérez les comptes clients de votre plateforme</div>
        </div>
      </div>

      <div className="a-card">
        <div style={{ marginBottom: 16 }}>
          <div className="a-input-wrap" style={{ maxWidth: 400 }}>
            <span className="a-input-icon"><Search size={15} /></span>
            <input 
              className="a-input" 
              placeholder="Rechercher par nom, email ou téléphone..." 
              value={search} 
              onChange={handleSearchChange} 
            />
          </div>
        </div>

        {loading ? (
          <SkeletonLoader type="table" />
        ) : (
          <div className="a-table-wrap">
            <table className="a-table">
              <thead>
                <tr>
                  <th>Nom / ID</th>
                  <th>Email</th>
                  <th>Téléphone</th>
                  <th>Commandes</th>
                  <th>Inscription</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="admin-user-avatar-badge">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ color: 'var(--a-text-bright)', fontWeight: 500 }}>{u.name}</div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--a-text-muted)' }}>ID: {u.id.slice(0, 8)}...</span>
                        </div>
                      </div>
                    </td>
                    <td>{u.email}</td>
                    <td>{u.phone || '—'}</td>
                    <td>
                      <span className="a-badge a-badge-blue">
                        {u.ordersCount ?? 0} commande(s)
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--a-text-muted)' }}>
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td>
                      <StatusBadge type="user" value={String(u.isBlocked)} />
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="a-btn a-btn-ghost a-btn-sm" onClick={() => openUserProfile(u.id)} title="Voir le profil">
                          <Eye size={13} />
                        </button>
                        <button 
                          className={`a-btn ${u.isBlocked ? 'a-btn-success' : 'a-btn-warning'} a-btn-sm`} 
                          onClick={() => handleBlockToggle(u)}
                          title={u.isBlocked ? 'Débloquer le client' : 'Bloquer le client'}
                        >
                          {u.isBlocked ? <ShieldCheck size={13} /> : <ShieldAlert size={13} />}
                        </button>
                        <button className="a-btn a-btn-danger a-btn-sm" onClick={() => triggerDelete(u.id)} title="Supprimer le compte">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={7}>
                      <div className="a-empty">
                        <div className="a-empty-icon">👥</div>
                        <div className="a-empty-text">Aucun client trouvé</div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <Pagination 
          currentPage={currentPage} 
          totalPages={1} // backend pages should ideally be managed, but local list provides fallback
          onPageChange={setCurrentPage} 
        />
      </div>

      {/* Customer Profile Modal */}
      {profileModalOpen && (
        <div className="a-modal-overlay" onClick={() => setProfileModalOpen(false)}>
          <div className="a-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '650px' }}>
            <div className="a-modal-header">
              <span className="a-modal-title">👤 Profil Client</span>
              <button className="a-modal-close" onClick={() => setProfileModalOpen(false)}><X size={18} /></button>
            </div>
            <div className="a-modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {loadingProfile || !selectedUser ? (
                <div style={{ padding: 40, textAlign: 'center' }}>Chargement du profil...</div>
              ) : (
                <>
                  {/* General Info */}
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--a-border)' }}>
                    <div style={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      background: 'var(--a-accent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      color: '#ffffff'
                    }}>
                      {selectedUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, color: 'var(--a-text-bright)' }}>{selectedUser.name}</h3>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--a-text-muted)' }}>ID: {selectedUser.id}</p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24, fontSize: '0.9rem' }}>
                    <div>
                      <strong style={{ color: 'var(--a-text-bright)' }}>Adresse Email:</strong>
                      <div style={{ color: 'var(--a-text-muted)', marginTop: 4 }}>{selectedUser.email}</div>
                    </div>
                    <div>
                      <strong style={{ color: 'var(--a-text-bright)' }}>Téléphone:</strong>
                      <div style={{ color: 'var(--a-text-muted)', marginTop: 4 }}>{selectedUser.phone || '—'}</div>
                    </div>
                    <div>
                      <strong style={{ color: 'var(--a-text-bright)' }}>Adresse de Livraison:</strong>
                      <div style={{ color: 'var(--a-text-muted)', marginTop: 4 }}>
                        {selectedUser.address ? `${selectedUser.address}, ${selectedUser.city}, ${selectedUser.governorate}` : '—'}
                      </div>
                    </div>
                    <div>
                      <strong style={{ color: 'var(--a-text-bright)' }}>Statut du Compte:</strong>
                      <div style={{ marginTop: 4 }}>
                        <StatusBadge type="user" value={String(selectedUser.isBlocked)} />
                      </div>
                    </div>
                  </div>

                  {/* Order History */}
                  <div>
                    <h4 style={{ marginBottom: 12, color: 'var(--a-text-bright)' }}>Historique des Commandes ({userOrders.length})</h4>
                    {userOrders.length === 0 ? (
                      <div style={{ color: 'var(--a-text-muted)', fontSize: '0.9rem', padding: 12, background: 'var(--a-sidebar)', borderRadius: 8, textAlign: 'center' }}>
                        Aucune commande passée par ce client.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {userOrders.map(order => (
                          <div key={order._id || order.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, background: 'var(--a-sidebar)', borderRadius: 8, fontSize: '0.85rem' }}>
                            <div>
                              <span style={{ fontWeight: 600, color: 'var(--a-accent)', fontFamily: 'monospace' }}>
                                #{(order._id || order.id).toString().slice(-8).toUpperCase()}
                              </span>
                              <span style={{ marginLeft: 12, color: 'var(--a-text-muted)' }}>
                                {new Date(order.date).toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <span style={{ fontWeight: 600, color: 'var(--a-success)' }}>{order.total.toFixed(2)} DT</span>
                              <StatusBadge type="order" value={order.status} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            <div className="a-modal-footer">
              <button className="a-btn a-btn-ghost" onClick={() => setProfileModalOpen(false)}>Fermer</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title="Supprimer le compte"
        message="Êtes-vous sûr de vouloir supprimer le compte de ce client ? Les informations de profil et l'historique d'achat associés seront définitivement effacés."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmOpen(false)}
      />

      {ToastComponent}
    </>
  );
};

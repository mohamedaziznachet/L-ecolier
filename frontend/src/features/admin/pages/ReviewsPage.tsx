import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchReviews, removeReview } from '../../../store/reviewsSlice';
import { RootState, AppDispatch } from '../../../store';
import { Search, Trash2, Star, MessageSquare } from 'lucide-react';
import { useToast } from '../components/Toast';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Pagination } from '../components/Pagination';
import { SkeletonLoader } from '../components/SkeletonLoader';

export const ReviewsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { items: reviews, total, loading } = useSelector((state: RootState) => state.reviews);
  
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);
  
  const { showToast, ToastComponent } = useToast();

  useEffect(() => {
    dispatch(fetchReviews({ page: currentPage, limit: itemsPerPage, search }));
  }, [dispatch, currentPage, search]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const triggerDelete = (id: string) => {
    setReviewToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (reviewToDelete) {
      try {
        await dispatch(removeReview({
          id: reviewToDelete,
          page: currentPage,
          limit: itemsPerPage,
          search
        })).unwrap();
        showToast('Avis supprimé avec succès', 'success');
      } catch (err: any) {
        showToast(err.message || 'Échec de la suppression', 'error');
      } finally {
        setReviewToDelete(null);
      }
    }
  };

  const totalPages = Math.ceil(total / itemsPerPage);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, idx) => (
      <Star 
        key={idx} 
        size={14} 
        fill={idx < rating ? '#f59e0b' : 'none'} 
        color={idx < rating ? '#f59e0b' : 'var(--a-text-muted)'} 
        style={{ marginRight: 2 }}
      />
    ));
  };

  return (
    <>
      <div className="admin-page-header">
        <div>
          <div className="admin-page-title">Avis clients</div>
          <div className="admin-page-sub">Gérez et modérez les avis produits soumis par vos clients ({total})</div>
        </div>
      </div>

      <div className="a-card">
        <div style={{ marginBottom: 16 }}>
          <div className="a-input-wrap" style={{ maxWidth: 400 }}>
            <span className="a-input-icon"><Search size={15} /></span>
            <input 
              className="a-input" 
              placeholder="Rechercher par produit, client ou commentaire..." 
              value={search} 
              onChange={handleSearchChange} 
            />
          </div>
        </div>

        {loading && reviews.length === 0 ? (
          <SkeletonLoader type="table" />
        ) : (
          <div className="a-table-wrap">
            <table className="a-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Produit</th>
                  <th>Note</th>
                  <th>Commentaire</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map(r => (
                  <tr key={r._id || r.id}>
                    <td>
                      <div style={{ fontWeight: 500, color: 'var(--a-text-bright)' }}>{r.customerName}</div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--a-text-muted)' }}>ID Client: {r.userId}</span>
                    </td>
                    <td style={{ color: 'var(--a-accent)', fontWeight: 500 }}>
                      {r.productName || `ID Produit: ${r.productId}`}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        {renderStars(r.rating)}
                      </div>
                    </td>
                    <td style={{ maxWidth: 280, whiteSpace: 'normal', fontSize: '0.85rem' }}>
                      {r.comment ? (
                        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                          <MessageSquare size={14} style={{ marginTop: 2, flexShrink: 0, color: 'var(--a-text-muted)' }} />
                          <span>{r.comment}</span>
                        </div>
                      ) : (
                        <span style={{ fontStyle: 'italic', color: 'var(--a-text-muted)' }}>Pas de commentaire</span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--a-text-muted)' }}>
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td>
                      <button className="a-btn a-btn-danger a-btn-sm" onClick={() => triggerDelete(r._id || r.id || '')}>
                        <Trash2 size={13} style={{ marginRight: 6 }} /> Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
                {reviews.length === 0 && (
                  <tr>
                    <td colSpan={6}>
                      <div className="a-empty">
                        <div className="a-empty-icon">⭐</div>
                        <div className="a-empty-text">Aucun avis trouvé</div>
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
          totalPages={totalPages} 
          onPageChange={setCurrentPage} 
        />
      </div>

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title="Supprimer l'avis client"
        message="Êtes-vous sûr de vouloir supprimer cet avis client ? Cette action est irréversible et supprimera définitivement l'avis de la boutique."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmOpen(false)}
      />

      {ToastComponent}
    </>
  );
};

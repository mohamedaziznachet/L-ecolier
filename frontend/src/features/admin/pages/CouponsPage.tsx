import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchCoupons, createCoupon, editCoupon, removeCoupon } from '../../../store/couponsSlice';
import { RootState, AppDispatch } from '../../../store';
import { Search, Plus, Edit2, Trash2, X, Tag, Layers } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '../components/Toast';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Pagination } from '../components/Pagination';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { getCategories } from '../../../services/api';

const couponSchema = z.object({
  code: z.string().min(3, 'Le code doit contenir au moins 3 caractères').toUpperCase(),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.coerce.number().min(1, 'La valeur de remise doit être supérieure à 0'),
  minOrderAmount: z.coerce.number().min(0, 'Le montant minimum doit être positif').optional(),
  expiresAt: z.string().min(1, 'La date d\'expiration est requise'),
  isActive: z.boolean().default(true),
});

export const CouponsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { items: coupons, loading } = useSelector((state: RootState) => state.coupons);
  
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState<string | null>(null);
  
  const { showToast, ToastComponent } = useToast();

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      code: '',
      discountType: 'percentage' as const,
      discountValue: 10,
      minOrderAmount: 0,
      expiresAt: '',
      isActive: true,
    }
  });

  useEffect(() => {
    dispatch(fetchCoupons());
    getCategories().then(setAllCategories);
  }, [dispatch]);

  const filtered = useMemo(() => {
    return coupons.filter(c => 
      c.code.toLowerCase().includes(search.toLowerCase())
    );
  }, [coupons, search]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const openAdd = () => {
    setEditId(null);
    setSelectedCategories([]);
    reset({
      code: '',
      discountType: 'percentage',
      discountValue: 0,
      minOrderAmount: 0,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      isActive: true,
    });
    setModalOpen(true);
  };

  const openEdit = (coupon: any) => {
    setEditId(coupon._id || coupon.id);
    setSelectedCategories(coupon.applicableCategories || []);
    reset({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderAmount: coupon.minOrderAmount || 0,
      expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().split('T')[0] : '',
      isActive: coupon.isActive !== false,
    });
    setModalOpen(true);
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const onSubmit = async (values: any) => {
    try {
      const payload = {
        ...values,
        applicableCategories: selectedCategories,
      };
      if (editId) {
        await dispatch(editCoupon({ id: editId, data: payload })).unwrap();
        showToast('Code promo mis à jour avec succès', 'success');
      } else {
        await dispatch(createCoupon(payload)).unwrap();
        showToast('Code promo créé avec succès', 'success');
      }
      setModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Erreur lors de l\'enregistrement', 'error');
    }
  };

  const triggerDelete = (id: string) => {
    setCouponToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (couponToDelete) {
      try {
        await dispatch(removeCoupon(couponToDelete)).unwrap();
        showToast('Code promo supprimé avec succès', 'success');
      } catch (err: any) {
        showToast(err.message || 'Échec de la suppression', 'error');
      } finally {
        setCouponToDelete(null);
      }
    }
  };

  const isExpired = (expiryDateStr: string) => {
    return new Date(expiryDateStr) < new Date();
  };

  return (
    <>
      <div className="admin-page-header">
        <div>
          <div className="admin-page-title">Codes Promo</div>
          <div className="admin-page-sub">Gérez les bons de réduction pour vos clients ({coupons.length})</div>
        </div>
        <button className="a-btn a-btn-primary" onClick={openAdd}>
          <Plus size={16} /> Créer un Code Promo
        </button>
      </div>

      <div className="a-card">
        <div style={{ marginBottom: 16 }}>
          <div className="a-input-wrap" style={{ maxWidth: 400 }}>
            <span className="a-input-icon"><Search size={15} /></span>
            <input 
              className="a-input" 
              placeholder="Rechercher par code..." 
              value={search} 
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} 
            />
          </div>
        </div>

        {loading && coupons.length === 0 ? (
          <SkeletonLoader type="table" />
        ) : (
          <div className="a-table-wrap">
            <table className="a-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Type de Remise</th>
                  <th>Valeur</th>
                  <th>Achat Min.</th>
                  <th>Catégories d'application</th>
                  <th>Date d'expiration</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map(c => {
                  const expired = isExpired(c.expiresAt);
                  const cats = c.applicableCategories || [];
                  return (
                    <tr key={c._id || c.id}>
                      <td style={{ fontWeight: 600, color: 'var(--a-text-bright)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Tag size={14} style={{ color: 'var(--a-accent)' }} />
                          {c.code}
                        </div>
                      </td>
                      <td>
                        {c.discountType === 'percentage' ? 'Pourcentage (%)' : 'Montant Fixe (DT)'}
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--a-success)' }}>
                        {c.discountValue} {c.discountType === 'percentage' ? '%' : 'DT'}
                      </td>
                      <td>{c.minOrderAmount ? `${c.minOrderAmount} DT` : 'Aucun'}</td>
                      <td>
                        {cats.length === 0 ? (
                          <span className="a-badge" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                            Toutes les catégories
                          </span>
                        ) : (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: 200 }}>
                            {cats.map((cat, idx) => (
                              <span key={idx} className="a-badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontSize: '0.72rem' }}>
                                {cat}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{ color: expired ? '#ef4444' : 'inherit' }}>
                          {new Date(c.expiresAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                          {expired && <span style={{ fontSize: '0.75rem', marginLeft: 6, color: '#ef4444', fontWeight: 600 }}>(Expiré)</span>}
                        </span>
                      </td>
                      <td>
                        <span className={`a-badge ${c.isActive && !expired ? 'a-badge-green' : 'a-badge-red'}`}>
                          {c.isActive && !expired ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="a-btn a-btn-ghost a-btn-sm" onClick={() => openEdit(c)}>
                            <Edit2 size={13} />
                          </button>
                          <button className="a-btn a-btn-danger a-btn-sm" onClick={() => triggerDelete(c._id || c.id || '')}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8}>
                      <div className="a-empty">
                        <div className="a-empty-icon">🏷️</div>
                        <div className="a-empty-text">Aucun code promo trouvé</div>
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

      {/* Modal Dialog */}
      {modalOpen && (
        <div className="a-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="a-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="a-modal-header">
              <span className="a-modal-title">{editId ? '✏️ Modifier le Code Promo' : '✨ Nouveau Code Promo'}</span>
              <button className="a-modal-close" onClick={() => setModalOpen(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="a-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                
                <div className="a-field">
                  <label>Code de réduction</label>
                  <input className="a-input" placeholder="Ex: RENTREE2026" style={{ textTransform: 'uppercase' }} {...register('code')} />
                  {errors.code && <span className="a-error">{errors.code.message}</span>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="a-field">
                    <label>Type de réduction</label>
                    <select className="a-input" {...register('discountType')}>
                      <option value="percentage">Pourcentage (%)</option>
                      <option value="fixed">Montant fixe (DT)</option>
                    </select>
                  </div>
                  <div className="a-field">
                    <label>Valeur de réduction</label>
                    <input type="number" className="a-input" {...register('discountValue')} />
                    {errors.discountValue && <span className="a-error">{errors.discountValue.message}</span>}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="a-field">
                    <label>Achat Minimum (DT)</label>
                    <input type="number" className="a-input" placeholder="Ex: 50" {...register('minOrderAmount')} />
                    {errors.minOrderAmount && <span className="a-error">{errors.minOrderAmount.message}</span>}
                  </div>
                  <div className="a-field">
                    <label>Date d'expiration</label>
                    <input type="date" className="a-input" {...register('expiresAt')} />
                    {errors.expiresAt && <span className="a-error">{errors.expiresAt.message}</span>}
                  </div>
                </div>

                <div className="a-field">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                    <Layers size={15} style={{ color: 'var(--a-accent)' }} /> Catégories éligibles
                  </label>
                  <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: 6 }}>
                    Sélectionnez les catégories auxquelles s'applique la réduction (si aucune n'est sélectionnée, le coupon s'applique à <strong>toutes les catégories</strong>).
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxHeight: 150, overflowY: 'auto', padding: 8, background: 'rgba(255, 255, 255, 0.05)', borderRadius: 6, border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    {allCategories.map(cat => {
                      const isChecked = selectedCategories.includes(cat);
                      return (
                        <label key={cat} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '4px 8px', borderRadius: 4, background: isChecked ? 'rgba(59, 130, 246, 0.2)' : 'transparent', fontSize: '0.85rem' }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleCategory(cat)}
                          />
                          <span>{cat}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="a-field" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" id="isActive" {...register('isActive')} style={{ width: 18, height: 18 }} />
                  <label htmlFor="isActive" style={{ cursor: 'pointer' }}>Activer immédiatement</label>
                </div>

              </div>
              <div className="a-modal-footer">
                <button type="button" className="a-btn a-btn-ghost" onClick={() => setModalOpen(false)}>Annuler</button>
                <button type="submit" className="a-btn a-btn-primary">
                  {editId ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title="Supprimer le code promo"
        message="Êtes-vous sûr de vouloir supprimer ce code promo ? Les clients ne pourront plus l'utiliser pour obtenir des remises."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmOpen(false)}
      />

      {ToastComponent}
    </>
  );
};

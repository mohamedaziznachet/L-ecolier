import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchBrands, createBrand, editBrand, removeBrand } from '../../../store/brandsSlice';
import { RootState, AppDispatch } from '../../../store';
import { Search, Plus, Edit2, Trash2, X, Image as ImageIcon, Upload } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '../components/Toast';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Pagination } from '../components/Pagination';
import { SkeletonLoader } from '../components/SkeletonLoader';

const brandSchema = z.object({
  name: z.string().min(2, 'Le nom doit faire au moins 2 caractères'),
  logo: z.string().default(''),
  description: z.string().default(''),
});

export const BrandsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { items: brands, loading } = useSelector((state: RootState) => state.brands);
  
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  const [uploading, setUploading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [brandToDelete, setBrandToDelete] = useState<string | null>(null);
  
  const { showToast, ToastComponent } = useToast();

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<any>({
    resolver: zodResolver(brandSchema),
    defaultValues: { name: '', logo: '', description: '' }
  });

  const watchLogo = watch('logo');

  useEffect(() => {
    dispatch(fetchBrands());
  }, [dispatch]);

  const filtered = useMemo(() => {
    return brands.filter(b => 
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      (b.description || '').toLowerCase().includes(search.toLowerCase())
    );
  }, [brands, search]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const openAdd = () => {
    setEditId(null);
    reset({ name: '', logo: '', description: '' });
    setModalOpen(true);
  };

  const openEdit = (brand: any) => {
    setEditId(brand._id || brand.id);
    reset({
      name: brand.name,
      logo: brand.logo || '',
      description: brand.description || '',
    });
    setModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const token = localStorage.getItem('ecolier_token');
      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setValue('logo', data.imageUrl);
        showToast('Logo téléchargé avec succès!', 'success');
      } else {
        showToast('Échec du téléchargement du logo', 'error');
      }
    } catch (error) {
      console.error('Upload error:', error);
      showToast('Erreur lors du téléchargement du logo', 'error');
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (values: any) => {
    try {
      if (editId) {
        await dispatch(editBrand({ id: editId, data: values })).unwrap();
        showToast('Marque mise à jour avec succès', 'success');
      } else {
        await dispatch(createBrand(values)).unwrap();
        showToast('Marque ajoutée avec succès', 'success');
      }
      setModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Erreur lors de l\'enregistrement', 'error');
    }
  };

  const triggerDelete = (id: string) => {
    setBrandToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (brandToDelete) {
      try {
        await dispatch(removeBrand(brandToDelete)).unwrap();
        showToast('Marque supprimée avec succès', 'success');
      } catch (err: any) {
        showToast(err.message || 'Échec de la suppression', 'error');
      } finally {
        setBrandToDelete(null);
      }
    }
  };

  return (
    <>
      <div className="admin-page-header">
        <div>
          <div className="admin-page-title">Marques</div>
          <div className="admin-page-sub">Gérez les marques des produits en vente ({brands.length})</div>
        </div>
        <button className="a-btn a-btn-primary" onClick={openAdd}>
          <Plus size={16} /> Ajouter une Marque
        </button>
      </div>

      <div className="a-card">
        <div style={{ marginBottom: 16 }}>
          <div className="a-input-wrap" style={{ maxWidth: 400 }}>
            <span className="a-input-icon"><Search size={15} /></span>
            <input 
              className="a-input" 
              placeholder="Rechercher une marque..." 
              value={search} 
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} 
            />
          </div>
        </div>

        {loading && brands.length === 0 ? (
          <SkeletonLoader type="table" />
        ) : (
          <div className="a-table-wrap">
            <table className="a-table">
              <thead>
                <tr>
                  <th>Logo</th>
                  <th>Nom de la Marque</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map(brand => (
                  <tr key={brand._id || brand.id}>
                    <td>
                      {brand.logo ? (
                        <img src={brand.logo} alt={brand.name} className="a-table-img" style={{ objectFit: 'contain' }} />
                      ) : (
                        <div style={{
                          width: 40,
                          height: 40,
                          borderRadius: 4,
                          background: 'var(--a-border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--a-text-muted)'
                        }}>
                          <ImageIcon size={18} />
                        </div>
                      )}
                    </td>
                    <td style={{ color: 'var(--a-text-bright)', fontWeight: 500 }}>{brand.name}</td>
                    <td style={{ maxWidth: 300, whiteSpace: 'normal', color: 'var(--a-text-muted)' }}>
                      {brand.description || '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="a-btn a-btn-ghost a-btn-sm" onClick={() => openEdit(brand)}>
                          <Edit2 size={13} />
                        </button>
                        <button className="a-btn a-btn-danger a-btn-sm" onClick={() => triggerDelete(brand._id || brand.id || '')}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4}>
                      <div className="a-empty">
                        <div className="a-empty-icon">🏷️</div>
                        <div className="a-empty-text">Aucune marque trouvée</div>
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
          <div className="a-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="a-modal-header">
              <span className="a-modal-title">{editId ? '✏️ Modifier la Marque' : '✨ Nouvelle Marque'}</span>
              <button className="a-modal-close" onClick={() => setModalOpen(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="a-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                
                <div className="a-field">
                  <label>Nom de la marque</label>
                  <input className="a-input" placeholder="Ex: Maped" {...register('name')} />
                  {errors.name && <span className="a-error">{errors.name.message as string}</span>}
                </div>

                <div className="a-field">
                  <label>Description</label>
                  <textarea className="a-input a-textarea" placeholder="Courte description" {...register('description')} rows={3} />
                </div>

                <div className="a-field">
                  <label>Logo de la marque</label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input className="a-input" placeholder="URL du logo" {...register('logo')} style={{ flex: 1 }} />
                    <label className="a-btn a-btn-primary" style={{ cursor: 'pointer', padding: '8px 14px', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <Upload size={14} />
                      <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                      {uploading ? '⏳ Chargement...' : '📤 Téléverser Logo'}
                    </label>
                  </div>
                  {watchLogo && (
                    <div style={{ marginTop: 8, padding: 8, background: '#ffffff', borderRadius: 4, display: 'inline-block' }}>
                      <img src={watchLogo} alt="Aperçu" style={{ height: 40, objectFit: 'contain' }} />
                    </div>
                  )}
                </div>

              </div>
              <div className="a-modal-footer">
                <button type="button" className="a-btn a-btn-ghost" onClick={() => setModalOpen(false)}>Annuler</button>
                <button type="submit" className="a-btn a-btn-primary">
                  {editId ? 'Enregistrer' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title="Supprimer la marque"
        message="Êtes-vous sûr de vouloir supprimer cette marque ? Les produits associés ne seront pas supprimés, mais n'auront plus de marque associée."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmOpen(false)}
      />

      {ToastComponent}
    </>
  );
};

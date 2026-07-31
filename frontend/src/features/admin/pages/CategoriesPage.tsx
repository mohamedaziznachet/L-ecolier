import React, { useState, useMemo } from 'react';
import { useAdmin } from '../../../context/AdminContext';
import { Search, Plus, Trash2, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '../components/Toast';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Pagination } from '../components/Pagination';

const categorySchema = z.object({
  name: z.string().min(2, 'Le nom de la catégorie doit avoir au moins 2 caractères'),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

export const CategoriesPage: React.FC = () => {
  const { categories, addCategory, deleteCategory, products } = useAdmin();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  
  const { showToast, ToastComponent } = useToast();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '' }
  });

  // Calculate product counts per category
  const categoriesWithCounts = useMemo(() => {
    return categories.map(catName => {
      const count = products.filter(p => p.category === catName).length;
      return {
        name: catName,
        productCount: count
      };
    });
  }, [categories, products]);

  // Filter categories
  const filtered = useMemo(() => {
    return categoriesWithCounts.filter(cat => 
      cat.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [categoriesWithCounts, search]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const onSubmit = async (values: CategoryFormValues) => {
    try {
      await addCategory(values.name.trim());
      showToast('Catégorie ajoutée avec succès', 'success');
      setModalOpen(false);
      reset();
    } catch (err: any) {
      showToast(err.message || 'Impossible d\'ajouter la catégorie', 'error');
    }
  };

  const triggerDelete = (categoryName: string) => {
    setCategoryToDelete(categoryName);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (categoryToDelete) {
      try {
        await deleteCategory(categoryToDelete);
        showToast('Catégorie supprimée avec succès', 'success');
      } catch (err: any) {
        showToast(err.message || 'Impossible de supprimer la catégorie', 'error');
      } finally {
        setCategoryToDelete(null);
      }
    }
  };

  return (
    <>
      <div className="admin-page-header">
        <div>
          <div className="admin-page-title">Catégories</div>
          <div className="admin-page-sub">Gérez les catégories disponibles pour vos produits ({categories.length})</div>
        </div>
        <button className="a-btn a-btn-primary" onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Ajouter une Catégorie
        </button>
      </div>

      <div className="a-card">
        <div style={{ marginBottom: 16 }}>
          <div className="a-input-wrap" style={{ maxWidth: 400 }}>
            <span className="a-input-icon"><Search size={15} /></span>
            <input 
              className="a-input" 
              placeholder="Rechercher une catégorie..." 
              value={search} 
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} 
            />
          </div>
        </div>

        <div className="a-table-wrap">
          <table className="a-table">
            <thead>
              <tr>
                <th>Nom de la Catégorie</th>
                <th>Nombre de Produits</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map(cat => (
                <tr key={cat.name}>
                  <td style={{ color: 'var(--a-text-bright)', fontWeight: 500 }}>{cat.name}</td>
                  <td>
                    <span className="a-badge a-badge-blue">
                      {cat.productCount} produit(s)
                    </span>
                  </td>
                  <td>
                    <button 
                      className="a-btn a-btn-danger a-btn-sm" 
                      onClick={() => triggerDelete(cat.name)}
                    >
                      <Trash2 size={13} style={{ marginRight: 6 }} /> Supprimer
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={3}>
                    <div className="a-empty">
                      <div className="a-empty-icon">🏷️</div>
                      <div className="a-empty-text">Aucune catégorie trouvée</div>
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

      {/* Modal Dialog */}
      {modalOpen && (
        <div className="a-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="a-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="a-modal-header">
              <span className="a-modal-title">✨ Nouvelle Catégorie</span>
              <button className="a-modal-close" onClick={() => setModalOpen(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="a-modal-body">
                <div className="a-field">
                  <label>Nom de la catégorie</label>
                  <input 
                    className="a-input" 
                    placeholder="Ex: Sacs à dos" 
                    {...register('name')} 
                    autoFocus
                  />
                  {errors.name && <span className="a-error">{errors.name.message}</span>}
                </div>
              </div>
              <div className="a-modal-footer">
                <button type="button" className="a-btn a-btn-ghost" onClick={() => setModalOpen(false)}>Annuler</button>
                <button type="submit" className="a-btn a-btn-primary">Ajouter</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title="Supprimer la catégorie"
        message={`Êtes-vous sûr de vouloir supprimer la catégorie "${categoryToDelete}" ? Tous les produits associés resteront en boutique mais seront classés sous "Autre".`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmOpen(false)}
      />

      {ToastComponent}
    </>
  );
};

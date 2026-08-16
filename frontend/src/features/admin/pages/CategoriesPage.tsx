import React, { useState, useMemo, useEffect } from 'react';
import { useAdmin } from '../../../context/AdminContext';
import { Search, Plus, Trash2, X, Image as ImageIcon, Save, Check, Upload, Link } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '../components/Toast';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Pagination } from '../components/Pagination';
import { useLayout } from '../../../context/LayoutContext';
import * as api from '../../../services/api';

const categorySchema = z.object({
  name: z.string().min(2, 'Le nom de la catégorie doit avoir au moins 2 caractères'),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface HomeCatItem {
  label: string;
  img: string;
  color?: string;
}

export const CategoriesPage: React.FC = () => {
  const { categories, addCategory, deleteCategory, products } = useAdmin();
  const { layout, saveSetting, refreshLayout } = useLayout();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  const [homeCategories, setHomeCategories] = useState<HomeCatItem[]>([]);
  const [categoryImages, setCategoryImages] = useState<Record<string, string>>({});
  const [savingHomeCats, setSavingHomeCats] = useState(false);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);

  // Subcategories State
  const [fullCategoriesMap, setFullCategoriesMap] = useState<Record<string, string[]>>({});
  const [newSubInputMap, setNewSubInputMap] = useState<Record<string, string>>({});

  const { showToast, ToastComponent } = useToast();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '' }
  });

  useEffect(() => {
    if (layout) {
      if (layout["category_images"] && typeof layout["category_images"] === 'object') {
        setCategoryImages(layout["category_images"]);
      }
      if (Array.isArray(layout["home_categories"])) {
        setHomeCategories(layout["home_categories"]);
      } else if (categories && categories.length > 0) {
        const initial = categories.slice(0, 8).map(c => ({
          label: c,
          img: layout["category_images"]?.[c] || products.find(p => p.category === c)?.img || ''
        }));
        setHomeCategories(initial);
      }
    }
  }, [layout, categories, products]);

  const loadFullCategories = async () => {
    try {
      const docs = await api.getFullAdminCategories();
      const map: Record<string, string[]> = {};
      docs.forEach((d: any) => {
        if (d.name) {
          const names = (d.subcategories || []).map((s: any) => typeof s === 'string' ? s : s.name);
          map[d.name] = Array.from(new Set(names));
        }
      });
      setFullCategoriesMap(map);
    } catch (err) {
      console.error("Failed to load full categories:", err);
    }
  };

  useEffect(() => {
    loadFullCategories();
  }, [categories]);

  const handleAddSubCategory = async (categoryName: string) => {
    const subName = (newSubInputMap[categoryName] || '').trim();
    if (!subName) return;
    try {
      await api.addSubCategoryApi(categoryName, subName);
      setNewSubInputMap(prev => ({ ...prev, [categoryName]: '' }));
      await loadFullCategories();
      showToast(`Sous-catégorie "${subName}" ajoutée à "${categoryName}"`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Erreur lors de l\'ajout', 'error');
    }
  };

  const handleDeleteSubCategory = async (categoryName: string, subName: string) => {
    try {
      await api.deleteSubCategoryApi(categoryName, subName);
      await loadFullCategories();
      showToast(`Sous-catégorie "${subName}" supprimée`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Erreur lors de la suppression', 'error');
    }
  };

  // Calculate product counts per category & resolve category image
  const categoriesWithCounts = useMemo(() => {
    return categories.map(catName => {
      const count = products.filter(p => p.category === catName).length;
      const isHome = homeCategories.some(h => h.label.toLowerCase() === catName.toLowerCase());
      
      const customImg = categoryImages[catName] || homeCategories.find(h => h.label.toLowerCase() === catName.toLowerCase())?.img || '';
      const fallbackImg = products.find(p => p.category === catName)?.img || '';
      const displayImg = customImg || fallbackImg;

      return {
        name: catName,
        productCount: count,
        isHome,
        displayImg,
        customImg
      };
    });
  }, [categories, products, homeCategories, categoryImages]);

  // Filter categories
  const filtered = useMemo(() => {
    return categoriesWithCounts.filter(cat => 
      cat.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [categoriesWithCounts, search]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const updateAndSaveCategoryImage = async (categoryName: string, newImg: string) => {
    const updatedImages = {
      ...categoryImages,
      [categoryName]: newImg
    };
    setCategoryImages(updatedImages);

    // Update in homeCategories if present
    const updatedHomeCats = homeCategories.map(h => {
      if (h.label.toLowerCase() === categoryName.toLowerCase()) {
        return { ...h, img: newImg };
      }
      return h;
    });
    setHomeCategories(updatedHomeCats);

    try {
      await saveSetting('category_images', updatedImages);
      await saveSetting('home_categories', updatedHomeCats);
      await refreshLayout();
      showToast(`Image de la catégorie "${categoryName}" enregistrée!`, 'success');
    } catch (err: any) {
      console.error('Failed to save category image setting:', err);
      showToast('Erreur lors de la sauvegarde de l\'image', 'error');
    }
  };

  const handleUploadImageForCategory = async (categoryName: string, file: File) => {
    try {
      setUploadingFor(categoryName);
      const url = await api.uploadImage(file);
      await updateAndSaveCategoryImage(categoryName, url);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Erreur lors du téléchargement de l\'image', 'error');
    } finally {
      setUploadingFor(null);
    }
  };

  const toggleHomeCategory = (categoryName: string) => {
    const exists = homeCategories.some(h => h.label.toLowerCase() === categoryName.toLowerCase());
    let updated: HomeCatItem[];

    if (exists) {
      updated = homeCategories.filter(h => h.label.toLowerCase() !== categoryName.toLowerCase());
    } else {
      const catObj = categoriesWithCounts.find(c => c.name === categoryName);
      updated = [...homeCategories, { label: categoryName, img: catObj?.displayImg || '' }];
    }

    setHomeCategories(updated);
    saveSetting('home_categories', updated).then(() => refreshLayout());
  };

  const saveHomeCategoriesConfig = async () => {
    try {
      setSavingHomeCats(true);
      await saveSetting('home_categories', homeCategories);
      await saveSetting('category_images', categoryImages);
      await refreshLayout();
      showToast('Configuration des catégories d\'accueil enregistrée!', 'success');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Erreur lors de l\'enregistrement', 'error');
    } finally {
      setSavingHomeCats(false);
    }
  };

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
          <div className="admin-page-title">Gestion des Catégories & Images d'Accueil</div>
          <div className="admin-page-sub">Téléchargez une image pour chaque catégorie et sélectionnez celles à afficher sur la page d'accueil ({categories.length})</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="a-btn a-btn-secondary" onClick={saveHomeCategoriesConfig} disabled={savingHomeCats}>
            <Save size={16} /> {savingHomeCats ? 'Enregistrement...' : 'Enregistrer la Sélection d\'Accueil'}
          </button>
          <button className="a-btn a-btn-primary" onClick={() => setModalOpen(true)}>
            <Plus size={16} /> Nouvelle Catégorie
          </button>
        </div>
      </div>

      {/* Selected Home Categories Bar */}
      <div className="a-card" style={{ marginBottom: 24 }}>
        <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <ImageIcon size={20} style={{ color: 'var(--c-primary)' }} />
          🏠 Catégories Affichées sur la Page d'Accueil ({homeCategories.length})
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--a-text-muted)', marginBottom: 16 }}>
          Chaque catégorie possède sa propre image d'illustration. Cliquez sur "Changer l'image" dans le tableau ci-dessous pour modifier l'image d'une catégorie.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {homeCategories.map((item, i) => (
            <div
              key={`${item.label}-${i}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 14px',
                borderRadius: 8,
                backgroundColor: 'var(--a-bg-hover)',
                border: '1px solid var(--a-border)',
                fontSize: '0.9rem'
              }}
            >
              {item.img ? (
                <img src={item.img} alt={item.label} style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover', border: '1px solid var(--a-border)' }} />
              ) : (
                <span>🏷️</span>
              )}
              <span style={{ fontWeight: 600 }}>{item.label}</span>
              <button
                type="button"
                onClick={() => toggleHomeCategory(item.label)}
                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0, marginLeft: 4 }}
                title="Retirer de l'accueil"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
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
                <th>Afficher sur l'Accueil</th>
                <th>Nom de la Catégorie</th>
                <th>Sous-Catégories</th>
                <th>Image de la Catégorie</th>
                <th>Modifier / URL de l'Image</th>
                <th>Nombre de Produits</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map(cat => (
                <tr key={cat.name}>
                  <td>
                    <button
                      type="button"
                      className={`a-btn ${cat.isHome ? 'a-btn-primary' : 'a-btn-ghost'} a-btn-sm`}
                      onClick={() => toggleHomeCategory(cat.name)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      {cat.isHome ? <Check size={14} /> : null}
                      {cat.isHome ? 'Sur l\'Accueil' : 'Ajouter à l\'Accueil'}
                    </button>
                  </td>

                  <td style={{ color: 'var(--a-text-bright)', fontWeight: 600 }}>{cat.name}</td>

                  {/* Subcategories Tags & Add Input */}
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: 280 }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {(fullCategoriesMap[cat.name] || []).map((sub: string) => (
                          <span
                            key={sub}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: '0.75rem',
                              padding: '2px 8px',
                              borderRadius: 12,
                              backgroundColor: 'var(--a-bg-hover, #f1f5f9)',
                              color: 'var(--a-text-bright, #0f172a)',
                              border: '1px solid var(--a-border, #e2e8f0)'
                            }}
                          >
                            {sub}
                            <X
                              size={12}
                              style={{ cursor: 'pointer', color: 'var(--c-danger, #ef4444)' }}
                              onClick={() => handleDeleteSubCategory(cat.name, sub)}
                            />
                          </span>
                        ))}
                      </div>

                      <div style={{ display: 'flex', gap: 4 }}>
                        <input
                          className="a-input"
                          placeholder="Nouvelle sous-catégorie..."
                          value={newSubInputMap[cat.name] || ''}
                          onChange={e => setNewSubInputMap({ ...newSubInputMap, [cat.name]: e.target.value })}
                          onKeyDown={e => e.key === 'Enter' && handleAddSubCategory(cat.name)}
                          style={{ fontSize: '0.75rem', padding: '3px 6px', flex: 1 }}
                        />
                        <button
                          type="button"
                          className="a-btn a-btn-primary a-btn-sm"
                          onClick={() => handleAddSubCategory(cat.name)}
                          style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </td>

                  {/* Category Image Preview */}
                  <td>
                    {cat.displayImg ? (
                      <img
                        src={cat.displayImg}
                        alt={cat.name}
                        style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--a-border)' }}
                      />
                    ) : (
                      <div style={{ width: 48, height: 48, borderRadius: 8, backgroundColor: 'var(--a-bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: 'var(--a-text-muted)', border: '1px border-dashed var(--a-border)' }}>
                        Pas d'img
                      </div>
                    )}
                  </td>

                  {/* Upload / URL Input */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, maxWidth: 360 }}>
                      <label className="a-btn a-btn-secondary a-btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                        <Upload size={13} />
                        {uploadingFor === cat.name ? 'Envoi...' : 'Parcourir'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={e => {
                            const f = e.target.files?.[0];
                            if (f) handleUploadImageForCategory(cat.name, f);
                          }}
                          style={{ display: 'none' }}
                          disabled={uploadingFor === cat.name}
                        />
                      </label>
                      <input
                        className="a-input"
                        placeholder="URL de l'image (/uploads/...)"
                        value={cat.customImg}
                        onChange={e => updateAndSaveCategoryImage(cat.name, e.target.value)}
                        style={{ fontSize: '0.8rem', padding: '4px 8px' }}
                      />
                    </div>
                  </td>

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
                  <td colSpan={6}>
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

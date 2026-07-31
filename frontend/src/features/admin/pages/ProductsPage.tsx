import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../../context/AdminContext';
import { useSelector, useDispatch } from 'react-redux';
import { fetchBrands } from '../../../store/brandsSlice';
import { RootState, AppDispatch } from '../../../store';
import { Search, Plus, Edit2, Trash2, ArrowUpDown, X, Star } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '../components/Toast';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Pagination } from '../components/Pagination';
import { StatusBadge } from '../components/StatusBadge';
import { AvailabilityBadge } from '../../../components/common/AvailabilityBadge';

const productSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  description: z.string().default(''),
  price: z.string().min(1, 'Le prix d\'affichage est requis'),
  priceNum: z.coerce.number().min(0, 'Le prix numérique doit être positif'),
  oldPrice: z.string().default(''),
  priceBeforeDiscount: z.coerce.number().min(0).nullable().optional(),
  discount: z.coerce.number().min(0).max(100).default(0),
  schoolLevel: z.string().default(''),
  stock: z.coerce.number().min(0, 'Le stock doit être positif'),
  availability: z.enum(['En stock', 'En arrivage', 'Sur commande', 'Epuisé']).default('En stock'),
  category: z.string().min(1, 'Veuillez sélectionner une catégorie'),
  brand: z.string().default(''),
  img: z.string().min(1, 'L\'image est requise'),
  badge: z.string().default(''),
  badgeColor: z.string().default(''),
  rating: z.coerce.number().min(0).max(5).default(0),
  reviews: z.coerce.number().min(0).default(0),
  featured: z.boolean().default(false),
  status: z.enum(['active', 'inactive']).default('active'),
});

export const ProductsPage: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct, categories } = useAdmin();
  const dispatch = useDispatch<AppDispatch>();
  const { items: brands } = useSelector((state: RootState) => state.brands);
  
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | string | null>(null);
  
  const [uploading, setUploading] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | number | null>(null);

  // Comprehensive additional properties
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [specifications, setSpecifications] = useState<{ key: string; value: string }[]>([]);
  const [newGalleryInput, setNewGalleryInput] = useState('');
  
  const { showToast, ToastComponent } = useToast();

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      price: '',
      priceNum: 0,
      oldPrice: '',
      priceBeforeDiscount: null as number | null,
      discount: 0,
      schoolLevel: '',
      stock: 0,
      availability: 'En stock' as const,
      category: '',
      brand: '',
      img: '',
      badge: '',
      badgeColor: '',
      rating: 5,
      reviews: 0,
      featured: false,
      status: 'active' as const,
    }
  });

  const watchImg = watch('img');

  useEffect(() => {
    dispatch(fetchBrands());
  }, [dispatch]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredAndSorted = products
    .filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchCat = selectedCategory ? p.category === selectedCategory : true;
      const matchBrand = selectedBrand ? p.brand === selectedBrand : true;
      return matchSearch && matchCat && matchBrand;
    })
    .sort((a, b) => {
      const fieldA = (a as any)[sortField];
      const fieldB = (b as any)[sortField];
      if (typeof fieldA === 'string') {
        return sortOrder === 'asc' ? fieldA.localeCompare(fieldB) : fieldB.localeCompare(fieldA);
      }
      return sortOrder === 'asc' ? fieldA - fieldB : fieldB - fieldA;
    });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage);
  const paginatedItems = filteredAndSorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const openAdd = () => {
    setEditId(null);
    setAdditionalImages([]);
    setSpecifications([]);
    setNewGalleryInput('');
    reset({
      name: '', description: '', price: '', priceNum: 0, oldPrice: '', priceBeforeDiscount: null, discount: 0, schoolLevel: '', stock: 0, availability: 'En stock', category: '', brand: '', img: '', badge: '', badgeColor: '', rating: 5, reviews: 0, featured: false, status: 'active'
    });
    setModalOpen(true);
  };

  const openEdit = (product: any) => {
    setEditId(product.id);
    setAdditionalImages(Array.isArray(product.images) ? product.images.filter((img: string) => img !== product.img) : []);
    setSpecifications(
      Array.isArray(product.specifications)
        ? product.specifications.map((s: any) => ({
            key: s.key || s.name || s.label || '',
            value: s.value || s.val || ''
          }))
        : []
    );
    setNewGalleryInput('');
    reset({
      name: product.name,
      description: product.description || '',
      price: product.price,
      priceNum: product.priceNum,
      oldPrice: product.oldPrice || '',
      priceBeforeDiscount: product.priceBeforeDiscount || null,
      discount: product.discount || 0,
      schoolLevel: product.schoolLevel || '',
      stock: product.stock,
      availability: product.availability || 'En stock',
      category: product.category,
      brand: product.brand || '',
      img: product.img,
      badge: product.badge || '',
      badgeColor: product.badgeColor || '',
      rating: product.rating !== undefined ? product.rating : 5,
      reviews: product.reviews || 0,
      featured: product.featured || false,
      status: product.status || 'active',
    });
    setModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isGallery = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isGallery) setUploadingGallery(true);
    else setUploading(true);

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
        if (isGallery) {
          setAdditionalImages(prev => [...prev, data.imageUrl]);
          showToast('Image ajoutée à la galerie!', 'success');
        } else {
          setValue('img', data.imageUrl);
          showToast('Image principale téléchargée avec succès!', 'success');
        }
      } else {
        showToast('Échec du téléchargement', 'error');
      }
    } catch (error) {
      console.error('Upload error:', error);
      showToast('Erreur lors du téléchargement de l\'image', 'error');
    } finally {
      if (isGallery) setUploadingGallery(false);
      else setUploading(false);
    }
  };

  const addGalleryImageFromInput = () => {
    if (newGalleryInput.trim()) {
      setAdditionalImages(prev => [...prev, newGalleryInput.trim()]);
      setNewGalleryInput('');
    }
  };

  const removeGalleryImage = (index: number) => {
    setAdditionalImages(prev => prev.filter((_, i) => i !== index));
  };

  const addSpecification = () => {
    setSpecifications(prev => [...prev, { key: '', value: '' }]);
  };

  const updateSpecification = (index: number, key: string, value: string) => {
    setSpecifications(prev => {
      const copy = [...prev];
      copy[index] = { key, value };
      return copy;
    });
  };

  const removeSpecification = (index: number) => {
    setSpecifications(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (values: z.infer<typeof productSchema>) => {
    try {
      const finalImages = Array.from(new Set([values.img, ...additionalImages].filter(Boolean)));
      const cleanSpecs = specifications.filter(s => s.key.trim() || s.value.trim());

      const payload = {
        ...values,
        images: finalImages,
        specifications: cleanSpecs,
      };

      if (editId !== null) {
        await updateProduct(editId, payload as any);
        showToast('Produit mis à jour avec succès', 'success');
      } else {
        await addProduct(payload as any);
        showToast('Produit créé avec succès', 'success');
      }
      setModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Erreur lors de l\'enregistrement', 'error');
    }
  };

  const triggerDelete = (id: string | number) => {
    setProductToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (productToDelete !== null) {
      try {
        await deleteProduct(productToDelete);
        showToast('Produit supprimé avec succès', 'success');
      } catch (err: any) {
        showToast(err.message || 'Échec de la suppression', 'error');
      } finally {
        setProductToDelete(null);
      }
    }
  };


  return (
    <>
      <div className="admin-page-header">
        <div>
          <div className="admin-page-title">Produits</div>
          <div className="admin-page-sub">{products.length} produits enregistrés</div>
        </div>
        <button className="a-btn a-btn-primary" onClick={openAdd}>
          <Plus size={16} /> Ajouter un Produit
        </button>
      </div>

      <div className="a-card">
        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <div className="a-input-wrap" style={{ flex: 1, minWidth: 200 }}>
            <span className="a-input-icon"><Search size={15} /></span>
            <input 
              className="a-input" 
              placeholder="Rechercher un produit..." 
              value={search} 
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} 
            />
          </div>
          <select 
            className="a-input" 
            value={selectedCategory} 
            onChange={e => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
            style={{ width: 200 }}
          >
            <option value="">Toutes les catégories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select 
            className="a-input" 
            value={selectedBrand} 
            onChange={e => { setSelectedBrand(e.target.value); setCurrentPage(1); }}
            style={{ width: 200 }}
          >
            <option value="">Toutes les marques</option>
            {brands.map(brand => (
              <option key={brand._id || brand.id} value={brand.name}>{brand.name}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="a-table-wrap">
          <table className="a-table">
            <thead>
              <tr>
                <th>Image</th>
                <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                  Nom <ArrowUpDown size={12} style={{ marginLeft: 4 }} />
                </th>
                <th onClick={() => handleSort('priceNum')} style={{ cursor: 'pointer' }}>
                  Prix <ArrowUpDown size={12} style={{ marginLeft: 4 }} />
                </th>
                <th onClick={() => handleSort('stock')} style={{ cursor: 'pointer' }}>
                  Stock <ArrowUpDown size={12} style={{ marginLeft: 4 }} />
                </th>
                <th>Disponibilité</th>
                <th>Catégorie</th>
                <th>Marque</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map(p => (
                <tr key={p.id}>
                  <td><img src={p.img || 'https://via.placeholder.com/40'} alt={p.name} className="a-table-img" /></td>
                  <td style={{ color: 'var(--a-text-bright)', fontWeight: 500 }}>
                    {p.name}
                    {p.featured && <Star size={12} fill="#f59e0b" color="#f59e0b" style={{ marginLeft: 6, display: 'inline' }} />}
                  </td>
                  <td>
                    <span className="a-badge a-badge-green">{p.price}</span>
                    {p.oldPrice ? <span style={{ fontSize: '0.75rem', textDecoration: 'line-through', color: 'var(--a-text-muted)', marginLeft: 6 }}>{p.oldPrice}</span> : null}
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: (p.stock || 0) <= 5 ? '#ef4444' : 'inherit' }}>
                      {p.stock ?? 0}
                    </span>
                  </td>
                  <td>
                    <AvailabilityBadge availability={p.availability} size="sm" />
                  </td>
                  <td><span className="a-badge a-badge-blue">{p.category || '—'}</span></td>
                  <td>{p.brand || '—'}</td>
                  <td>
                    <StatusBadge type="product" value={p.status || 'active'} />
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="a-btn a-btn-ghost a-btn-sm" onClick={() => openEdit(p)}>
                        <Edit2 size={13} />
                      </button>
                      <button className="a-btn a-btn-danger a-btn-sm" onClick={() => triggerDelete(p.id)}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredAndSorted.length === 0 && (
                <tr>
                  <td colSpan={9}>
                    <div className="a-empty">
                      <div className="a-empty-icon">🔍</div>
                      <div className="a-empty-text">Aucun produit trouvé</div>
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

      {/* Comprehensive Product Modal Dialog */}
      {modalOpen && (
        <div className="a-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="a-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '720px' }}>
            <div className="a-modal-header">
              <span className="a-modal-title">{editId !== null ? '✏️ Modifier le Produit' : '✨ Nouveau Produit'}</span>
              <button className="a-modal-close" onClick={() => setModalOpen(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="a-modal-body" style={{ maxHeight: '72vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
                
                {/* 1. Basic Info Section */}
                <div style={{ borderBottom: '1px solid var(--a-border)', paddingBottom: 16 }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', fontWeight: 600, color: 'var(--a-text-bright)' }}>
                    📦 Informations Générales
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div className="a-field">
                      <label>Nom du produit *</label>
                      <input className="a-input" placeholder="Ex: Cartable Sac à dos Ergo-Lux" {...register('name')} />
                      {errors.name && <span className="a-error">{errors.name.message}</span>}
                    </div>

                    <div className="a-field">
                      <label>Description détaillée *</label>
                      <textarea 
                        className="a-input a-textarea" 
                        placeholder="Saisissez la description complète du produit (caractéristiques, matière, avantages...)" 
                        {...register('description')} 
                        rows={4} 
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div className="a-field">
                        <label>Catégorie *</label>
                        <select className="a-input" {...register('category')}>
                          <option value="">Sélectionnez une catégorie</option>
                          {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                        {errors.category && <span className="a-error">{errors.category.message}</span>}
                      </div>
                      <div className="a-field">
                        <label>Marque</label>
                        <select className="a-input" {...register('brand')}>
                          <option value="">Sélectionnez une marque</option>
                          {brands.map(brand => (
                            <option key={brand._id || brand.id} value={brand.name}>{brand.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="a-field">
                      <label>Statut du Produit</label>
                      <select className="a-input" {...register('status')}>
                        <option value="active">Actif (Visible sur le site)</option>
                        <option value="inactive">Inactif (Masqué)</option>
                      </select>
                    </div>

                    <div className="a-field" style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <input type="checkbox" id="featured" {...register('featured')} style={{ width: 18, height: 18, cursor: 'pointer' }} />
                      <label htmlFor="featured" style={{ cursor: 'pointer', fontWeight: 500 }}>
                        ⭐ Mettre ce produit en vedette (Featured / Coup de Cœur)
                      </label>
                    </div>
                  </div>
                </div>

                {/* 2. Tarification et Stock */}
                <div style={{ borderBottom: '1px solid var(--a-border)', paddingBottom: 16 }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', fontWeight: 600, color: 'var(--a-text-bright)' }}>
                    💰 Tarification et Inventaire
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div className="a-field">
                        <label>Prix d'affichage (ex: 45,000 DT) *</label>
                        <input className="a-input" placeholder="45,000 DT" {...register('price')} />
                        {errors.price && <span className="a-error">{errors.price.message}</span>}
                      </div>
                      <div className="a-field">
                        <label>Prix numérique (ex: 45) *</label>
                        <input type="number" step="0.001" className="a-input" placeholder="45" {...register('priceNum')} />
                        {errors.priceNum && <span className="a-error">{errors.priceNum.message}</span>}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                      <div className="a-field">
                        <label>Ancien Prix texte (ex: 60,000 DT)</label>
                        <input className="a-input" placeholder="60,000 DT" {...register('oldPrice')} />
                      </div>
                      <div className="a-field">
                        <label>Prix avant remise (num)</label>
                        <input type="number" step="0.001" className="a-input" placeholder="60" {...register('priceBeforeDiscount')} />
                      </div>
                      <div className="a-field">
                        <label>Remise (%)</label>
                        <input type="number" min="0" max="100" className="a-input" placeholder="25" {...register('discount')} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div className="a-field">
                        <label>Quantité en stock *</label>
                        <input type="number" className="a-input" placeholder="10" {...register('stock')} />
                        {errors.stock && <span className="a-error">{errors.stock.message}</span>}
                      </div>
                      <div className="a-field">
                        <label>Disponibilité sur le site *</label>
                        <select className="a-input" {...register('availability')}>
                          <option value="En stock">En stock</option>
                          <option value="En arrivage">En arrivage</option>
                          <option value="Sur commande">Sur commande</option>
                          <option value="Epuisé">Epuisé</option>
                        </select>
                        {errors.availability && <span className="a-error">{errors.availability.message}</span>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Media & Badges */}
                <div style={{ borderBottom: '1px solid var(--a-border)', paddingBottom: 16 }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', fontWeight: 600, color: 'var(--a-text-bright)' }}>
                    🖼️ Images & Badges
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div className="a-field">
                      <label>Image Principale du produit *</label>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input className="a-input" placeholder="URL de l'image principale" {...register('img')} style={{ flex: 1 }} />
                        <label className="a-btn a-btn-ghost" style={{ cursor: 'pointer', padding: '8px 12px' }}>
                          <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, false)} style={{ display: 'none' }} />
                          {uploading ? '⏳ Téléchargement...' : '📤 Choisir fichier'}
                        </label>
                      </div>
                      {errors.img && <span className="a-error">{errors.img.message}</span>}
                      {watchImg && (
                        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                          <img
                            key={watchImg}
                            src={watchImg}
                            alt="Aperçu"
                            style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--a-border)' }}
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                          <button
                            type="button"
                            className="a-btn a-btn-danger a-btn-sm"
                            onClick={() => setValue('img', '')}
                          >
                            Effacer
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Additional Images Gallery */}
                    <div className="a-field">
                      <label>Galerie d'Images Additionnelles</label>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input 
                          className="a-input" 
                          placeholder="URL d'une image secondaire" 
                          value={newGalleryInput}
                          onChange={e => setNewGalleryInput(e.target.value)}
                          style={{ flex: 1 }} 
                        />
                        <button type="button" className="a-btn a-btn-ghost" onClick={addGalleryImageFromInput}>
                          Ajouter URL
                        </button>
                        <label className="a-btn a-btn-ghost" style={{ cursor: 'pointer', padding: '8px 12px' }}>
                          <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, true)} style={{ display: 'none' }} />
                          {uploadingGallery ? '⏳' : '📤 Upload'}
                        </label>
                      </div>

                      {additionalImages.length > 0 && (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                          {additionalImages.map((url, idx) => (
                            <div key={idx} style={{ position: 'relative', width: 60, height: 60 }}>
                              <img
                                src={url}
                                alt={`Gallerie ${idx + 1}`}
                                style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--a-border)' }}
                              />
                              <button
                                type="button"
                                onClick={() => removeGalleryImage(idx)}
                                style={{
                                  position: 'absolute',
                                  top: -5,
                                  right: -5,
                                  backgroundColor: '#ef4444',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '50%',
                                  width: 18,
                                  height: 18,
                                  fontSize: '11px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div className="a-field">
                        <label>Texte du Badge (ex: Nouveau, Promo, -20%)</label>
                        <input className="a-input" placeholder="ex: Nouveau" {...register('badge')} />
                      </div>
                      <div className="a-field">
                        <label>Couleur du badge (ex: #e53935)</label>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input className="a-input" placeholder="ex: #e53935" {...register('badgeColor')} style={{ flex: 1 }} />
                          <input 
                            type="color" 
                            style={{ width: 38, height: 38, padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}
                            onChange={e => setValue('badgeColor', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Notes et Avis */}
                <div style={{ borderBottom: '1px solid var(--a-border)', paddingBottom: 16 }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', fontWeight: 600, color: 'var(--a-text-bright)' }}>
                    ⭐ Evaluatons & Avis Clients
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="a-field">
                      <label>Note Moyenne (0 à 5)</label>
                      <input type="number" step="0.1" min="0" max="5" className="a-input" {...register('rating')} />
                      {errors.rating && <span className="a-error">{errors.rating.message}</span>}
                    </div>
                    <div className="a-field">
                      <label>Nombre d'avis clients</label>
                      <input type="number" min="0" className="a-input" {...register('reviews')} />
                      {errors.reviews && <span className="a-error">{errors.reviews.message}</span>}
                    </div>
                  </div>
                </div>

                {/* 5. Dynamic Specifications */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--a-text-bright)' }}>
                      📋 Spécifications Techniques
                    </h4>
                    <button type="button" className="a-btn a-btn-ghost a-btn-sm" onClick={addSpecification}>
                      + Ajouter une spécification
                    </button>
                  </div>

                  {specifications.length === 0 ? (
                    <div style={{ fontSize: '0.82rem', color: 'var(--a-text-muted)', fontStyle: 'italic' }}>
                      Aucune spécification technique ajoutée (ex: Matériau = Polyester, Dimensions = 30x40cm).
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {specifications.map((spec, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <input
                            className="a-input"
                            placeholder="Nom (ex: Matière)"
                            value={spec.key}
                            onChange={e => updateSpecification(idx, e.target.value, spec.value)}
                            style={{ flex: 1 }}
                          />
                          <input
                            className="a-input"
                            placeholder="Valeur (ex: Tissu Imperméable)"
                            value={spec.value}
                            onChange={e => updateSpecification(idx, spec.key, e.target.value)}
                            style={{ flex: 1 }}
                          />
                          <button
                            type="button"
                            className="a-btn a-btn-danger a-btn-sm"
                            onClick={() => removeSpecification(idx)}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
              <div className="a-modal-footer">
                <button type="button" className="a-btn a-btn-ghost" onClick={() => setModalOpen(false)}>Annuler</button>
                <button type="submit" className="a-btn a-btn-primary">
                  {editId !== null ? 'Enregistrer les modifications' : 'Ajouter le produit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title="Supprimer le produit"
        message="Êtes-vous sûr de vouloir supprimer ce produit ? Cette action est irréversible."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmOpen(false)}
      />

      {ToastComponent}
    </>
  );
};

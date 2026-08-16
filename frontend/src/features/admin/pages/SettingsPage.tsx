import React, { useState, useEffect } from 'react';
import * as api from '../../../services/api';
import { Save, Upload, Image as ImageIcon } from 'lucide-react';
import { useToast } from '../components/Toast';
import { useLayout } from '../../../context/LayoutContext';

export const SettingsPage: React.FC = () => {
  const { layout, refreshLayout, saveSetting } = useLayout();
  const [settings, setSettings] = useState<api.SiteSettings>({
    siteName: "L'Écolier",
    siteEmail: 'ecolier.librairie@gmail.com',
    sitePhone: '+216 58 982 121',
    siteAddress: 'Tunisie',
    currency: 'DT',
    taxRate: '19',
    shippingFee: '8',
    maintenanceMode: false
  });

  const [heroBgImage, setHeroBgImage] = useState<string>('');
  const [heroSettings, setHeroSettings] = useState({
    badge: 'Rentrée 2026',
    titleMain: 'LA RENTRÉE',
    titleAccent: 'SCOLAIRE 2026',
    description: "Tout ce qu'il faut pour\nréussir votre année !",
    ctaCategory: 'Sacs à dos'
  });

  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const { showToast, ToastComponent } = useToast();

  useEffect(() => {
    const fetchSettings = async () => {
      const data = await api.getSettings();
      setSettings(data);
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (layout) {
      if (layout["hero_bg_image"]) {
        setHeroBgImage(layout["hero_bg_image"]);
      }
      if (layout["hero"]) {
        setHeroSettings(prev => ({ ...prev, ...layout["hero"] }));
      }
    }
  }, [layout]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingImg(true);
      const url = await api.uploadImage(file);
      setHeroBgImage(url);
      showToast('Image téléchargée avec succès!', 'success');
    } catch (err: any) {
      console.error('Failed to upload image:', err);
      showToast(err.message || 'Échec du téléchargement de l\'image', 'error');
    } finally {
      setUploadingImg(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.saveSettings(settings);
      await saveSetting('hero_bg_image', heroBgImage);
      await saveSetting('hero', heroSettings);
      await refreshLayout();
      showToast('Paramètres et bannières d\'accueil sauvegardés avec succès!', 'success');
    } catch (err: any) {
      console.error('Failed to save settings:', err);
      showToast(err.message || 'Erreur lors de la sauvegarde', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="admin-page-header">
        <div>
          <div className="admin-page-title">Paramètres du Site & Bannières</div>
          <div className="admin-page-sub">Configurez les paramètres généraux et les images de la page d'accueil</div>
        </div>
        <button className="a-btn a-btn-primary" onClick={handleSave} disabled={saving}>
          <Save size={16} style={{ marginRight: 8 }} />
          {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24 }}>
        {/* Home Page Images & Banners */}
        <div className="a-card" style={{ gridColumn: '1 / -1' }}>
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ImageIcon size={20} style={{ color: 'var(--c-primary)' }} />
            🖼️ Images & Bannières de la Page d'Accueil
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginTop: 16 }}>
            {/* Image Preview / Upload Box */}
            <div className="a-field">
              <label>Image de fond de la section Rentrée (Hero)</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {heroBgImage ? (
                  <div style={{ position: 'relative', width: '100%', height: 180, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--a-border)' }}>
                    <img src={heroBgImage} alt="Hero Background" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      type="button"
                      onClick={() => setHeroBgImage('')}
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        backgroundColor: 'rgba(239, 68, 68, 0.9)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 4,
                        padding: '4px 8px',
                        cursor: 'pointer',
                        fontSize: '0.8rem'
                      }}
                    >
                      Supprimer
                    </button>
                  </div>
                ) : (
                  <div style={{ padding: '2rem', textAlign: 'center', border: '2px dashed var(--a-border)', borderRadius: 8, backgroundColor: 'var(--a-bg-hover)' }}>
                    <ImageIcon size={32} style={{ color: 'var(--a-text-muted)', marginBottom: 8 }} />
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--a-text-muted)' }}>Aucune image personnalisée. La vidéo par défaut est affichée.</p>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <label className="a-btn a-btn-primary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                    <Upload size={16} />
                    {uploadingImg ? 'Téléchargement...' : '📤 Téléverser Fichier Fond'}
                    <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} disabled={uploadingImg} />
                  </label>
                  <input
                    className="a-input"
                    placeholder="Ou collez l'URL de l'image (/uploads/...)"
                    value={heroBgImage}
                    onChange={e => setHeroBgImage(e.target.value)}
                    style={{ flex: 1 }}
                  />
                </div>
              </div>
            </div>

            {/* Banner Titles & Text */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="a-field">
                <label>Badge promotionnel (ex: Rentrée 2026)</label>
                <input
                  className="a-input"
                  value={heroSettings.badge}
                  onChange={e => setHeroSettings(prev => ({ ...prev, badge: e.target.value }))}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="a-field">
                  <label>Titre principal</label>
                  <input
                    className="a-input"
                    value={heroSettings.titleMain}
                    onChange={e => setHeroSettings(prev => ({ ...prev, titleMain: e.target.value }))}
                  />
                </div>
                <div className="a-field">
                  <label>Titre mis en valeur</label>
                  <input
                    className="a-input"
                    value={heroSettings.titleAccent}
                    onChange={e => setHeroSettings(prev => ({ ...prev, titleAccent: e.target.value }))}
                  />
                </div>
              </div>

              <div className="a-field">
                <label>Description sous le titre</label>
                <textarea
                  className="a-input a-textarea"
                  rows={2}
                  value={heroSettings.description}
                  onChange={e => setHeroSettings(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </div>

        {/* General Settings */}
        <div className="a-card">
          <h3 className="card-title">⚙️ Informations Générales</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="a-field">
              <label>Nom du site</label>
              <input
                className="a-input"
                value={settings.siteName}
                onChange={e => setSettings(prev => ({ ...prev, siteName: e.target.value }))}
              />
            </div>
            <div className="a-field">
              <label>Email de contact</label>
              <input
                className="a-input"
                type="email"
                value={settings.siteEmail}
                onChange={e => setSettings(prev => ({ ...prev, siteEmail: e.target.value }))}
              />
            </div>
            <div className="a-field">
              <label>Téléphone</label>
              <input
                className="a-input"
                value={settings.sitePhone}
                onChange={e => setSettings(prev => ({ ...prev, sitePhone: e.target.value }))}
              />
            </div>
            <div className="a-field">
              <label>Adresse</label>
              <textarea
                className="a-input a-textarea"
                value={settings.siteAddress}
                onChange={e => setSettings(prev => ({ ...prev, siteAddress: e.target.value }))}
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* System Settings */}
        <div className="a-card">
          <h3 className="card-title">🔧 Paramètres Système</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="a-field">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={e => setSettings(prev => ({ ...prev, maintenanceMode: e.target.checked }))}
                  style={{ width: 18, height: 18 }}
                />
                Mode maintenance
              </label>
              <span style={{ fontSize: '0.85rem', color: 'var(--a-text-muted)' }}>
                Désactive le site pour les visiteurs (seuls les administrateurs peuvent y accéder)
              </span>
            </div>
          </div>
        </div>
      </div>
      {ToastComponent}
    </>
  );
};

import React, { useState, useEffect } from 'react';
import * as api from '../../../services/api';
import { Save } from 'lucide-react';
import { useToast } from '../components/Toast';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<api.SiteSettings>({
    siteName: "L'Écolier",
    siteEmail: 'ecolier.librairie@gmail.com',
    sitePhone: '+216 58 982 121',
    siteAddress: 'Tunisie',
    currency: 'DT',
    taxRate: '19',
    shippingFee: '7',
    maintenanceMode: false
  });
  const [saving, setSaving] = useState(false);
  const { showToast, ToastComponent } = useToast();

  useEffect(() => {
    const fetchSettings = async () => {
      const data = await api.getSettings();
      setSettings(data);
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await api.saveSettings(settings);
    setSaving(false);
    showToast('Paramètres sauvegardés avec succès!', 'success');
  };

  return (
    <>
      <div className="admin-page-header">
        <div>
          <div className="admin-page-title">Paramètres du Site</div>
          <div className="admin-page-sub">Configurez les paramètres généraux de votre boutique</div>
        </div>
        <button className="a-btn a-btn-primary" onClick={handleSave} disabled={saving}>
          <Save size={16} style={{ marginRight: 8 }} />
          {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24 }}>
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

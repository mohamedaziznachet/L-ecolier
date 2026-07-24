import React, { useState } from 'react';
import './admin.css';
import { useAdmin } from '../../context/AdminContext';
import { useNavigation } from '../../context/AppContext';
import {
  LayoutDashboard,
  Package,
  FolderOpen,
  Award,
  ShoppingCart,
  Tag,
  Users,
  Star,
  Settings,
  LogOut,
  Globe,
  Menu,
  X,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

// Import sub-pages
import { DashboardPage } from './pages/DashboardPage';
import { ProductsPage } from './pages/ProductsPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { BrandsPage } from './pages/BrandsPage';
import { OrdersPage } from './pages/OrdersPage';
import { CustomersPage } from './pages/CustomersPage';
import { CouponsPage } from './pages/CouponsPage';
import { ReviewsPage } from './pages/ReviewsPage';
import { SettingsPage } from './pages/SettingsPage';

type AdminPage = 
  | 'dashboard' 
  | 'products' 
  | 'categories' 
  | 'brands' 
  | 'orders' 
  | 'coupons' 
  | 'users' 
  | 'reviews' 
  | 'settings';

export const AdminLayout: React.FC = () => {
  const { logout, loading } = useAdmin();
  const { navigateTo, logoutUser } = useNavigation();
  const [currentPage, setCurrentPage] = useState<AdminPage>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navGroups = [
    {
      label: 'Général',
      items: [
        { id: 'dashboard' as AdminPage, icon: <LayoutDashboard size={18} />, label: 'Dashboard' }
      ]
    },
    {
      label: 'Catalogue',
      items: [
        { id: 'products' as AdminPage, icon: <Package size={18} />, label: 'Produits' },
        { id: 'categories' as AdminPage, icon: <FolderOpen size={18} />, label: 'Catégories' },
        { id: 'brands' as AdminPage, icon: <Award size={18} />, label: 'Marques' }
      ]
    },
    {
      label: 'Ventes',
      items: [
        { id: 'orders' as AdminPage, icon: <ShoppingCart size={18} />, label: 'Commandes' },
        { id: 'coupons' as AdminPage, icon: <Tag size={18} />, label: 'Codes Promo' }
      ]
    },
    {
      label: 'Communauté',
      items: [
        { id: 'users' as AdminPage, icon: <Users size={18} />, label: 'Clients' },
        { id: 'reviews' as AdminPage, icon: <Star size={18} />, label: 'Avis clients' }
      ]
    },
    {
      label: 'Système',
      items: [
        { id: 'settings' as AdminPage, icon: <Settings size={18} />, label: 'Paramètres' }
      ]
    }
  ];

  const pageTitle: Record<AdminPage, string> = {
    dashboard: 'Tableau de Bord',
    products: 'Gestion des Produits',
    categories: 'Gestion des Catégories',
    brands: 'Gestion des Marques',
    orders: 'Gestion des Commandes',
    coupons: 'Codes de Réduction',
    users: 'Gestion des Clients',
    reviews: 'Avis & Modération',
    settings: 'Paramètres du Site',
  };

  const renderPage = () => {
    if (loading) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6rem', color: 'var(--a-text-muted)' }}>
          <RefreshCw size={40} className="spin-icon" style={{ animation: "spin 1s linear infinite", color: 'var(--a-accent)' }} />
          <span style={{ marginTop: 16, fontSize: '1.2rem' }}>Chargement des données...</span>
        </div>
      );
    }
    switch (currentPage) {
      case 'dashboard': return <DashboardPage />;
      case 'products': return <ProductsPage />;
      case 'categories': return <CategoriesPage />;
      case 'brands': return <BrandsPage />;
      case 'orders': return <OrdersPage />;
      case 'users': return <CustomersPage />;
      case 'coupons': return <CouponsPage />;
      case 'reviews': return <ReviewsPage />;
      case 'settings': return <SettingsPage />;
    }
  };

  return (
    <div className="admin-root">
      {/* Mobile Topbar */}
      <div className="admin-mobile-header">
        <button className="menu-toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <div className="admin-brand-name-mobile">L'Écolier</div>
        <div className="admin-avatar">A</div>
      </div>

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'mobile-open' : ''}`}>
        <div className="admin-brand">
          <div className="admin-brand-icon"><Sparkles size={18} /></div>
          <div className="admin-brand-text">
            <span className="admin-brand-name">L'Écolier</span>
            <span className="admin-brand-sub">Centre de gestion</span>
          </div>
        </div>

        <nav className="admin-nav" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 180px)' }}>
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} style={{ marginBottom: 16 }}>
              <div className="admin-nav-label" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--a-text-muted)', paddingLeft: 12, marginBottom: 6 }}>
                {group.label}
              </div>
              {group.items.map(item => (
                <button
                  key={item.id}
                  className={`admin-nav-item ${currentPage === item.id ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentPage(item.id);
                    setSidebarOpen(false);
                  }}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="admin-sidebar-footer" style={{ borderTop: '1px solid var(--a-border)', paddingTop: 12 }}>
          <button
            className="admin-nav-item return-btn"
            style={{ marginBottom: 8 }}
            onClick={() => navigateTo('home')}
          >
            <span className="nav-icon"><Globe size={18} /></span>
            Retour au site
          </button>
          <button 
            className="admin-logout-btn" 
            onClick={() => {
              logout();
              logoutUser();
            }}
          >
            <LogOut size={18} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-title">{pageTitle[currentPage]}</div>
          <div className="admin-topbar-actions">
            <button className="a-btn a-btn-ghost refresh-btn" onClick={() => window.location.reload()}>
              <RefreshCw size={14} /> Actualiser
            </button>
            <div className="admin-avatar">A</div>
          </div>
        </header>

        <div className="admin-page">
          {renderPage()}
        </div>
      </div>
    </div>
  );
};

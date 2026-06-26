import React from 'react';
import { useAdmin } from '../../context/AdminContext';
import { useNavigation } from '../../context/AppContext';

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { logout, isAdmin } = useAdmin();
  const { navigateTo } = useNavigation();

  const handleNav = (view: string) => {
    navigateTo('admin'); // stay in admin view
    // a simple state could be added to track subview, but for brevity we just rely on view param in children
  };

  return (
    <div className="admin-layout" style={layoutStyle}>
      <aside className="sidebar" style={sidebarStyle}>
        <h2 style={titleStyle}>Admin Panel</h2>
        <nav>
          <ul style={ulStyle}>
            <li><button onClick={() => navigateTo('admin')} style={buttonStyle}>Dashboard</button></li>
            <li><button onClick={() => navigateTo('admin')} style={buttonStyle}>Products</button></li>
            <li><button onClick={() => navigateTo('admin')} style={buttonStyle}>Users</button></li>
            <li><button onClick={() => navigateTo('admin')} style={buttonStyle}>Orders</button></li>
          </ul>
        </nav>
        <button onClick={logout} style={logoutStyle}>Logout</button>
      </aside>
      <main className="admin-content" style={contentStyle}>
        {children}
      </main>
    </div>
  );
};

const layoutStyle: React.CSSProperties = {
  display: 'flex',
  minHeight: '100vh',
  background: 'var(--bg-primary)',
  color: 'var(--text-primary)',
};
const sidebarStyle: React.CSSProperties = {
  width: '250px',
  background: 'rgba(255,255,255,0.1)',
  backdropFilter: 'blur(10px)',
  padding: '20px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
};
const contentStyle: React.CSSProperties = {
  flex: 1,
  padding: '30px',
  overflowY: 'auto',
};
const titleStyle: React.CSSProperties = { marginBottom: '30px', fontSize: '1.8rem' };
const ulStyle: React.CSSProperties = { listStyle: 'none', padding: 0 };
const buttonStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px',
  marginBottom: '10px',
  background: 'transparent',
  border: 'none',
  color: 'inherit',
  textAlign: 'left',
  cursor: 'pointer',
  fontSize: '1rem',
  transition: 'background 0.3s',
};
const logoutStyle: React.CSSProperties = {
  padding: '10px',
  background: 'rgba(255,0,0,0.2)',
  border: 'none',
  color: '#fff',
  cursor: 'pointer',
  borderRadius: '5px',
  marginTop: '20px',
};

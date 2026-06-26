import React from 'react';
import { useAdmin } from '../../context/AdminContext';
// Placeholder for chart – replace with real chart component later
// const Chart = () => <div style={{height: '200px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px'}}></div>;

export const Dashboard: React.FC = () => {
  const { products, users, orders } = useAdmin();

  const totalProducts = products.length;
  const totalUsers = users.length;
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);

  const data = [
    { label: 'Products', value: totalProducts },
    { label: 'Users', value: totalUsers },
    { label: 'Orders', value: totalOrders },
    { label: 'Revenue', value: totalRevenue },
  ];

  return (
    <div className="admin-dashboard" style={dashboardStyle}>
      <h1 style={titleStyle}>Admin Dashboard</h1>
      <div style={metricsGrid}>
        <div style={metricCard}>Products: {totalProducts}</div>
        <div style={metricCard}>Users: {totalUsers}</div>
        <div style={metricCard}>Orders: {totalOrders}</div>
        <div style={metricCard}>Revenue: ${totalRevenue.toFixed(2)}</div>
      </div>
      {/* Chart placeholder */}
      <div style={{height: '200px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', marginTop: '20px'}}></div>
    </div>
  );
};

const dashboardStyle: React.CSSProperties = {
  padding: '20px',
  color: 'var(--text-primary)',
};
const titleStyle: React.CSSProperties = { marginBottom: '20px' };
const metricsGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
  gap: '15px',
  marginBottom: '30px',
};
const metricCard: React.CSSProperties = {
  background: 'rgba(255,255,255,0.1)',
  backdropFilter: 'blur(8px)',
  padding: '15px',
  borderRadius: '8px',
  textAlign: 'center',
  fontSize: '1.1rem',
};

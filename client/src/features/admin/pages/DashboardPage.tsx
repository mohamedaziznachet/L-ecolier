import React, { useMemo } from 'react';
import { useAdmin } from '../../../context/AdminContext';
import { Package, Users, ShoppingCart, TrendingUp, AlertTriangle } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { StatusBadge } from '../components/StatusBadge';

export const DashboardPage: React.FC = () => {
  const { stats, loading } = useAdmin();

  const kpis = useMemo(() => {
    if (!stats) return [];
    return [
      { label: 'Produits', value: stats.totalProducts, icon: <Package size={22} />, color: 'blue', desc: 'Articles en boutique' },
      { label: 'Utilisateurs', value: stats.totalUsers, icon: <Users size={22} />, color: 'purple', desc: 'Clients enregistrés' },
      { label: 'Commandes', value: stats.totalOrders, icon: <ShoppingCart size={22} />, color: 'green', desc: 'Commandes reçues' },
      { 
        label: 'Revenu Validé', 
        value: `${(stats.totalRevenue || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DT`, 
        icon: <TrendingUp size={22} />, 
        color: 'orange', 
        desc: stats.pendingRevenue ? `+ ${(stats.pendingRevenue || 0).toFixed(2)} DT en attente` : 'Ventes confirmées/livrées' 
      },
    ];
  }, [stats]);

  // Transform recent sales to match chart format
  const chartData = useMemo(() => {
    if (!stats || !stats.recentSales) return [];
    let cumulative = 0;
    return stats.recentSales.map(item => {
      cumulative += item.revenue;
      return {
        date: item._id,
        Ventes: item.revenue,
        Cumulé: cumulative,
      };
    });
  }, [stats]);

  const ordersByStatusData = useMemo(() => {
    if (!stats || !stats.ordersByStatus) return [];
    const labels: Record<string, string> = {
      pending: 'En attente',
      processing: 'Préparation',
      confirmed: 'Confirmé',
      shipped: 'Expédié',
      delivered: 'Livré',
      expired: 'Expiré',
      cancelled: 'Annulé',
    };
    return stats.ordersByStatus.map(item => {
      const revenue = item.totalRevenue || 0;
      return {
        id: item._id,
        name: labels[item._id] || item._id,
        Commandes: item.count,
        Revenu: revenue,
        RevenuFormatted: `${revenue.toFixed(2)} DT`,
      };
    });
  }, [stats]);

  if (loading) {
    return (
      <>
        <SkeletonLoader type="card" />
        <SkeletonLoader type="chart" />
      </>
    );
  }

  if (!stats) {
    return <div style={{ color: 'var(--a-text-muted)', textAlign: 'center', padding: 40 }}>Aucune donnée statistique disponible.</div>;
  }

  return (
    <>
      {/* KPIs Grid */}
      <div className="admin-stats-grid">
        {kpis.map(s => (
          <div key={s.label} className="admin-stat-card">
            <div className={`admin-stat-icon ${s.color}`}>{s.icon}</div>
            <div className="admin-stat-info">
              <div className="admin-stat-value">{s.value}</div>
              <div className="admin-stat-label">{s.label}</div>
              <div className="admin-stat-desc">{s.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24, marginBottom: 24 }}>
        <div className="a-card chart-card">
          <h3 className="card-title">📈 Évolution des Ventes (7 Derniers Jours)</h3>
          <div style={{ width: '100%', height: 300, marginTop: 12 }}>
            {chartData.length === 0 ? (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--a-text-muted)' }}>Aucune vente cette semaine</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--a-accent)" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="var(--a-accent)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCumul" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--a-accent2)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--a-accent2)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" stroke="var(--a-text-muted)" fontSize={11} />
                  <YAxis stroke="var(--a-text-muted)" fontSize={11} />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'var(--a-sidebar)', 
                      borderColor: 'var(--a-border)', 
                      borderRadius: 'var(--a-radius-sm)',
                      color: 'var(--a-text-bright)'
                    }} 
                  />
                  <Area type="monotone" dataKey="Ventes" stroke="var(--a-accent)" fillOpacity={1} fill="url(#colorSales)" strokeWidth={2} />
                  <Area type="monotone" dataKey="Cumulé" stroke="var(--a-accent2)" fillOpacity={1} fill="url(#colorCumul)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="a-card chart-card">
          <h3 className="card-title">📊 Répartition des Commandes & Revenu par Statut</h3>
          <div style={{ width: '100%', height: 240, marginTop: 12 }}>
            {ordersByStatusData.length === 0 ? (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--a-text-muted)' }}>Aucune commande enregistrée</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ordersByStatusData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="var(--a-text-muted)" fontSize={11} />
                  <YAxis stroke="var(--a-text-muted)" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--a-sidebar)',
                      borderColor: 'var(--a-border)',
                      borderRadius: 'var(--a-radius-sm)',
                      color: 'var(--a-text-bright)',
                    }}
                    formatter={(value: any, name: any, item: any) => {
                      if (name === 'Commandes') {
                        return [`${value} commande(s) (${item.payload.RevenuFormatted})`, 'Volume'];
                      }
                      return [value, name];
                    }}
                  />
                  <Bar dataKey="Commandes" fill="var(--a-accent)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          {/* Revenue breakdown by status badges */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12, borderTop: '1px solid var(--a-border)', paddingTop: 12 }}>
            {ordersByStatusData.map((item) => (
              <div
                key={item.id}
                style={{
                  fontSize: '0.75rem',
                  padding: '4px 8px',
                  borderRadius: 6,
                  background: 'var(--a-sidebar)',
                  border: '1px solid var(--a-border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span style={{ fontWeight: 600, color: 'var(--a-text-bright)' }}>{item.name}:</span>
                <span style={{ color: 'var(--a-text-muted)' }}>{item.Commandes} cmd</span>
                <span style={{ fontWeight: 700, color: item.id === 'cancelled' || item.id === 'expired' ? 'var(--a-danger)' : 'var(--a-success)' }}>
                  {item.RevenuFormatted}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="admin-dash-grid">
        {/* Recent Orders */}
        <div className="a-card">
          <h3 className="card-title">🛒 Commandes Récentes</h3>
          <div className="a-table-wrap" style={{ marginTop: 12 }}>
            <table className="a-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Client</th>
                  <th>Total</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders?.map(o => (
                  <tr key={o.id || (o as any)._id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      #{(o.id || (o as any)._id || 'N/A').toString().slice(-6).toUpperCase()}
                    </td>
                    <td>{o.customerName || 'Anonyme'}</td>
                    <td style={{ color: 'var(--a-success)', fontWeight: 600 }}>{o.total?.toFixed(2)} DT</td>
                    <td>
                      <StatusBadge type="order" value={o.status || 'pending'} />
                    </td>
                  </tr>
                ))}
                {(!stats.recentOrders || stats.recentOrders.length === 0) && (
                  <tr>
                    <td colSpan={4}>
                      <div className="a-empty">
                        <div className="a-empty-icon">🛒</div>
                        <div className="a-empty-text">Aucune commande</div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="a-card">
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={18} style={{ color: '#f59e0b' }} />
            Stock Faible ({stats.lowStockProducts?.length || 0})
          </h3>
          <div className="admin-activity-list" style={{ marginTop: 12 }}>
            {stats.lowStockProducts?.map(p => (
              <div key={p.id || (p as any)._id} className="admin-activity-item">
                <img src={p.img || 'https://via.placeholder.com/40'} alt={p.name} className="admin-activity-img" />
                <div className="admin-activity-content">
                  <span className="admin-activity-text">{p.name}</span>
                  <span className="admin-activity-sub">{p.category || 'Sans catégorie'}</span>
                </div>
                <span className="a-badge a-badge-red">{p.stock} restants</span>
              </div>
            ))}
            {(!stats.lowStockProducts || stats.lowStockProducts.length === 0) && (
              <div className="a-empty">
                <div className="a-empty-icon">🎉</div>
                <div className="a-empty-text">Tous les produits sont en stock suffisant</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

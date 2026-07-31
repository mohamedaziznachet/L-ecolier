import React, { useMemo } from 'react';
import { useAdmin } from '../../../context/AdminContext';
import { Package, Users, ShoppingCart, TrendingUp, AlertTriangle, Clock, Award } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { SkeletonLoader } from '../components/SkeletonLoader';

export const DashboardPage: React.FC = () => {
  const { stats, loading } = useAdmin();

  const kpis = useMemo(() => {
    if (!stats) return [];
    return [
      { label: 'Produits', value: stats.totalProducts, icon: <Package size={22} />, color: 'blue', desc: 'Articles en boutique' },
      { label: 'Utilisateurs', value: stats.totalUsers, icon: <Users size={22} />, color: 'purple', desc: 'Clients enregistrés' },
      { label: 'Commandes', value: stats.totalOrders, icon: <ShoppingCart size={22} />, color: 'green', desc: 'Commandes reçues' },
      { 
        label: 'Revenu Livré', 
        value: `${(stats.deliveredRevenue ?? stats.totalRevenue ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 3 })} DT`, 
        icon: <TrendingUp size={22} />, 
        color: 'orange', 
        desc: stats.pendingRevenue ? `+ ${(stats.pendingRevenue || 0).toFixed(3)} DT en cours` : 'Commandes livrées uniquement' 
      },
    ];
  }, [stats]);

  // Transform recent sales to match clean modern chart format
  const chartData = useMemo(() => {
    if (!stats || !stats.recentSales) return [];
    return stats.recentSales.map(item => {
      const parts = item._id.split('-');
      const dateLabel = parts.length === 3 ? `${parts[2]}/${parts[1]}` : item._id;
      return {
        date: dateLabel,
        rawDate: item._id,
        revenue: item.revenue,
        orders: item.orders,
      };
    });
  }, [stats]);

  const sevenDayTotalRevenue = useMemo(() => {
    if (!chartData) return 0;
    return chartData.reduce((acc, curr) => acc + curr.revenue, 0);
  }, [chartData]);

  const ordersByStatusData = useMemo(() => {
    if (!stats || !stats.ordersByStatus) return [];
    const statusMap: Record<string, { label: string; color: string }> = {
      delivered: { label: 'Livré', color: '#10b981' },
      shipped: { label: 'Expédié', color: '#0284c7' },
      processing: { label: 'Préparation', color: '#3b82f6' },
      confirmed: { label: 'Confirmé', color: '#6366f1' },
      pending: { label: 'En attente', color: '#f59e0b' },
      expired: { label: 'Expiré', color: '#94a3b8' },
      cancelled: { label: 'Annulé', color: '#ef4444' },
    };

    return stats.ordersByStatus.map(item => {
      const info = statusMap[item._id] || { label: item._id, color: '#64748b' };
      const revenue = item.totalRevenue || 0;
      return {
        id: item._id,
        name: info.label,
        color: info.color,
        Commandes: item.count,
        Revenu: revenue,
        RevenuFormatted: `${revenue.toFixed(3)} DT`,
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

      {/* Modern Graphs Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 24, marginBottom: 24 }}>
        
        {/* Graph 1: Modern Sales Area Chart */}
        <div className="a-card chart-card" style={{ padding: '1.25rem 1.5rem', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 className="card-title" style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                📈 Évolution du Revenu Réel
              </h3>
              <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Commandes livrées (7 derniers jours)</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#10b981' }}>
                {sevenDayTotalRevenue.toFixed(3)} DT
              </div>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Total 7 Jours</span>
            </div>
          </div>

          <div style={{ width: '100%', height: 260 }}>
            {chartData.length === 0 ? (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
                Aucune commande livrée sur cette période
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}`} />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '10px 14px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                            <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>Date: {data.rawDate}</div>
                            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#10b981' }}>{Number(data.revenue).toFixed(3)} DT</div>
                            <div style={{ fontSize: '0.8rem', color: '#0d2b6b', fontWeight: 700, marginTop: '2px' }}>{data.orders} commande(s) livrée(s)</div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#emeraldGradient)" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#ffffff' }} activeDot={{ r: 6, strokeWidth: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Graph 2: Modern Status Breakdown Bar Chart */}
        <div className="a-card chart-card" style={{ padding: '1.25rem 1.5rem', borderRadius: '16px' }}>
          <div style={{ marginBottom: '1rem' }}>
            <h3 className="card-title" style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              📊 Volume & Revenu par Statut
            </h3>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Nombre de commandes et valeur totale par statut</span>
          </div>

          <div style={{ width: '100%', height: 215 }}>
            {ordersByStatusData.length === 0 ? (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
                Aucune commande enregistrée
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ordersByStatusData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '10px 14px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                              <span style={{ width: 8, height: 8, borderRadius: '50%', background: data.color }} />
                              <strong style={{ fontSize: '0.88rem', color: '#0f172a' }}>{data.name}</strong>
                            </div>
                            <div style={{ fontSize: '0.82rem', color: '#475569' }}>
                              Volume: <strong style={{ color: '#0f172a' }}>{data.Commandes} commande(s)</strong>
                            </div>
                            <div style={{ fontSize: '0.85rem', color: data.id === 'delivered' ? '#10b981' : '#0d2b6b', fontWeight: 800, marginTop: 2 }}>
                              Total: {data.RevenuFormatted}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="Commandes" radius={[6, 6, 0, 0]} maxBarSize={36}>
                    {ordersByStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Clean Status Legend Badges */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12, borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
            {ordersByStatusData.map((item) => (
              <div
                key={item.id}
                style={{
                  fontSize: '0.75rem',
                  padding: '4px 10px',
                  borderRadius: 8,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }} />
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{item.name}:</span>
                <span style={{ color: '#64748b' }}>{item.Commandes}</span>
                <span style={{ fontWeight: 800, color: item.id === 'delivered' ? '#10b981' : '#0d2b6b' }}>
                  {item.RevenuFormatted}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Analytics Widgets Below the Graphs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
        
        {/* Widget 1: Top Best Selling Products */}
        <div className="a-card" style={{ borderRadius: '16px', padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 className="card-title" style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Award size={18} style={{ color: '#d97706' }} /> Top 5 Produits les Plus Vendus
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Par volume</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(!stats.topProducts || stats.topProducts.length === 0) ? (
              <div style={{ color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center', padding: '1.5rem 0' }}>
                Aucun produit vendu pour le moment
              </div>
            ) : (
              stats.topProducts.map((p, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 900, color: idx === 0 ? '#d97706' : '#64748b', width: 18, textAlign: 'center' }}>
                      #{idx + 1}
                    </span>
                    <img src={p.img || 'https://via.placeholder.com/40'} alt={p.name} style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 8, background: '#ffffff', border: '1px solid #e2e8f0', padding: 2 }} />
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>{p.name || 'Produit'}</div>
                      {p.price && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{Number(p.price).toFixed(3)} DT</div>}
                    </div>
                  </div>
                  <span style={{ background: '#f0f6ff', border: '1px solid #bfdbfe', color: '#0d2b6b', padding: '2px 8px', borderRadius: 999, fontWeight: 800, fontSize: '0.78rem' }}>
                    {p.salesCount} vendus
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Widget 2: Low Stock Warning Alert */}
        <div className="a-card" style={{ borderRadius: '16px', padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 className="card-title" style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertTriangle size={18} style={{ color: '#f59e0b' }} /> Alertes de Stock Faible
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 700, background: '#fef2f2', padding: '2px 8px', borderRadius: 999 }}>
              {stats.lowStockProducts?.length || 0} articles
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(!stats.lowStockProducts || stats.lowStockProducts.length === 0) ? (
              <div style={{ color: '#16a34a', fontSize: '0.85rem', textAlign: 'center', padding: '1.5rem 0', fontWeight: 600 }}>
                ✔ Tous les stocks sont au niveau optimal
              </div>
            ) : (
              stats.lowStockProducts.slice(0, 5).map((prod, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <img src={prod.img || 'https://via.placeholder.com/40'} alt={prod.name} style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 8, background: '#ffffff', border: '1px solid #e2e8f0', padding: 2 }} />
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>{prod.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#b45309' }}>Catégorie: {prod.category || 'Général'}</div>
                    </div>
                  </div>
                  <span style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '2px 8px', borderRadius: 999, fontWeight: 800, fontSize: '0.75rem' }}>
                    {prod.stock} restant(s)
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Widget 3: Live Recent Activity / Orders Stream */}
        <div className="a-card" style={{ borderRadius: '16px', padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 className="card-title" style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={18} style={{ color: '#0d2b6b' }} /> Flux des Dernières Commandes
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>En direct</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(!stats.recentOrders || stats.recentOrders.length === 0) ? (
              <div style={{ color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center', padding: '1.5rem 0' }}>
                Aucune commande récente
              </div>
            ) : (
              stats.recentOrders.map((ord, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0d2b6b', fontFamily: 'monospace' }}>
                        #{(ord.id || (ord as any)._id || '').toString().slice(-8).toUpperCase()}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>{ord.customerName || 'Client'}</span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 1 }}>
                      {new Date(ord.date || Date.now()).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0d2b6b' }}>{Number(ord.total || 0).toFixed(3)} DT</div>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: ord.status === 'delivered' ? '#16a34a' : '#d97706' }}>
                      {ord.status === 'delivered' ? '✔ Livré' : '⏳ En cours'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </>
  );
};

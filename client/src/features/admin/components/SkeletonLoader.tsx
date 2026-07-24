import React from 'react';

interface SkeletonLoaderProps {
  type: 'card' | 'table' | 'chart';
  rows?: number;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ type, rows = 5 }) => {
  const shimmerStyle: React.CSSProperties = {
    background: 'linear-gradient(90deg, var(--a-sidebar) 25%, var(--a-border) 37%, var(--a-sidebar) 63%)',
    backgroundSize: '400% 100%',
    animation: 'shimmer 1.4s ease infinite',
    borderRadius: 4,
  };

  if (type === 'card') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24, marginBottom: 24 }}>
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="admin-stat-card" style={{ height: 110, position: 'relative', overflow: 'hidden' }}>
            <div style={{ ...shimmerStyle, width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'chart') {
    return (
      <div className="a-card" style={{ height: 350, position: 'relative', overflow: 'hidden', marginBottom: 24 }}>
        <div style={{ ...shimmerStyle, width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} />
      </div>
    );
  }

  // default table skeleton
  return (
    <div className="a-card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ ...shimmerStyle, width: '40%', height: 32, marginBottom: 8 }} />
        {Array.from({ length: rows }).map((_, idx) => (
          <div key={idx} style={{ display: 'flex', gap: 16 }}>
            <div style={{ ...shimmerStyle, width: 40, height: 40, borderRadius: '50%' }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center' }}>
              <div style={{ ...shimmerStyle, width: '70%', height: 16 }} />
              <div style={{ ...shimmerStyle, width: '40%', height: 12 }} />
            </div>
            <div style={{ ...shimmerStyle, width: 80, height: 28, alignSelf: 'center' }} />
          </div>
        ))}
      </div>
    </div>
  );
};

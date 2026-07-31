import React from 'react';

export type AvailabilityStatus = 'En stock' | 'En arrivage' | 'Sur commande' | 'Epuisé';

interface AvailabilityBadgeProps {
  availability?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  style?: React.CSSProperties;
}

export const AvailabilityBadge: React.FC<AvailabilityBadgeProps> = ({
  availability = 'En stock',
  size = 'md',
  className = '',
  style
}) => {
  const norm = (availability || '').trim().toLowerCase();

  let label = 'En stock';
  let bg = '#dcfce7';
  let border = '#bbf7d0';
  let text = '#15803d';
  let dotColor = '#16a34a';

  if (norm === 'en arrivage' || norm === 'arrivage') {
    label = 'En arrivage';
    bg = '#e0f2fe';
    border = '#bae6fd';
    text = '#0369a1';
    dotColor = '#0284c7';
  } else if (norm === 'sur commande' || norm === 'commande') {
    label = 'Sur commande';
    bg = '#ffedd5';
    border = '#fed7aa';
    text = '#c2410c';
    dotColor = '#ea580c';
  } else if (norm === 'epuisé' || norm === 'epuise' || norm === 'épuisé' || norm === 'out of stock') {
    label = 'Epuisé';
    bg = '#fef2f2';
    border = '#fecaca';
    text = '#b91c1c';
    dotColor = '#dc2626';
  }

  const paddingMap = {
    sm: '0.2rem 0.6rem',
    md: '0.3rem 0.85rem',
    lg: '0.45rem 1.15rem'
  };

  const fontSizeMap = {
    sm: '0.74rem',
    md: '0.82rem',
    lg: '0.92rem'
  };

  const dotSizeMap = {
    sm: 6,
    md: 8,
    lg: 10
  };

  return (
    <span
      className={`availability-badge ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.45rem',
        padding: paddingMap[size],
        background: bg,
        border: `1px solid ${border}`,
        color: text,
        borderRadius: '9999px',
        fontSize: fontSizeMap[size],
        fontWeight: 800,
        letterSpacing: '0.01em',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
        whiteSpace: 'nowrap',
        ...style
      }}
    >
      <span
        style={{
          width: dotSizeMap[size],
          height: dotSizeMap[size],
          borderRadius: '50%',
          background: dotColor,
          display: 'inline-block',
          flexShrink: 0,
          boxShadow: `0 0 0 2px ${bg}`
        }}
      />
      {label}
    </span>
  );
};

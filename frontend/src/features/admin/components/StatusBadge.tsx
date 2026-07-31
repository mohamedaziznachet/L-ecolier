import React from 'react';

interface StatusBadgeProps {
  type: 'order' | 'payment' | 'user' | 'product';
  value: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ type, value }) => {
  const normalizedVal = value.toLowerCase();

  let className = 'a-badge-orange';
  let label = value;

  if (type === 'order') {
    switch (normalizedVal) {
      case 'pending':
        className = 'a-badge-orange';
        label = 'En attente';
        break;
      case 'processing':
        className = 'a-badge-blue';
        label = 'Préparation';
        break;
      case 'shipped':
        className = 'a-badge-purple';
        label = 'Expédié';
        break;
      case 'delivered':
        className = 'a-badge-green';
        label = 'Livré';
        break;
      case 'cancelled':
        className = 'a-badge-red';
        label = 'Annulé';
        break;
      case 'expired':
        className = 'a-badge-red';
        label = 'Expiré';
        break;
      case 'confirmed':
        className = 'a-badge-blue';
        label = 'Confirmé';
        break;
    }
  } else if (type === 'payment') {
    switch (normalizedVal) {
      case 'pending':
        className = 'a-badge-orange';
        label = 'En attente';
        break;
      case 'paid':
        className = 'a-badge-green';
        label = 'Payé';
        break;
      case 'failed':
        className = 'a-badge-red';
        label = 'Échoué';
        break;
    }
  } else if (type === 'user') {
    switch (normalizedVal) {
      case 'blocked':
      case 'true':
        className = 'a-badge-red';
        label = 'Bloqué';
        break;
      case 'active':
      case 'false':
      default:
        className = 'a-badge-green';
        label = 'Actif';
        break;
    }
  } else if (type === 'product') {
    switch (normalizedVal) {
      case 'inactive':
        className = 'a-badge-red';
        label = 'Inactif';
        break;
      case 'active':
      default:
        className = 'a-badge-green';
        label = 'Actif';
        break;
    }
  }

  return <span className={`a-badge ${className}`}>{label}</span>;
};

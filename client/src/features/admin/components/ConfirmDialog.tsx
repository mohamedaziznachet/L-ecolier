import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  type = 'danger',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const btnClasses = {
    danger: 'a-btn-danger',
    warning: 'a-btn-warning',
    info: 'a-btn-primary',
  };

  return (
    <div className="a-modal-overlay" onClick={onCancel} style={{ zIndex: 1100 }}>
      <div className="a-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        <div className="a-modal-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: type === 'danger' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
              color: type === 'danger' ? '#ef4444' : '#f59e0b'
            }}>
              <AlertTriangle size={20} />
            </span>
            <span className="a-modal-title" style={{ fontSize: '1.2rem', fontWeight: 600 }}>{title}</span>
          </div>
          <button className="a-modal-close" onClick={onCancel}><X size={18} /></button>
        </div>
        <div className="a-modal-body" style={{ paddingTop: 8, paddingBottom: 16 }}>
          <p style={{ color: 'var(--a-text-muted)', fontSize: '0.95rem', lineHeight: 1.5 }}>
            {message}
          </p>
        </div>
        <div className="a-modal-footer" style={{ borderTop: 'none', paddingTop: 0, justifyContent: 'flex-end', gap: 12 }}>
          <button className="a-btn a-btn-ghost" onClick={onCancel}>
            {cancelText}
          </button>
          <button className={`a-btn ${btnClasses[type]}`} onClick={() => { onConfirm(); onCancel(); }}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

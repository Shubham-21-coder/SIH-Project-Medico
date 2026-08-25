import React, { useEffect } from 'react';

const Toast = ({ message, type = 'info', visible, onClose }) => {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div className="toast-container" style={{ position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, animation: 'slideUp 0.3s ease-out' }}>
      <div className={`toast ${type} glass-card`} style={{ display: 'flex', alignItems: 'center', padding: '12px 24px', borderRadius: 'var(--radius-md)', background: type === 'error' ? 'var(--danger)' : type === 'success' ? 'var(--accent-teal)' : 'var(--bg-card)', color: type === 'info' ? 'var(--text-primary)' : '#fff' }}>
        <span>{message}</span>
        <button className="toast-close" onClick={onClose} style={{ background: 'none', border: 'none', color: 'inherit', fontSize: '1.2rem', marginLeft: '1rem', cursor: 'pointer' }}>×</button>
      </div>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Toast;

import React from 'react';

const RedFlagScreen = ({ reason, onAcknowledge }) => {
  return (
    <div className="screen red-flag-screen flex-center">
      <div className="red-flag-content glass-card slide-in" style={{ borderColor: 'var(--danger)' }}>
        <div className="red-flag-icon breathe" style={{ fontSize: '5rem' }}>🚨</div>
        <h1 className="red-flag-title">Priority Alert</h1>
        <div className="red-flag-subtitle">
          Based on your symptoms, immediate medical attention is recommended.
        </div>
        
        <div className="red-flag-reason">
          {reason}
        </div>

        <button 
          className="btn btn-danger btn-lg breathe" 
          onClick={onAcknowledge}
          style={{ marginTop: '1rem', width: '100%' }}
        >
          Acknowledge & Generate Summary
        </button>
      </div>
    </div>
  );
};

export default RedFlagScreen;

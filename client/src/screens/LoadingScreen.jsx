import React from 'react';

const LoadingScreen = () => {
  return (
    <div className="screen loading-screen flex-center">
      <div className="glass-card flex-center slide-in" style={{ padding: '3rem', width: '100%', maxWidth: '600px', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="loading-icon" style={{ color: 'var(--accent-teal)' }}>✚</div>
        <h2 className="loading-text">Generating your clinical summary<span className="loading-dots"></span></h2>
        
        <div className="skeleton-container">
          <div className="skeleton-line skeleton"></div>
          <div className="skeleton-line skeleton"></div>
          <div className="skeleton-line skeleton"></div>
          <div className="skeleton-line skeleton"></div>
        </div>

        <div className="loading-subtext">
          Our AI is analyzing your responses to create a comprehensive clinical summary for your doctor.
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;

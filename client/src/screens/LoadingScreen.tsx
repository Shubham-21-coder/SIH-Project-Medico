import React from 'react';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = 'Generating Clinical Note...' }) => {
  return (
    <div className="screen loading-screen flex-center fade-in">
      <div className="loading-card glass-card slide-in">
        <div className="spinner-large"></div>
        <h2>{message}</h2>
        <p className="subtitle">Synthesizing interview answers into structured OPD notes</p>
      </div>
    </div>
  );
};

export default LoadingScreen;

import React from 'react';

const ProgressBar = ({ current, total }) => {
  const percentage = Math.min(100, Math.max(0, (current / total) * 100));

  return (
    <div className="progress-bar-container">
      <div 
        className="progress-bar-fill" 
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  );
};

export default ProgressBar;

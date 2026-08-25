import React, { useState } from 'react';

const QuickReplyChips = ({ options, onSelect, disabled }) => {
  const [selectedIdx, setSelectedIdx] = useState(null);

  const handleSelect = (option, idx) => {
    if (disabled) return;
    setSelectedIdx(idx);
    setTimeout(() => {
      onSelect(option);
      setSelectedIdx(null);
    }, 200);
  };

  return (
    <div className="chips-row" style={{ opacity: disabled ? 0.6 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
      {options.map((option, idx) => (
        <button
          key={idx}
          className={`chip ${selectedIdx === idx ? 'selected' : ''}`}
          onClick={() => handleSelect(option, idx)}
        >
          {option}
        </button>
      ))}
    </div>
  );
};

export default QuickReplyChips;

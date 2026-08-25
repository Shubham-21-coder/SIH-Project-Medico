import React, { useState } from 'react';

interface QuickReplyChipsProps {
  options: string[];
  onSelect: (option: string) => void;
  disabled?: boolean;
}

const QuickReplyChips: React.FC<QuickReplyChipsProps> = ({ options, onSelect, disabled }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (!options || options.length === 0) return null;

  const handleClick = (option: string, index: number) => {
    if (disabled) return;
    setSelectedIndex(index);
    setTimeout(() => {
      onSelect(option);
      setSelectedIndex(null);
    }, 150);
  };

  return (
    <div className="chips-row">
      {options.map((option, index) => (
        <button
          key={index}
          type="button"
          className={`chip ${selectedIndex === index ? 'selected' : ''}`}
          onClick={() => handleClick(option, index)}
          disabled={disabled}
        >
          {option}
        </button>
      ))}
    </div>
  );
};

export default QuickReplyChips;

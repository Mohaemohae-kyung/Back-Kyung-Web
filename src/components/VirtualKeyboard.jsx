import React, { useState, useEffect, useMemo } from 'react';
import './VirtualKeyboard.css';

export default function VirtualKeyboard({ onComplete, onClose, title = "결제 비밀번호를 입력해주세요" }) {
  const [pin, setPin] = useState("");
  
  // Scramble key layout on mount
  const keys = useMemo(() => {
    const nums = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    for (let i = nums.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [nums[i], nums[j]] = [nums[j], nums[i]];
    }
    // Add empty space and delete button
    nums.splice(9, 0, 'empty');
    nums.push('delete');
    return nums;
  }, []);

  const handleKeyPress = (key) => {
    if (key === 'empty') return;
    
    if (key === 'delete') {
      setPin(prev => prev.slice(0, -1));
      return;
    }

    if (pin.length < 6) {
      const newPin = pin + key;
      setPin(newPin);
      
      if (newPin.length === 6) {
        // Complete the PIN
        setTimeout(() => {
          onComplete(newPin);
          setPin(""); // Clear memory immediately
        }, 100);
      }
    }
  };

  return (
    <div className="virtual-keyboard-overlay" onClick={onClose}>
      <div className="virtual-keyboard-modal" onClick={e => e.stopPropagation()}>
        <div className="virtual-keyboard-header">
          <h3>{title}</h3>
          <button className="close-button" onClick={onClose}>X</button>
        </div>
        
        <div className="virtual-keyboard-display">
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`pin-dot ${i < pin.length ? 'filled' : ''}`}></div>
          ))}
        </div>

        <div className="virtual-keyboard-grid">
          {keys.map((key, index) => (
            <button 
              key={index} 
              className={`key-button ${key === 'empty' ? 'empty-key' : ''}`}
              onClick={() => handleKeyPress(key)}
              disabled={key === 'empty'}
            >
              {/* DOM Obfuscation: use CSS classes instead of plaintext numbers if possible, 
                  but for simplicity here we just render it. A true obfuscation would use SVG. */}
              {key === 'delete' ? '←' : (key === 'empty' ? '' : key)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

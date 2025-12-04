import React from 'react';
import './Button.css';

const Button = ({ 
  children, 
  onClick, 
  disabled = false, 
  fullWidth = false, 
  type = 'button',
  className = ''
}) => {
  return (
    <button 
      type={type}
      className={`ui-button ${fullWidth ? 'full-width' : ''} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;

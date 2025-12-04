import React from 'react';
import './Button.css';

const Button = ({ 
  children, 
  onClick, 
  disabled = false, 
  fullWidth = false, 
  type = 'button',
  variant = 'primary', // primary, secondary, danger, ghost
  size = 'md', // sm, md, lg
  className = ''
}) => {
  return (
    <button 
      type={type}
      className={`btn btn-${variant} btn-${size} ${fullWidth ? 'btn-full' : ''} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;

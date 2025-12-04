import React from 'react';
import './Badge.css';

const Badge = ({ children, variant = 'default', className = '' }) => {
  // Map status text to variant if not explicitly provided
  let computedVariant = variant;
  if (variant === 'default' && typeof children === 'string') {
    if (children === 'Active') computedVariant = 'success';
    if (children === 'Ending Soon') computedVariant = 'urgent';
  }

  return (
    <div className={`badge badge-${computedVariant} ${className}`}>
      {children}
    </div>
  );
};

export default Badge;

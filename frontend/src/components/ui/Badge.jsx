import React from 'react';
import './Badge.css';

const Badge = ({ children, variant = 'default', className = '' }) => {
  // Map status text to variant if not explicitly provided
  let computedVariant = variant;
  if (variant === 'default' && typeof children === 'string') {
    const lower = children.toLowerCase();
    if (lower === 'active') computedVariant = 'success';
    if (lower === 'ending soon') computedVariant = 'urgent';
    if (lower === 'upcoming') computedVariant = 'default';
    if (lower === 'ended' || lower === 'closed') computedVariant = 'secondary';
  }

  return (
    <div className={`badge badge-${computedVariant} ${className}`}>
      {children}
    </div>
  );
};

export default Badge;

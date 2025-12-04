import React from 'react';
import './ToggleSwitch.css';

const ToggleSwitch = ({ checked, onChange, disabled = false }) => {
  return (
    <label className="toggle-switch">
      <input 
        type="checkbox" 
        checked={checked}
        onChange={(e) => onChange && onChange(e.target.checked)}
        disabled={disabled}
      />
      <span className="slider"></span>
    </label>
  );
};

export default ToggleSwitch;

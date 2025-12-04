import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './UserMenu.css';

const UserMenu = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!user) return null;

  // Generate initials (e.g., "Demo User" -> "DU")
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="user-menu-container" ref={menuRef}>
      <button 
        className={`user-avatar-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="User menu"
      >
        {getInitials(user.name)}
      </button>

      {isOpen && (
        <div className="user-dropdown glass-panel">
          <div className="dropdown-header">
            <span className="dropdown-user-name">{user.name}</span>
            <span className="dropdown-user-email">{user.email}</span>
          </div>
          
          <button className="dropdown-item" onClick={() => setIsOpen(false)}>
            <span>👤</span> Profile
          </button>
          <Link to="/my-votings" className="dropdown-item" onClick={() => setIsOpen(false)}>
            <span>🗳️</span> My Votings
          </Link>
          <button className="dropdown-item" onClick={() => setIsOpen(false)}>
            <span>⚙️</span> Settings
          </button>
          
          <div className="dropdown-divider"></div>
          
          <button className="dropdown-item danger" onClick={logout}>
            <span>🚪</span> Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;

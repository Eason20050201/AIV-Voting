import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/LOGO.JPG';
import { useAuth } from '../context/AuthContext';
import UserMenu from './UserMenu';
import './Header.css';

const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header className="header glass-panel">
      <div className="logo-container">
        <Link to="/" className="logo-link">
          <img src={logo} alt="AIV Voting Logo" className="logo-img"/>
          <span className="site-title gradient-text">AI Voting</span>
        </Link>
      </div>

      <nav className="nav">
        <Link to="/" className="nav-link">Home</Link>
        <Link to="/about" className="nav-link">About</Link>
        
        {user ? (
          <UserMenu />
        ) : (
          <Link to="/login" className="nav-link login-btn">Login</Link>
        )}
      </nav>
    </header>
  );
};

export default Header;

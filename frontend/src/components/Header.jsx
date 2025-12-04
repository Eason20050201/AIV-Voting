import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/LOGO.JPG';
import './Header.css';

const Header = () => {
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
      </nav>
    </header>
  );
};

export default Header;

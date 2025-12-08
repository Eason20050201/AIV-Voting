import React from 'react';
import { useAuth } from '../context/AuthContext';
import './ProfilePage.css';
import Button from '../components/ui/Button';
import WalletConnect from '../components/WalletConnect';

const ProfilePage = () => {
  const { user } = useAuth();

  if (!user) return null;

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="profile-page fade-in">
      <div className="profile-header">
        <div className="profile-avatar-large">
          {getInitials(user.name)}
        </div>
        <div className="profile-info">
          <h1>{user.name}</h1>
          <div className="profile-email">{user.email}</div>
        </div>
      </div>

      <div className="profile-section">
        <h2>Personal Information</h2>
        <div className="info-grid">
          <div className="info-item">
            <label>Full Name</label>
            <p>{user.name}</p>
          </div>
          <div className="info-item">
            <label>Email Address</label>
            <p>{user.email}</p>
          </div>
          <div className="info-item">
            <label>Account Type</label>
            <p className="capitalize">{user.role || 'Voter'}</p>
          </div>
          <div className="info-item">
            <label>Member Since</label>
            <p>December 2025</p>
          </div>
        </div>
        <Button variant="secondary" className="edit-profile-btn">Edit Profile</Button>
      </div>

      <div className="profile-section">
        <h2>Wallet Connection</h2>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
          <WalletConnect />
        </div>
      </div>

      <div className="profile-section">
        <h2>Account Statistics</h2>
        <div className="info-grid">
          <div className="info-item">
            <label>Votes Cast</label>
            <p>12</p>
          </div>
          <div className="info-item">
            <label>Votings Created</label>
            <p>3</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

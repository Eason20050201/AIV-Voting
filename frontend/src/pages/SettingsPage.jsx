import React, { useState } from 'react';
import './SettingsPage.css';
import ToggleSwitch from '../components/ui/ToggleSwitch';
import Button from '../components/ui/Button';

const SettingsPage = () => {
  const [notifications, setNotifications] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [language, setLanguage] = useState('en');

  return (
    <div className="settings-page fade-in">
      <div className="settings-header">
        <h1>Settings</h1>
      </div>

      <div className="settings-section">
        <h2>🎨 Appearance</h2>
        <div className="setting-item">
          <div className="setting-info">
            <h3>Dark Mode</h3>
            <p>Use dark theme across the application</p>
          </div>
          <ToggleSwitch 
            checked={darkMode}
            onChange={setDarkMode}
          />
        </div>
        <div className="setting-item">
          <div className="setting-info">
            <h3>Language</h3>
            <p>Select your preferred language</p>
          </div>
          <select 
            className="setting-select"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="en">English</option>
            <option value="zh">Traditional Chinese</option>
            <option value="es">Spanish</option>
            <option value="jp">Japanese</option>
          </select>
        </div>
      </div>

      <div className="settings-section">
        <h2>🔔 Notifications</h2>
        <div className="setting-item">
          <div className="setting-info">
            <h3>Push Notifications</h3>
            <p>Receive notifications about new votings</p>
          </div>
          <ToggleSwitch 
            checked={notifications}
            onChange={setNotifications}
          />
        </div>
        <div className="setting-item">
          <div className="setting-info">
            <h3>Email Updates</h3>
            <p>Receive weekly digest and updates</p>
          </div>
          <ToggleSwitch 
            checked={emailUpdates}
            onChange={setEmailUpdates}
          />
        </div>
      </div>

      <div className="settings-section danger-zone">
        <h2>⚠️ Danger Zone</h2>
        <div className="setting-item">
          <div className="setting-info">
            <h3>Delete Account</h3>
            <p>Permanently remove your account and all data</p>
          </div>
          <Button variant="danger">Delete Account</Button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

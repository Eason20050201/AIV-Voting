import React from 'react';
import './HomePage.css';

const HomePage = () => {
  return (
    <div className="home-container">
      {/* Background Blobs */}
      <div className="blob blob-purple"></div>
      <div className="blob blob-indigo"></div>
      <div className="blob blob-blue"></div>

      <div className="content-wrapper">
        <h1 className="home-title">
          Welcome to <span className="gradient-text">VoteFlow</span>
        </h1>
        <p className="home-subtitle">
          The secure platform for real-time decision making.
        </p>
        
        <div className="folder-structure glass-panel">
          <h3>Folder Structure Explained:</h3>
          <ul>
            <li><strong>components/</strong>: Reusable parts like Navbar and Footer.</li>
            <li><strong>layouts/</strong>: Wrappers that define the page structure (e.g., MainLayout).</li>
            <li><strong>pages/</strong>: The actual views (like this HomePage).</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default HomePage;

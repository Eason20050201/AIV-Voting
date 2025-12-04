import React from 'react';
import './HomePage.css';

const HomePage = () => {
  return (
    <div>
      <h1>Welcome to the Voting App</h1>
      <p>This is the homepage. It is rendered inside the MainLayout.</p>
      <div className="folder-structure">
        <h3>Folder Structure Explained:</h3>
        <ul>
          <li><strong>components/</strong>: Reusable parts like Navbar and Footer.</li>
          <li><strong>layouts/</strong>: Wrappers that define the page structure (e.g., MainLayout).</li>
          <li><strong>pages/</strong>: The actual views (like this HomePage).</li>
        </ul>
      </div>
    </div>
  );
};

export default HomePage;

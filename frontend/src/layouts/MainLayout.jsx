import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './MainLayout.css';

const MainLayout = () => {
  return (
    <div className="main-layout">
      <Header />
      <main className="main-content">
        {/* Global Background Blobs */}
        <div className="blob blob-purple"></div>
        <div className="blob blob-indigo"></div>
        <div className="blob blob-blue"></div>
        
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;

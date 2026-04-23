import React from 'react';
import Sidebar from './Navbar';
import Header from './Header';

export default function Layout({ children }) {
  return (
    <div style={{
      display: 'flex',
      width: '100%',
      minHeight: '100vh',
      background: '#E8EAF6',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      <Sidebar />
      {/* Content area — must NOT have a max-width, must stretch to fill */}
      <div style={{
        flex: '1 1 0%',
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        padding: '0 28px 40px 28px',
        gap: 20,
        overflowX: 'hidden',
      }}>
        <Header />
        {children}
      </div>
    </div>
  );
}

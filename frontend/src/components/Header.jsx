import React from 'react';
import { Search, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { user } = useAuth();
  const firstName = user?.name?.split(' ')[0] || 'Noah';

  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      paddingTop: 32, paddingBottom: 0,
      background: 'transparent',
      flexShrink: 0,
    }}>
      <h1 style={{
        fontSize: 28,
        fontWeight: 800,
        color: '#111827',
        letterSpacing: '-0.5px',
        lineHeight: 1,
      }}>
        Welcome, {firstName}
      </h1>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center',
          background: '#FFFFFF',
          border: '1px solid #EBEBEB',
          borderRadius: 16,
          padding: '10px 18px',
          width: 300,
          gap: 10,
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}>
          <Search size={16} color="#9CA3AF" strokeWidth={2} />
          <input
            type="text"
            placeholder="Search"
            style={{
              background: 'transparent', border: 'none', outline: 'none',
              fontSize: 14, color: '#374151', width: '100%',
              fontFamily: 'inherit', fontWeight: 500,
            }}
          />
        </div>

        {/* Bell */}
        <div style={{
          position: 'relative',
          width: 42, height: 42,
          background: '#FFFFFF',
          borderRadius: '50%',
          border: '1px solid #EBEBEB',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}>
          <Bell size={18} color="#6B7280" strokeWidth={2} />
          <div style={{
            position: 'absolute', top: 9, right: 9,
            width: 8, height: 8,
            background: '#10B981',
            borderRadius: '50%',
            border: '2px solid white',
          }} />
        </div>

        {/* Avatar */}
        <img
          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Noah')}&background=8B5CF6&color=fff&bold=true`}
          alt="avatar"
          style={{ width: 42, height: 42, borderRadius: '50%', border: '2px solid #E5E7EB', cursor: 'pointer' }}
        />
      </div>
    </header>
  );
}

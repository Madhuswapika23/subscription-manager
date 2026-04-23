import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Shield, PieChart, Settings } from 'lucide-react';

// Only routes backed by real API endpoints
const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/analytics', label: 'Analytics', icon: PieChart },
  { to: '/access',    label: 'Overload',  icon: Shield },
];

export default function Sidebar() {
  return (
    <aside style={{
      width: '88px', minWidth: '88px',
      background: '#FFFFFF', borderRight: '1px solid #F1F1F1',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      paddingTop: '28px', paddingBottom: '28px',
      position: 'sticky', top: 0, height: '100vh', zIndex: 50, gap: 0,
    }}>
      {/* Logo */}
      <div style={{
        width: 40, height: 40,
        background: 'linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)',
        borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 32, boxShadow: '0 4px 14px rgba(124,58,237,0.35)', flexShrink: 0,
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {/* Separator */}
      <div style={{ width: 32, height: 1, background: '#F0F0F0', marginBottom: 20, flexShrink: 0 }} />

      {/* Nav items */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: '100%' }}>
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} style={{ width: '100%', textDecoration: 'none' }}>
            {({ isActive }) => (
              <div style={{
                position: 'relative',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 5, padding: '12px 0', cursor: 'pointer',
                color: isActive ? '#7C3AED' : '#9CA3AF',
              }}>
                {isActive && (
                  <div style={{
                    position: 'absolute', left: 0, top: '20%', bottom: '20%',
                    width: 3, background: '#7C3AED', borderRadius: '0 3px 3px 0',
                  }} />
                )}
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500, letterSpacing: '0.02em', color: isActive ? '#7C3AED' : '#9CA3AF' }}>
                  {label}
                </span>
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Settings — auth/profile, also backed by /api/auth/me */}
      <NavLink to="/settings" style={{ width: '100%', textDecoration: 'none' }}>
        {({ isActive }) => (
          <div style={{
            position: 'relative',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 5, padding: '12px 0', cursor: 'pointer',
          }}>
            {isActive && (
              <div style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, background: '#7C3AED', borderRadius: '0 3px 3px 0' }} />
            )}
            <Settings size={22} strokeWidth={1.8} color={isActive ? '#7C3AED' : '#9CA3AF'} />
            <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500, color: isActive ? '#7C3AED' : '#9CA3AF' }}>Settings</span>
          </div>
        )}
      </NavLink>
    </aside>
  );
}

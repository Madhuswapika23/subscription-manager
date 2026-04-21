import { NavLink, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, CreditCard, BarChart2, FileText,
  Settings, Zap, LogOut, ChevronRight
} from 'lucide-react';

const NAV = [
  { to:'/dashboard',  label:'Dashboard',     icon:LayoutDashboard },
  { to:'/analytics',  label:'Analytics',     icon:BarChart2 },
];

const Sidebar = ({ onAddClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const initials = user?.name?.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)||'?';

  const handleLogout = () => { logout(); toast.info('Signed out.'); navigate('/login',{replace:true}); };

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sb-brand">
        <div className="sb-logo">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
              stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span className="sb-name">SubTrack</span>
      </div>

      {/* Nav */}
      <nav className="sb-nav">
        <div className="sb-section">Main Menu</div>
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} id={`nav-${label.toLowerCase()}`}
            className={({ isActive }) => `sb-link${isActive ? ' active' : ''}`}>
            <Icon size={17} className="sb-icon" />
            {label}
          </NavLink>
        ))}

        <div className="sb-section" style={{marginTop:'8px'}}>Other</div>
        <button className="sb-link" style={{cursor:'default',opacity:.55}} disabled>
          <FileText size={17} className="sb-icon" /> Reports <span className="sb-badge">Soon</span>
        </button>
        <button className="sb-link" style={{cursor:'default',opacity:.55}} disabled>
          <Settings size={17} className="sb-icon" /> Settings <span className="sb-badge">Soon</span>
        </button>

        {onAddClick && (
          <button id="sidebar-add-btn" onClick={onAddClick} className="btn-primary"
            style={{width:'100%',marginTop:'14px',justifyContent:'center',borderRadius:'12px'}}>
            + Add Subscription
          </button>
        )}
      </nav>

      {/* Bottom */}
      <div className="sb-bottom">
        <div className="sb-user" onClick={handleLogout} id="logout-btn" title="Sign out">
          <div className="sb-avatar">{initials}</div>
          <div style={{flex:1,minWidth:0}}>
            <div className="sb-uname" style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user?.name}</div>
            <div className="sb-urole">Free plan</div>
          </div>
          <LogOut size={14} style={{color:'#9CA3AF',flexShrink:0}} />
        </div>

        <div className="sb-pro">
          <div className="sb-pro-icon">⚡</div>
          <div className="sb-pro-title">Upgrade to Pro</div>
          <div className="sb-pro-desc">Unlock AI insights, reports &amp; advanced analytics.</div>
          <button className="sb-pro-btn">Upgrade Now →</button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Layout from '../components/Layout';
import AddSubscriptionModal from '../components/AddSubscriptionModal';
import { toast } from 'react-toastify';

/* ─── Design Tokens ────────────────────────────────────────────────────────── */
const T = {
  purple:      '#7B5CF6',
  purpleLight: '#9B7BFF',
  purpleDark:  '#6246EA',
  bg:          '#E8EAF6',
  white:       '#FFFFFF',
  textPrimary: '#111827',
  textMuted:   '#9CA3AF',
  textSub:     '#6B7280',
  greenBg:     '#DCFCE7',
  greenText:   '#16A34A',
  grayBg:      '#F3F4F6',
  border:      '#F3F4F6',
  activeBadge: { bg: '#E8F5E9', text: '#2E7D32' },
  inactiveBadge: { bg: '#F5F5F5', text: '#9E9E9E' },
};

/* ─── Currency (native ₹) ───────────────────────────────────────────────────── */
const fmt      = (n) => '₹' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(n || 0));
const fmtShort = fmt;
const APP_COLORS = {
  dropbox:    '#0061FF', zoom: '#2D8CFF', marketo:   '#5C4EE5',
  atlassian:  '#0052CC', notion: '#000000', hubspot: '#FF7A59',
  default:    '#6246EA',
};
function AppIcon({ name = '', size = 32 }) {
  const key = name.toLowerCase();
  const color = APP_COLORS[key] || APP_COLORS.default;
  return (
    <div style={{
      width: size, height: size, minWidth: size,
      background: color,
      borderRadius: 10,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff',
      fontSize: size * 0.44,
      fontWeight: 800,
      boxShadow: `0 2px 8px ${color}55`,
      flexShrink: 0,
    }}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

/* ─── Payment Method Badge ──────────────────────────────────────────────────── */
function PaymentBadge({ type = 'visa' }) {
  const colors = {
    visa:   { bg: '#1A1F71', text: '#fff', label: 'VISA' },
    master: { bg: '#EB001B', text: '#fff', label: '●●' },
    paypal: { bg: '#003087', text: '#fff', label: 'P' },
    default:{ bg: '#E5E7EB', text: '#374151', label: '●●●' },
  };
  const c = colors[type] || colors.default;
  return (
    <div style={{
      background: c.bg, color: c.text,
      borderRadius: 5, padding: '3px 7px',
      fontSize: 9, fontWeight: 800,
      letterSpacing: '0.04em',
      display: 'inline-flex', alignItems: 'center',
    }}>
      {c.label}
    </div>
  );
}

/* ─── Status Badge ──────────────────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const isActive = status === 'active';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '4px 12px',
      borderRadius: 8,
      fontSize: 12,
      fontWeight: 700,
      background: isActive ? '#E8F5E9' : '#F5F5F5',
      color: isActive ? '#2E7D32' : '#9E9E9E',
    }}>
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
}

/* ─── Frequency Badge ───────────────────────────────────────────────────────── */
function FreqBadge({ cycle }) {
  const label = cycle?.charAt(0).toUpperCase() + cycle?.slice(1);
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '4px 12px',
      borderRadius: 8,
      fontSize: 12, fontWeight: 700,
      background: '#F5F5F5', color: '#6B7280',
    }}>
      {label}
    </span>
  );
}

/* ── Category colours ───────────────────────────────────────────────────── */
const CATS = ['streaming','software','fitness','cloud','learning','other'];
const CAT_META = {
  streaming: { label:'Streaming', color:'#7B5CF6' },
  software:  { label:'Software',  color:'#3B82F6' },
  fitness:   { label:'Fitness',   color:'#10B981' },
  cloud:     { label:'Cloud',     color:'#F59E0B' },
  learning:  { label:'Learning',  color:'#EF4444' },
  other:     { label:'Other',     color:'#6B7280' },
};
const DEFAULT_BUDGETS = { streaming:500, software:1000, fitness:500, cloud:800, learning:400, other:600 };

/* ── 6-bar category chart ────────────────────────────────────────────── */
function CategoryBarChart({ catSpend, budgets, maxH = 180 }) {
  const [hovered, setHovered] = React.useState(null);
  const maxSpend = Math.max(...CATS.map(c => Math.max(catSpend[c] || 0, budgets[c] || 0)), 1);

  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:14, height: maxH + 40, padding:'0 4px', position:'relative' }}>
      {CATS.map(cat => {
        const spend  = catSpend[cat] || 0;
        const budget = budgets[cat]  || 0;
        const barH   = Math.round(maxH * (spend / maxSpend));
        const budgetH = budget > 0 ? Math.round(maxH * (budget / maxSpend)) : null;
        const over   = spend > budget && budget > 0;
        const { color, label } = CAT_META[cat];
        const isHov  = hovered === cat;

        return (
          <div
            key={cat}
            style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', cursor:'pointer' }}
            onMouseEnter={() => setHovered(cat)}
            onMouseLeave={() => setHovered(null)}
          >
            {/* Tooltip */}
            <div style={{ marginBottom:6, minHeight:36, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-end' }}>
              {isHov && (
                <div style={{ background:'rgba(255,255,255,0.95)', color:'#111827', borderRadius:10, padding:'6px 10px', fontSize:10, fontWeight:700, whiteSpace:'nowrap', boxShadow:'0 4px 16px rgba(0,0,0,0.15)', textAlign:'center' }}>
                  <div style={{ color, marginBottom:2 }}>{label}</div>
                  <div>₹{Math.round(spend)}/mo</div>
                  {budget > 0 && <div style={{ color: over?'#EF4444':'#10B981', fontSize:9, marginTop:1 }}>{over?'over':'within'} budget</div>}
                </div>
              )}
            </div>
            {/* Bar column */}
            <div style={{ position:'relative', width:'100%', height: maxH, display:'flex', alignItems:'flex-end' }}>
              {/* Budget dashed line */}
              {budgetH !== null && (
                <div style={{ position:'absolute', left:0, right:0, bottom: budgetH, borderTop:'2px dashed rgba(255,255,255,0.5)', zIndex:2, transition:'bottom 0.5s ease' }} />
              )}
              {/* Bar */}
              <div style={{
                width:'100%',
                height: Math.max(barH, spend > 0 ? 4 : 0),
                background: over
                  ? 'linear-gradient(180deg,#F87171 0%,#EF4444 100%)'
                  : `linear-gradient(180deg,rgba(255,255,255,0.85) 0%,rgba(255,255,255,${isHov?'0.55':'0.35'}) 100%)`,
                borderRadius:'8px 8px 0 0',
                transition:'height 0.5s cubic-bezier(0.4,0,0.2,1)',
                opacity: spend === 0 ? 0.3 : 1,
                boxShadow: isHov ? '0 -4px 16px rgba(255,255,255,0.3)' : 'none',
              }} />
            </div>
            <span style={{ color:'rgba(255,255,255,0.65)', fontSize:9, fontWeight:600, marginTop:8, textAlign:'center', lineHeight:1.2 }}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}


/* ─── Main Page ─────────────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [billingTab, setBillingTab] = useState('monthly');
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const handleDelete = async (sub) => {
    if (!window.confirm(`Delete "${sub.serviceName}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/subscriptions/${sub._id}`);
      toast.success(`"${sub.serviceName}" deleted.`);
      fetchData();
    } catch {
      toast.error('Failed to delete. Please try again.');
    }
  };

  const fetchData = useCallback(async () => {
    try {
      const [sr, st] = await Promise.all([
        api.get('/subscriptions'),
        api.get('/subscriptions/stats'),
      ]);
      setSubscriptions(sr.data.data);
      setStats(st.data.data);
    } catch {
      toast.error('Failed to load subscriptions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── Computed values from real data ── */
  const today = new Date();
  const currentYear = today.getFullYear();
  const monthName = today.toLocaleString('en-US', { month: 'long' });

  const toMonthly = s => s.billingCycle === 'yearly' ? s.cost / 12 : s.billingCycle === 'weekly' ? s.cost * 4.33 : s.cost;

  const activeSubs   = subscriptions.filter(s => s.status === 'active');
  const totalMonthly = activeSubs.reduce((acc, s) => acc + toMonthly(s), 0);
  const totalYearly  = activeSubs.reduce((acc, s) => acc + (s.billingCycle === 'yearly' ? s.cost : s.cost * 12), 0);

  // Category spend (monthly)
  const catSpend = {};
  CATS.forEach(c => { catSpend[c] = 0; });
  activeSubs.forEach(s => { catSpend[s.category || 'other'] += toMonthly(s); });

  // Budgets from localStorage (same key as AccessPage + SettingsPage write to)
  const budgets = (() => {
    try { const s = localStorage.getItem('subtrack_budgets'); return s ? JSON.parse(s) : DEFAULT_BUDGETS; }
    catch { return DEFAULT_BUDGETS; }
  })();

  // Left to pay = upcoming renewal amounts this month
  const upcomingThisMonth = subscriptions.filter(s => {
    const rd = new Date(s.renewalDate);
    return rd >= today && rd.getMonth() === today.getMonth() && rd.getFullYear() === currentYear;
  });
  const leftToPay = upcomingThisMonth.reduce((acc, s) => acc + s.cost, 0);




  // Upcoming payment rows (sort by renewal date, limit 5)
  const upcomingRows = [...subscriptions]
    .filter(s => new Date(s.renewalDate) >= today)
    .sort((a, b) => new Date(a.renewalDate) - new Date(b.renewalDate))
    .slice(0, 5)
    .map(s => {
      const rd = new Date(s.renewalDate);
      return {
        name: s.serviceName,
        date: rd.toLocaleString('en-US', { day: '2-digit', month: 'short' }),
        amount: fmtShort(billingTab === 'yearly' ? (s.billingCycle === 'yearly' ? s.cost : s.cost * 12) : toMonthly(s)),
      };
    });

  // Table rows — include raw sub ref for edit/delete
  const tableRows = subscriptions.map((s) => {
    const rd = new Date(s.renewalDate);
    const created = new Date(s.createdAt || s.renewalDate);
    return {
      _sub: s,
      _id: s._id,
      name: s.serviceName,
      status: s.status,
      dateRecog: created.toLocaleString('en-IN', { month: 'short', day: '2-digit', year: 'numeric' }),
      freq: s.billingCycle,
      ytd: fmt(s.billingCycle === 'yearly' ? s.cost : s.cost * 12),
      renewalDate: rd.toLocaleString('en-IN', { month: 'short', day: '2-digit', year: 'numeric' }),
      amount: fmt(s.cost),
    };
  });

  /* ── Styles ── */
  const cardStyle = {
    background: T.white,
    borderRadius: 24,
    boxShadow: '0 2px 20px rgba(0,0,0,0.06)',
    overflow: 'hidden',
  };

  const colStyle = {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1.5fr 1fr 1fr 1.5fr 100px',
    alignItems: 'center',
    padding: '0 24px',
    gap: 12,
  };

  return (
    <Layout>
      {/* ── Hero Card ───────────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #8B6BFF 0%, #7B5CF6 40%, #6A4BDD 100%)',
        borderRadius: 24,
        boxShadow: '0 12px 48px rgba(107,78,255,0.30)',
        display: 'flex',
        overflow: 'hidden',
        minHeight: 360,
      }}>
        {/* Left: Chart section */}
        <div style={{ flex: 1, padding: '32px 32px 28px 32px', display: 'flex', flexDirection: 'column' }}>
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.75)', marginBottom: 4 }}>
                Spent in {currentYear}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 34, fontWeight: 800, color: '#fff', letterSpacing: '-1px', lineHeight: 1 }}>
                  {loading ? '...' : fmt(totalYearly)}
                </span>
                <span style={{
                  fontSize: 12, fontWeight: 700,
                  background: 'rgba(255,255,255,0.18)',
                  color: '#fff',
                  borderRadius: 20, padding: '3px 10px',
                }}>
                  23% ↓
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.35)', display: 'inline-block' }} />
                  2023
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', display: 'inline-block' }} />
                  {currentYear}
                </span>
              </div>
              <button style={{
                background: 'rgba(255,255,255,0.15)',
                border: 'none', borderRadius: 20,
                padding: '6px 16px', color: '#fff',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                Year <span style={{ fontSize: 10 }}>▼</span>
              </button>
            </div>
          </div>

          {/* Bar chart */}
          <div style={{ flex: 1, marginTop: 8 }}>
            {loading ? (
              <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Loading...</div>
            ) : (
              <CategoryBarChart catSpend={catSpend} budgets={budgets} maxH={180} />
            )}
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: 1, background: 'rgba(255,255,255,0.12)', flexShrink: 0 }} />

        {/* Right: Payments panel */}
        <div style={{ width: 300, padding: '32px 28px', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ fontSize: 34, fontWeight: 800, color: '#fff', letterSpacing: '-1px', lineHeight: 1, marginBottom: 4 }}>
            {loading ? '...' : fmt(leftToPay)}
          </div>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.70)', marginBottom: 20 }}>
            Left to pay in {monthName}
          </div>

          {/* Toggle */}
          <div style={{
            display: 'flex', background: 'rgba(255,255,255,0.15)',
            borderRadius: 12, padding: 4, marginBottom: 20,
          }}>
            {['monthly', 'yearly'].map(t => (
              <button
                key={t}
                onClick={() => setBillingTab(t)}
                style={{
                  flex: 1, padding: '7px 0',
                  border: 'none', borderRadius: 9, cursor: 'pointer',
                  fontSize: 13, fontWeight: 700,
                  background: billingTab === t ? '#fff' : 'transparent',
                  color: billingTab === t ? T.purple : 'rgba(255,255,255,0.8)',
                  transition: 'all 0.2s',
                  textTransform: 'capitalize',
                }}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {/* Column headers */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 60px 70px',
            fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            paddingBottom: 10, marginBottom: 14, gap: 8,
          }}>
            <div>App name</div>
            <div>Date</div>
            <div style={{ textAlign: 'right' }}>Amount</div>
          </div>

          {/* Rows */}
          {loading ? (
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Loading...</div>
          ) : upcomingRows.length === 0 ? (
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>No upcoming renewals</div>
          ) : (
            upcomingRows.map((row, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '1fr 60px 70px',
                alignItems: 'center', gap: 8,
                marginBottom: i < upcomingRows.length - 1 ? 14 : 0,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <AppIcon name={row.name} size={28} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {row.name}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>{row.date}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', textAlign: 'right' }}>{row.amount}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Table Section ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Table header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: T.textPrimary, margin: 0 }}>All Subscriptions</h2>
            <button style={{
              background: T.white, border: '1px solid #E5E7EB',
              borderRadius: 10, width: 34, height: 34,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
              </svg>
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* ++ ADD SUBSCRIPTION BUTTON ++ */}
            <button
              onClick={() => { setEditData(null); setModalOpen(true); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'linear-gradient(135deg, #8B6BFF 0%, #7B5CF6 100%)',
                border: 'none', borderRadius: 12,
                padding: '10px 20px',
                fontSize: 13, fontWeight: 700, color: '#fff',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(123,92,246,0.35)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(123,92,246,0.45)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(123,92,246,0.35)'; }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add Subscription
            </button>
            <button style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: T.white, border: '1px solid #E5E7EB',
              borderRadius: 12, padding: '10px 18px',
              fontSize: 13, fontWeight: 700, color: T.textPrimary,
              cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
              </svg>
              Export
            </button>
          </div>
        </div>

        {/* Table card */}
        <div style={cardStyle}>
          {/* Table header */}
          <div style={{ ...colStyle, height: 52, borderBottom: `1px solid ${T.border}` }}>
            {['Subscription', 'Status', 'Date Added', 'Billing', 'Annual', 'Next Renewal', 'Actions'].map((h, i) => (
              <div key={i} style={{ fontSize: 12, fontWeight: 600, color: T.textMuted }}>{h}</div>
            ))}
          </div>

          {/* Table body */}
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: T.textMuted, fontSize: 14 }}>Loading...</div>
          ) : tableRows.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: T.textMuted, fontSize: 14 }}>
              No subscriptions yet. Add one to get started!
            </div>
          ) : tableRows.map((row, i) => (
            <div
              key={row._id}
              style={{ ...colStyle, height: 68, borderBottom: i < tableRows.length - 1 ? `1px solid ${T.border}` : 'none', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {/* Name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <AppIcon name={row.name} size={36} />
                <span style={{ fontSize: 14, fontWeight: 700, color: T.textPrimary }}>{row.name}</span>
              </div>

              {/* Status */}
              <div><StatusBadge status={row.status} /></div>

              {/* Date */}
              <div style={{ fontSize: 13, color: T.textSub, fontWeight: 500 }}>{row.dateRecog}</div>

              {/* Frequency */}
              <div><FreqBadge cycle={row.freq} /></div>

              {/* Annual spend */}
              <div style={{ fontSize: 13, fontWeight: 700, color: T.textPrimary }}>{row.ytd}</div>

              {/* Renewal */}
              <div style={{ fontSize: 13, color: T.textSub, fontWeight: 500 }}>{row.renewalDate}</div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => { setEditData(row._sub); setModalOpen(true); }}
                  title="Edit"
                  style={{ width: 32, height: 32, borderRadius: 9, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background='#EDE9FE'; e.currentTarget.style.color='#7B5CF6'; e.currentTarget.style.borderColor='#C4B5FD'; }}
                  onMouseLeave={e => { e.currentTarget.style.background='#fff'; e.currentTarget.style.color='#6B7280'; e.currentTarget.style.borderColor='#E5E7EB'; }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(row._sub)}
                  title="Delete"
                  style={{ width: 32, height: 32, borderRadius: 9, border: '1px solid #FEE2E2', background: '#FEF2F2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background='#EF4444'; e.currentTarget.style.color='#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background='#FEF2F2'; e.currentTarget.style.color='#EF4444'; }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <AddSubscriptionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchData}
        editData={editData}
      />
    </Layout>
  );
}

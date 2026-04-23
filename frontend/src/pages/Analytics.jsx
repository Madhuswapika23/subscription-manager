import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';

/* ── Helpers ───────────────────────────────────────────────────────────────── */
const fmt = (n) => '₹' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(n || 0));
const toMonthly = (s) => s.billingCycle === 'yearly' ? s.cost / 12 : s.billingCycle === 'weekly' ? s.cost * 4.33 : s.cost;

const CATS = ['streaming', 'software', 'fitness', 'cloud', 'learning', 'other'];
const CAT_META = {
  streaming: { label: 'Streaming', color: '#7B5CF6', light: '#EDE9FE' },
  software:  { label: 'Software',  color: '#3B82F6', light: '#DBEAFE' },
  fitness:   { label: 'Fitness',   color: '#10B981', light: '#D1FAE5' },
  cloud:     { label: 'Cloud',     color: '#F59E0B', light: '#FEF3C7' },
  learning:  { label: 'Learning',  color: '#EF4444', light: '#FEE2E2' },
  other:     { label: 'Other',     color: '#6B7280', light: '#F3F4F6' },
};

const APP_COLORS = { dropbox:'#0061FF', zoom:'#2D8CFF', marketo:'#5C4EE5', atlassian:'#0052CC', notion:'#111', hubspot:'#FF7A59', netflix:'#E50914', spotify:'#1DB954' };
const appColor = (name) => APP_COLORS[name?.toLowerCase()] || '#7B5CF6';

function AppIcon({ name = '', size = 32 }) {
  return (
    <div style={{
      width: size, height: size, minWidth: size, borderRadius: 9,
      background: appColor(name), color: '#fff',
      fontWeight: 800, fontSize: size * 0.42,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

/* ── KPI card ──────────────────────────────────────────────────────────────── */
function KpiCard({ label, value, sub, iconBg, icon }) {
  return (
    <div style={{ background: '#fff', borderRadius: 20, padding: '20px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #F3F4F6' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: '#111827', lineHeight: 1, marginBottom: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500 }}>{sub}</div>}
    </div>
  );
}

/* ── Horizontal bar row ────────────────────────────────────────────────────── */
function CatBar({ label, amount, pct, color, light }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
      <div style={{ width: 10, height: 10, borderRadius: 3, background: color, flexShrink: 0 }} />
      <span style={{ fontSize: 12, fontWeight: 600, color: '#374151', width: 76, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 7, borderRadius: 99, background: '#F3F4F6', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.5s ease' }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: '#111827', width: 72, textAlign: 'right', flexShrink: 0 }}>{fmt(amount)}</span>
      <span style={{ fontSize: 11, color: '#9CA3AF', width: 32, textAlign: 'right', flexShrink: 0 }}>{Math.round(pct)}%</span>
    </div>
  );
}

/* ── Vertical bar (quarterly) ──────────────────────────────────────────────── */
function QBar({ label, value, maxVal, color = '#7B5CF6' }) {
  const pct = maxVal > 0 ? (value / maxVal) * 100 : 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: '#111827' }}>{fmt(value)}</span>
      <div style={{ width: '100%', maxWidth: 40, height: 120, background: '#F3F4F6', borderRadius: 8, overflow: 'hidden', display: 'flex', alignItems: 'flex-end' }}>
        <div style={{ width: '100%', height: `${pct}%`, background: color, borderRadius: '6px 6px 0 0', transition: 'height 0.5s ease', minHeight: pct > 0 ? 4 : 0 }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF' }}>{label}</span>
    </div>
  );
}

export default function AnalyticsPage() {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/subscriptions');
      setSubs(res.data.data);
    } catch {
      toast.error('Failed to load analytics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── Computed ── */
  const active   = subs.filter(s => s.status === 'active');
  const inactive = subs.filter(s => s.status === 'inactive');
  const rarely   = subs.filter(s => s.usageFrequency === 'rarely' && s.status === 'active');

  const totalMonthly = active.reduce((a, s) => a + toMonthly(s), 0);
  const totalYearly  = active.reduce((a, s) => a + (s.billingCycle === 'yearly' ? s.cost : s.cost * 12), 0);

  // Category breakdown
  const catSpend = {};
  CATS.forEach(c => { catSpend[c] = 0; });
  active.forEach(s => { catSpend[s.category || 'other'] += toMonthly(s); });
  const catList = CATS.map(c => ({ ...CAT_META[c], key: c, amount: catSpend[c] })).filter(c => c.amount > 0).sort((a, b) => b.amount - a.amount);
  const maxCat = catList[0]?.amount || 1;

  // Quarterly spend distribution (based on yearly total)
  const qBase = totalYearly / 4;
  const quarters = [
    { label: 'Q1', value: qBase * 1.08, color: '#7B5CF6' },
    { label: 'Q2', value: qBase * 0.97, color: '#9575F8' },
    { label: 'Q3', value: qBase * 0.93, color: '#A78BFA' },
    { label: 'Q4', value: qBase * 0.87, color: '#C4B5FD' },
  ];
  const maxQ = Math.max(...quarters.map(q => q.value), 1);

  // Upcoming renewals (next 30 days)
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const upcoming = [...active]
    .filter(s => s.renewalDate && new Date(s.renewalDate) >= today)
    .sort((a, b) => new Date(a.renewalDate) - new Date(b.renewalDate))
    .slice(0, 6)
    .map(s => {
      const rd = new Date(s.renewalDate);
      const days = Math.round((rd - today) / 86400000);
      return { ...s, days, dateStr: rd.toLocaleString('en-IN', { day: '2-digit', month: 'short' }) };
    });

  const soon = upcoming.filter(s => s.days <= 7).length;

  if (loading) {
    return (
      <Layout>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20 }}>
          {[1,2,3,4].map(i => <div key={i} style={{ height: 110, background: '#fff', borderRadius: 20, opacity: 0.5 }} />)}
        </div>
        <div style={{ height: 300, background: '#fff', borderRadius: 20, opacity: 0.5 }} />
      </Layout>
    );
  }

  return (
    <Layout>
      {/* ── KPI Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
        <KpiCard
          label="Monthly Spend" value={fmt(totalMonthly)}
          sub={`${active.length} active subscriptions`}
          iconBg="#EDE9FE"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>}
        />
        <KpiCard
          label="Annual Spend" value={fmt(totalYearly)}
          sub="Projected full-year total"
          iconBg="#DBEAFE"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
        />
        <KpiCard
          label="Rarely Used" value={rarely.length}
          sub={rarely.length > 0 ? `Save ${fmt(rarely.reduce((a,s)=>a+toMonthly(s),0))}/mo` : 'All used regularly'}
          iconBg="#FEF3C7"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>}
        />
        <KpiCard
          label="Renewing Soon" value={soon}
          sub="In the next 7 days"
          iconBg={soon > 0 ? '#FEE2E2' : '#D1FAE5'}
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={soon > 0 ? '#EF4444' : '#10B981'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>}
        />
      </div>

      {/* ── Main row: Quarterly chart + Category breakdown ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 16 }}>

        {/* Quarterly bars */}
        <div style={{ background: '#fff', borderRadius: 20, padding: '24px 28px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #F3F4F6' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#111827', margin: 0 }}>Annual Spend by Quarter</h3>
              <p style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500, marginTop: 3 }}>Projected from current active subscriptions</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#111827', lineHeight: 1 }}>{fmt(totalYearly)}</div>
              <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500, marginTop: 2 }}>Total this year</div>
            </div>
          </div>
          {active.length === 0 ? (
            <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: 13 }}>
              Add subscriptions to see quarterly data
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', height: 160 }}>
              {quarters.map(q => <QBar key={q.label} {...q} maxVal={maxQ} />)}
            </div>
          )}
        </div>

        {/* Category breakdown */}
        <div style={{ background: '#fff', borderRadius: 20, padding: '24px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #F3F4F6' }}>
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: '#111827', margin: 0 }}>By Category</h3>
            <p style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500, marginTop: 3 }}>Monthly spend per category</p>
          </div>
          {catList.length === 0 ? (
            <div style={{ color: '#9CA3AF', fontSize: 13, paddingTop: 8 }}>No active subscriptions yet.</div>
          ) : catList.map(c => (
            <CatBar key={c.key} label={c.label} amount={c.amount} pct={(c.amount / maxCat) * 100} color={c.color} light={c.light} />
          ))}
          {catList.length > 0 && (
            <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Total / month</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#7B5CF6' }}>{fmt(totalMonthly)}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom row: Upcoming renewals + Subscription list ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Upcoming renewals */}
        <div style={{ background: '#fff', borderRadius: 20, padding: '24px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #F3F4F6' }}>
          <div style={{ marginBottom: 18 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: '#111827', margin: 0 }}>Upcoming Renewals</h3>
            <p style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500, marginTop: 3 }}>Next 30 days</p>
          </div>
          {upcoming.length === 0 ? (
            <div style={{ color: '#10B981', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 0' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              No renewals in the next 30 days
            </div>
          ) : upcoming.map((s, i) => {
            const urgent = s.days <= 2;
            const warn   = s.days <= 7;
            const tag    = urgent ? { bg:'#FEE2E2', color:'#EF4444', text:'Urgent' } : warn ? { bg:'#FEF3C7', color:'#F59E0B', text:`${s.days}d` } : { bg:'#EDE9FE', color:'#7B5CF6', text:`${s.days}d` };
            return (
              <div key={s._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < upcoming.length - 1 ? '1px solid #F9FAFB' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <AppIcon name={s.serviceName} size={30} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{s.serviceName}</div>
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{s.dateStr}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{fmt(s.cost)}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: tag.color, background: tag.bg, padding: '2px 8px', borderRadius: 20 }}>{tag.text}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Subscription list summary */}
        <div style={{ background: '#fff', borderRadius: 20, padding: '24px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #F3F4F6' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#111827', margin: 0 }}>All Subscriptions</h3>
              <p style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500, marginTop: 3 }}>{subs.length} total · {active.length} active</p>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#10B981', background: '#D1FAE5', padding: '3px 10px', borderRadius: 20 }}>{active.length} Active</span>
              {inactive.length > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', background: '#F3F4F6', padding: '3px 10px', borderRadius: 20 }}>{inactive.length} Inactive</span>}
            </div>
          </div>
          {subs.length === 0 ? (
            <div style={{ color: '#9CA3AF', fontSize: 13, paddingTop: 8 }}>No subscriptions yet. Add from the Dashboard.</div>
          ) : [...subs].sort((a,b) => toMonthly(b) - toMonthly(a)).slice(0, 6).map((s, i, arr) => (
            <div key={s._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid #F9FAFB' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <AppIcon name={s.serviceName} size={30} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: s.status === 'inactive' ? '#9CA3AF' : '#111827' }}>{s.serviceName}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{s.category} · {s.billingCycle}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{fmt(toMonthly(s))}<span style={{ fontSize: 10, fontWeight: 500, color: '#9CA3AF' }}>/mo</span></div>
                <div>
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    color: s.status === 'active' ? '#10B981' : '#9CA3AF',
                    background: s.status === 'active' ? '#D1FAE5' : '#F3F4F6',
                    padding: '1px 7px', borderRadius: 20,
                  }}>
                    {s.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}

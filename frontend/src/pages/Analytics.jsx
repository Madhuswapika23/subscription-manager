import { useEffect, useState, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import api from '../services/api';
import Sidebar from '../components/Navbar';
import InsightsPanel from '../components/InsightsPanel';
import { toast } from 'react-toastify';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

// ── colour palette aligned with app's purple/dark theme ────────────────────
const PALETTE = [
  '#7c3aed', '#a855f7', '#ec4899', '#f59e0b',
  '#10b981', '#3b82f6', '#ef4444', '#14b8a6',
];

const CATEGORY_COLOURS = {
  streaming: '#ec4899',
  software:  '#7c3aed',
  fitness:   '#10b981',
  cloud:     '#3b82f6',
  learning:  '#f59e0b',
  other:     '#a855f7',
};

// ── helpers ─────────────────────────────────────────────────────────────────
const toMonthly = (cost, cycle) => {
  if (cycle === 'yearly') return cost / 12;
  if (cycle === 'weekly') return cost * 4.33;
  return cost;
};

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);

// shared Chart.js options for light theme
const darkDefaults = {
  color: '#6B6B8A',
  font: { family: 'Inter, sans-serif', size: 12 },
};

const AnalyticsPage = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSubs = useCallback(async () => {
    try {
      const res = await api.get('/subscriptions');
      setSubscriptions(res.data.data);
    } catch {
      toast.error('Failed to load subscriptions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSubs(); }, [fetchSubs]);

  // ── Derived stats ─────────────────────────────────────────────────────────
  const active = subscriptions.filter((s) => s.status === 'active');

  // by-category monthly totals
  const categoryTotals = {};
  active.forEach((s) => {
    const cat = s.category || 'other';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + toMonthly(s.cost, s.billingCycle);
  });
  const categories = Object.keys(categoryTotals);
  const categoryValues = categories.map((c) => +categoryTotals[c].toFixed(2));
  const totalMonthly = categoryValues.reduce((a, b) => a + b, 0);

  // renewal timeline — next 30 days
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const next30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });

  const renewalMap = {};
  active.forEach((s) => {
    if (!s.renewalDate) return;
    const rd = new Date(s.renewalDate);
    rd.setHours(0, 0, 0, 0);
    const key = rd.toISOString().slice(0, 10);
    if (!renewalMap[key]) renewalMap[key] = [];
    renewalMap[key].push(s.serviceName);
  });

  // only days that actually have renewals (for the timeline list)
  const renewalDays = next30
    .map((d) => ({ date: d, key: d.toISOString().slice(0, 10) }))
    .filter(({ key }) => renewalMap[key]);

  // ── Chart A — Bar ─────────────────────────────────────────────────────────
  const barData = {
    labels: categories.map((c) => c.charAt(0).toUpperCase() + c.slice(1)),
    datasets: [
      {
        label: 'Monthly Spend (₹)',
        data: categoryValues,
        backgroundColor: categories.map(
          (c, i) => CATEGORY_COLOURS[c] || PALETTE[i % PALETTE.length]
        ),
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        ...darkDefaults,
        callbacks: { label: (ctx) => ` ${fmt(ctx.parsed.y)}` },
        backgroundColor: '#FFFFFF',
        borderColor: 'rgba(0,0,0,0.06)',
        borderWidth: 1,
        titleColor: '#1A1040',
        bodyColor: '#6B6B8A',
      },
    },
    scales: {
      x: {
        ticks: { color: '#6B6B8A', font: { family: 'Inter, sans-serif', size: 12 } },
        grid: { color: 'rgba(0,0,0,0.04)' },
        border: { color: 'rgba(0,0,0,0.06)' },
      },
      y: {
        ticks: {
          color: '#6B6B8A',
          font: { family: 'Inter, sans-serif', size: 12 },
          callback: (v) => `₹${v}`,
        },
        grid: { color: 'rgba(0,0,0,0.05)' },
        border: { color: 'rgba(0,0,0,0.06)' },
      },
    },
  };

  // ── Chart B — Doughnut ────────────────────────────────────────────────────
  const doughnutData = {
    labels: categories.map((c) => c.charAt(0).toUpperCase() + c.slice(1)),
    datasets: [
      {
        data: categoryValues,
        backgroundColor: categories.map(
          (c, i) => CATEGORY_COLOURS[c] || PALETTE[i % PALETTE.length]
        ),
        borderColor: '#111118',
        borderWidth: 3,
        hoverOffset: 8,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#6B6B8A',
          font: { family: 'Inter, sans-serif', size: 12 },
          boxWidth: 14,
          padding: 16,
        },
      },
      tooltip: {
        callbacks: { label: (ctx) => ` ${ctx.label}: ${fmt(ctx.parsed)}` },
        backgroundColor: '#FFFFFF',
        borderColor: 'rgba(0,0,0,0.06)',
        borderWidth: 1,
        titleColor: '#1A1040',
        bodyColor: '#6B6B8A',
      },
    },
  };

  // centre label plugin
  const centreTextPlugin = {
    id: 'centreText',
    beforeDraw(chart) {
      if (chart.config.type !== 'doughnut') return;
      const { ctx, chartArea: { left, right, top, bottom } } = chart;
      const cx = (left + right) / 2;
      const cy = (top + bottom) / 2;
      ctx.save();
      ctx.font = 'bold 15px Inter, sans-serif';
      ctx.fillStyle = '#1A1040';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(fmt(totalMonthly), cx, cy - 8);
      ctx.font = '500 11px Inter, sans-serif';
      ctx.fillStyle = '#6B6B8A';
      ctx.fillText('per month', cx, cy + 12);
      ctx.restore();
    },
  };

  // ── Skeleton loader ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="app-shell">
        <Sidebar />
        <div className="main-area">
          <div className="top-bar"><div className="top-bar-title">Analytics</div></div>
          <div className="page-content">
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  background: 'var(--color-bg-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '1.25rem',
                  height: '280px',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}
              />
            ))}
          </div>
          <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
          </div>
        </div>
      </div>
    );
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  if (active.length === 0) {
    return (
      <div className="app-shell">
        <Sidebar />
        <div className="main-area">
          <div className="top-bar"><div className="top-bar-title">Analytics</div></div>
          <div className="page-content">
            <div style={{ background:'var(--bg-surface)', border:'2px dashed var(--border-soft)',
              borderRadius:'var(--radius-lg)', padding:'4rem 2rem', textAlign:'center', boxShadow:'var(--shadow-sm)' }}>
              <div style={{ fontSize:'3.5rem', marginBottom:'1rem' }}>📊</div>
              <h3 style={{ fontSize:'1.2rem', fontWeight:700, marginBottom:'.5rem', color:'var(--text-primary)' }}>No data yet</h3>
              <p style={{ color:'var(--text-secondary)', fontSize:'.9rem' }}>
                Add some subscriptions from the Dashboard to see analytics here.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }


    return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        <div className="top-bar">
          <div>
            <div className="top-bar-title">Analytics</div>
            <div style={{ fontSize: '.78rem', color: 'var(--text-muted)', marginTop: '.1rem' }}>Spending insights and renewal timeline</div>
          </div>
        </div>
        <div className="page-content">
        {/* ── Page header ───────────────────────────────────────────────────── */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.3rem' }}>
            Analytics
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
            Visualise where your money goes and spot saving opportunities.
          </p>
        </div>

        {/* ── Top stat strip ─────────────────────────────────────────────────── */}
        <div className="analytics-stat-strip">
          <StatPill emoji="💸" label="Monthly Spend" value={fmt(totalMonthly)} />
          <StatPill emoji="📅" label="Yearly Spend" value={fmt(totalMonthly * 12)} />
          <StatPill emoji="📦" label="Active Subs" value={active.length} />
          <StatPill
            emoji="🔄"
            label="Renewing Soon"
            value={renewalDays.filter((r) => {
              const diff = Math.ceil((r.date - today) / (1000 * 60 * 60 * 24));
              return diff <= 7;
            }).length}
            highlight
          />
        </div>

        {/* ── Charts grid ───────────────────────────────────────────────────── */}
        <div className="analytics-charts-grid">
          {/* Chart A — Bar */}
          <div className="chart-card">
            <div className="chart-card-header">
              <span className="chart-card-title">📊 Monthly Spend by Category</span>
              <span className="chart-card-sub">Normalised to monthly</span>
            </div>
            <div style={{ height: '260px' }}>
              <Bar data={barData} options={barOptions} />
            </div>
          </div>

          {/* Chart B — Doughnut */}
          <div className="chart-card">
            <div className="chart-card-header">
              <span className="chart-card-title">🍩 Spending Breakdown</span>
              <span className="chart-card-sub">Share by category</span>
            </div>
            <div style={{ height: '260px' }}>
              <Doughnut
                data={doughnutData}
                options={doughnutOptions}
                plugins={[centreTextPlugin]}
              />
            </div>
          </div>
        </div>

        {/* ── Chart C — Renewal Timeline ────────────────────────────────────── */}
        <div className="chart-card" style={{ marginBottom: '1.75rem' }}>
          <div className="chart-card-header">
            <span className="chart-card-title">📅 Renewal Timeline — Next 30 Days</span>
            <span className="chart-card-sub">
              <span style={{ color: '#fbbf24' }}>●</span> within 7 days &nbsp;
              <span style={{ color: '#f87171' }}>●</span> within 2 days
            </span>
          </div>

          {renewalDays.length === 0 ? (
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem', padding: '1.5rem 0' }}>
              🎉 No renewals in the next 30 days.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', marginTop: '0.5rem' }}>
              {renewalDays.map(({ date, key }) => {
                const daysDiff = Math.round((date - today) / (1000 * 60 * 60 * 24));
                const urgent = daysDiff <= 2;
                const warn   = daysDiff <= 7;
                const colour  = urgent ? '#f87171' : warn ? '#fbbf24' : '#a09ec4';
                const bgColour = urgent
                  ? 'rgba(239,68,68,0.08)'
                  : warn
                  ? 'rgba(251,191,36,0.08)'
                  : 'rgba(255,255,255,0.03)';

                return (
                  <div
                    key={key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '0.6rem 1rem',
                      borderRadius: '0.75rem',
                      background: bgColour,
                      border: `1px solid ${urgent ? 'rgba(239,68,68,0.2)' : warn ? 'rgba(251,191,36,0.15)' : 'var(--color-border)'}`,
                    }}
                  >
                    {/* Date block */}
                    <div style={{ minWidth: '56px', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: colour }}>
                        {date.getDate()}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#a09ec4', fontWeight: 600, textTransform: 'uppercase' }}>
                        {date.toLocaleString('en', { month: 'short' })}
                      </div>
                    </div>

                    {/* Bar fill */}
                    <div style={{ flex: 1, height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          borderRadius: '3px',
                          background: colour,
                          width: `${Math.max(10, 100 - daysDiff * 3)}%`,
                          transition: 'width 0.5s ease',
                        }}
                      />
                    </div>

                    {/* Services */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', justifyContent: 'flex-end', maxWidth: '55%' }}>
                      {renewalMap[key].map((name, i) => (
                        <span
                          key={i}
                          style={{
                            padding: '0.2rem 0.6rem',
                            borderRadius: '2rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: urgent ? 'rgba(239,68,68,0.15)' : warn ? 'rgba(251,191,36,0.12)' : 'rgba(124,58,237,0.15)',
                            color: colour,
                            border: `1px solid ${urgent ? 'rgba(239,68,68,0.25)' : warn ? 'rgba(251,191,36,0.2)' : 'rgba(124,58,237,0.2)'}`,
                          }}
                        >
                          {name}
                        </span>
                      ))}
                    </div>

                    {/* Days left badge */}
                    <div
                      style={{
                        minWidth: '72px',
                        textAlign: 'right',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: colour,
                      }}
                    >
                      {daysDiff === 0 ? 'Today' : daysDiff === 1 ? 'Tomorrow' : `${daysDiff}d away`}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Insights Panel ──────────────────────────────────────────────────────── */}
        <InsightsPanel subscriptions={subscriptions} />
        </div>
      </div>
    </div>
  );
};

// ── Stat pill ────────────────────────────────────────────────────────────────
const StatPill = ({ emoji, label, value, highlight }) => (
  <div
    style={{
      background: highlight ? 'rgba(245,158,11,0.08)' : 'var(--bg-surface)',
      border: `1px solid ${highlight ? 'rgba(245,158,11,0.25)' : 'var(--border-soft)'}`,
      borderRadius: 'var(--radius-lg)',
      padding: '1rem 1.25rem',
      display: 'flex', flexDirection: 'column', gap: '0.3rem',
      flex: '1 1 140px',
      boxShadow: 'var(--shadow-sm)',
    }}
  >
    <span style={{ fontSize: '1.2rem' }}>{emoji}</span>
    <span style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em', color: highlight ? '#D97706' : 'var(--text-primary)' }}>
      {value}
    </span>
    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{label}</span>
  </div>
);

export default AnalyticsPage;


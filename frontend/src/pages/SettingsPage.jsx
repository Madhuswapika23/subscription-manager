import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';

/* ── Helpers ── */
const fmt = (n) => '₹' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(n || 0));

const inp = {
  width: '100%', background: '#F9FAFB', border: '1.5px solid #E5E7EB',
  borderRadius: 10, padding: '10px 14px', fontSize: 13, fontWeight: 500,
  color: '#111827', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
  transition: 'border-color .15s, box-shadow .15s',
};
const inpFocus = { borderColor: '#7B5CF6', boxShadow: '0 0 0 3px rgba(123,92,246,0.1)', background: '#fff' };
const inpBlur  = { borderColor: '#E5E7EB', boxShadow: 'none', background: '#F9FAFB' };

function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
        {label}
      </label>
      {children}
      {hint && <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 5, fontWeight: 500 }}>{hint}</p>}
    </div>
  );
}

function Section({ title, subtitle, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: 20, padding: '24px 28px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #F3F4F6' }}>
      <div style={{ marginBottom: 22, paddingBottom: 18, borderBottom: '1px solid #F3F4F6' }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: '#111827', margin: 0 }}>{title}</h3>
        {subtitle && <p style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500, marginTop: 3 }}>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function SaveBtn({ loading, label = 'Save Changes' }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
      <button type="submit" disabled={loading} style={{
        background: 'linear-gradient(135deg,#8B6BFF 0%,#7B5CF6 100%)',
        border: 'none', borderRadius: 12, padding: '10px 24px',
        fontSize: 13, fontWeight: 700, color: '#fff', cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.7 : 1, boxShadow: '0 4px 14px rgba(123,92,246,0.25)',
      }}>
        {loading ? 'Saving…' : label}
      </button>
    </div>
  );
}

const CATS = ['streaming', 'software', 'fitness', 'cloud', 'learning', 'other'];
const CAT_META = {
  streaming: { label: 'Streaming', color: '#7B5CF6' },
  software:  { label: 'Software',  color: '#3B82F6' },
  fitness:   { label: 'Fitness',   color: '#10B981' },
  cloud:     { label: 'Cloud',     color: '#F59E0B' },
  learning:  { label: 'Learning',  color: '#EF4444' },
  other:     { label: 'Other',     color: '#6B7280' },
};

export default function SettingsPage() {
  const { user, logout } = useAuth();

  /* ── Profile state ── */
  const [name, setName]     = useState(user?.name || '');
  const [profLoading, setProfLoading] = useState(false);

  /* ── Password state ── */
  const [currPw, setCurrPw] = useState('');
  const [newPw,  setNewPw]  = useState('');
  const [confPw, setConfPw] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  /* ── Budget prefs (localStorage) ── */
  const loadBudgets = () => {
    try { const s = localStorage.getItem('subtrack_budgets'); return s ? JSON.parse(s) : {}; } catch { return {}; }
  };
  const [budgets, setBudgets] = useState(loadBudgets);
  const [alertDays, setAlertDays] = useState(() => parseInt(localStorage.getItem('subtrack_alert_days') || '7', 10));

  /* ── Save profile name ── */
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!name.trim() || name.trim().length < 2) { toast.error('Name must be at least 2 characters.'); return; }
    setProfLoading(true);
    try {
      const res = await api.patch('/auth/profile', { name: name.trim() });
      toast.success('Display name updated!');
      // Update local auth context name via storage trick (page will reflect on next load without full logout)
      const stored = localStorage.getItem('subtrack_user') || sessionStorage.getItem('subtrack_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.name = res.data.user.name;
        localStorage.setItem('subtrack_user', JSON.stringify(parsed));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update name.');
    } finally {
      setProfLoading(false);
    }
  };

  /* ── Change password ── */
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currPw) { toast.error('Enter your current password.'); return; }
    if (newPw.length < 6) { toast.error('New password must be at least 6 characters.'); return; }
    if (newPw !== confPw) { toast.error('Passwords do not match.'); return; }
    setPwLoading(true);
    try {
      await api.patch('/auth/profile', { currentPassword: currPw, newPassword: newPw });
      toast.success('Password changed successfully!');
      setCurrPw(''); setNewPw(''); setConfPw('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setPwLoading(false);
    }
  };

  /* ── Save budget prefs ── */
  const handleSaveBudgets = (e) => {
    e.preventDefault();
    localStorage.setItem('subtrack_budgets', JSON.stringify(budgets));
    localStorage.setItem('subtrack_alert_days', String(alertDays));
    toast.success('Budget preferences saved!');
  };

  const setBudget = (cat, val) => setBudgets(b => ({ ...b, [cat]: parseFloat(val) || 0 }));

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleString('en-IN', { month: 'long', year: 'numeric' })
    : 'N/A';

  return (
    <Layout>
      {/* Page header */}
      <div style={{ marginBottom: 4 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: 0 }}>Settings</h2>
        <p style={{ fontSize: 13, color: '#9CA3AF', fontWeight: 500, marginTop: 4 }}>Manage your profile, security, and spending preferences.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'flex-start' }}>

        {/* ── LEFT COLUMN ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Profile */}
          <Section title="Profile" subtitle="Update your display name shown across the app.">
            <form onSubmit={handleSaveProfile}>
              <Field label="Display Name">
                <input
                  style={inp} value={name} onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  onFocus={e => Object.assign(e.target.style, inpFocus)}
                  onBlur={e => Object.assign(e.target.style, inpBlur)}
                />
              </Field>
              <Field label="Email Address" hint="Email cannot be changed. Contact support if needed.">
                <input
                  style={{ ...inp, background: '#F3F4F6', color: '#9CA3AF', cursor: 'not-allowed' }}
                  value={user?.email || ''} readOnly
                />
              </Field>
              <SaveBtn loading={profLoading} label="Update Name" />
            </form>
          </Section>

          {/* Change Password */}
          <Section title="Change Password" subtitle="Use a strong password of at least 6 characters.">
            <form onSubmit={handleChangePassword}>
              <Field label="Current Password">
                <input
                  type="password" style={inp} value={currPw} onChange={e => setCurrPw(e.target.value)}
                  placeholder="Enter current password"
                  onFocus={e => Object.assign(e.target.style, inpFocus)}
                  onBlur={e => Object.assign(e.target.style, inpBlur)}
                />
              </Field>
              <Field label="New Password">
                <input
                  type="password" style={inp} value={newPw} onChange={e => setNewPw(e.target.value)}
                  placeholder="Min. 6 characters"
                  onFocus={e => Object.assign(e.target.style, inpFocus)}
                  onBlur={e => Object.assign(e.target.style, inpBlur)}
                />
              </Field>
              <Field label="Confirm New Password">
                <input
                  type="password" style={inp} value={confPw} onChange={e => setConfPw(e.target.value)}
                  placeholder="Repeat new password"
                  onFocus={e => Object.assign(e.target.style, inpFocus)}
                  onBlur={e => Object.assign(e.target.style, inpBlur)}
                  style={{ ...inp, borderColor: confPw && confPw !== newPw ? '#EF4444' : undefined }}
                />
              </Field>
              {confPw && confPw !== newPw && (
                <p style={{ fontSize: 11, color: '#EF4444', marginTop: -10, marginBottom: 14 }}>Passwords do not match</p>
              )}
              <SaveBtn loading={pwLoading} label="Change Password" />
            </form>
          </Section>

          {/* Account Info + Sign Out */}
          <Section title="Account" subtitle="Your account details and session management.">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Member Since', value: memberSince },
                { label: 'Account Email', value: user?.email || '—' },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F9FAFB' }}>
                  <span style={{ fontSize: 13, color: '#6B7280', fontWeight: 500 }}>{r.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{r.value}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 20 }}>
              <button
                onClick={() => { if (window.confirm('Sign out of your account?')) logout(); }}
                style={{
                  width: '100%', padding: '11px', borderRadius: 12,
                  border: '1.5px solid #FEE2E2', background: '#FEF2F2',
                  fontSize: 13, fontWeight: 700, color: '#EF4444', cursor: 'pointer',
                  transition: 'all .15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#EF4444'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.color = '#EF4444'; }}
              >
                Sign Out
              </button>
            </div>
          </Section>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Budget Preferences */}
          <Section title="Category Budgets" subtitle="Monthly limits per category. Used in the Overload Control page.">
            <form onSubmit={handleSaveBudgets}>
              {CATS.map(cat => (
                <Field key={cat} label={CAT_META[cat].label}>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#9CA3AF', pointerEvents: 'none' }}>₹</span>
                    <input
                      type="number" min="0" step="1"
                      value={budgets[cat] || ''}
                      onChange={e => setBudget(cat, e.target.value)}
                      placeholder="No limit set"
                      style={{ ...inp, paddingLeft: 26 }}
                      onFocus={e => Object.assign(e.target.style, inpFocus)}
                      onBlur={e => Object.assign(e.target.style, inpBlur)}
                    />
                  </div>
                </Field>
              ))}

              {/* Renewal alert threshold */}
              <div style={{ marginTop: 8, paddingTop: 18, borderTop: '1px solid #F3F4F6' }}>
                <Field label="Renewal Alert (days before)" hint="You'll see warnings this many days before a subscription renews.">
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[3, 5, 7, 14].map(d => (
                      <button key={d} type="button"
                        onClick={() => setAlertDays(d)}
                        style={{
                          flex: 1, padding: '9px 0', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                          border: alertDays === d ? '1.5px solid #7B5CF6' : '1.5px solid #E5E7EB',
                          background: alertDays === d ? '#EDE9FE' : '#F9FAFB',
                          color: alertDays === d ? '#7B5CF6' : '#6B7280',
                        }}
                      >
                        {d}d
                      </button>
                    ))}
                  </div>
                </Field>
              </div>

              <SaveBtn loading={false} label="Save Preferences" />
            </form>
          </Section>

          {/* Quick summary card */}
          <div style={{ background: 'linear-gradient(135deg,#8B6BFF 0%,#7B5CF6 100%)', borderRadius: 20, padding: '22px 24px', color: '#fff' }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.65)', marginBottom: 12 }}>Budget Summary</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {CATS.filter(c => (budgets[c] || 0) > 0).length === 0 ? (
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>No budgets set yet. Add limits above to track your spending.</p>
              ) : CATS.filter(c => (budgets[c] || 0) > 0).map(cat => (
                <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ width: 7, height: 7, borderRadius: 2, background: 'rgba(255,255,255,0.6)' }} />
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>{CAT_META[cat].label}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{fmt(budgets[cat])}/mo</span>
                </div>
              ))}
              {CATS.filter(c => (budgets[c] || 0) > 0).length > 0 && (
                <div style={{ marginTop: 8, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.15)', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Total budget</span>
                  <span style={{ fontSize: 14, fontWeight: 800 }}>{fmt(CATS.reduce((a,c) => a + (budgets[c]||0), 0))}/mo</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

import { toast } from 'react-toastify';
import api from '../services/api';

const CATEGORY_ICONS = {
  streaming:'📺', software:'💻', fitness:'🏋️', cloud:'☁️', learning:'📚', other:'📦',
};
const CATEGORY_COLORS = {
  streaming:'rgba(239,68,68,.12)',  software:'rgba(59,130,246,.12)',
  fitness:'rgba(34,197,94,.12)',    cloud:'rgba(14,165,233,.12)',
  learning:'rgba(245,158,11,.12)', other:'rgba(124,92,252,.12)',
};
const CATEGORY_TEXT = {
  streaming:'#DC2626', software:'#2563EB',
  fitness:'#16A34A',   cloud:'#0284C7',
  learning:'#D97706',  other:'#7C5CFC',
};

const SubscriptionCard = ({ sub, onEdit, onDelete }) => {
  const fmt = n => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(n);

  const monthlyCost = sub.billingCycle === 'yearly' ? sub.cost / 12 : sub.cost;
  const renewalDate = new Date(sub.renewalDate);
  const today = new Date(); today.setHours(0,0,0,0);
  const daysLeft = Math.ceil((renewalDate - today) / 86400000);
  const isRenewing = daysLeft >= 0 && daysLeft <= 7;
  const isOverdue  = daysLeft < 0;
  const isInactive = sub.status === 'inactive';

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${sub.serviceName}"?`)) return;
    try {
      await api.delete(`/subscriptions/${sub._id}`);
      toast.success(`"${sub.serviceName}" removed.`);
      onDelete(sub._id);
    } catch { toast.error('Failed to delete.'); }
  };

  return (
    <div
      className={`sub-card${isRenewing && !isInactive ? ' renewing-soon' : ''}${isOverdue && !isInactive ? ' overdue' : ''}`}
      style={{ opacity: isInactive ? .55 : 1 }}
    >
      {/* Renewal badge */}
      {(isRenewing || isOverdue) && !isInactive && (
        <span
          className={`badge ${isOverdue ? 'badge-red' : 'badge-amber'}`}
          style={{ position:'absolute', top:'1rem', right:'1rem' }}
        >
          {isOverdue ? '⚠ Overdue' : `🔔 ${daysLeft === 0 ? 'Today' : daysLeft + 'd'}`}
        </span>
      )}

      {/* Header row */}
      <div style={{ display:'flex', alignItems:'center', gap:'.8rem' }}>
        <div
          className="sub-icon"
          style={{
            background: CATEGORY_COLORS[sub.category] || CATEGORY_COLORS.other,
          }}
        >
          {CATEGORY_ICONS[sub.category] || '📦'}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:700, fontSize:'.95rem', color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {sub.serviceName}
          </div>
          <div style={{ fontSize:'.74rem', color:'var(--text-secondary)', marginTop:'.1rem', textTransform:'capitalize' }}>
            <span
              style={{
                background: CATEGORY_COLORS[sub.category] || CATEGORY_COLORS.other,
                color: CATEGORY_TEXT[sub.category] || CATEGORY_TEXT.other,
                padding:'.1rem .5rem', borderRadius:'2rem', fontSize:'.7rem', fontWeight:600,
              }}
            >
              {sub.category}
            </span>
            <span style={{ marginLeft:'.4rem' }}>· {sub.usageFrequency}</span>
          </div>
        </div>
      </div>

      {/* Cost row */}
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between' }}>
        <div>
          <span style={{ fontSize:'1.45rem', fontWeight:800, color:'var(--text-primary)', letterSpacing:'-.03em' }}>
            {fmt(monthlyCost)}
          </span>
          <span style={{ fontSize:'.75rem', color:'var(--text-muted)', marginLeft:'.2rem' }}>/mo</span>
        </div>
        <span className={`badge ${sub.billingCycle === 'yearly' ? 'badge-green' : 'badge-purple'}`}>
          {sub.billingCycle === 'yearly' ? `${fmt(sub.cost)}/yr` : 'Monthly'}
        </span>
      </div>

      {/* Renewal date */}
      <div style={{ fontSize:'.78rem', color: isOverdue ? '#DC2626' : 'var(--text-secondary)', display:'flex', alignItems:'center', gap:'.3rem' }}>
        <span>🗓</span>
        <span>Renews {renewalDate.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</span>
        {isInactive && <span className="badge badge-gray" style={{ marginLeft:'auto' }}>Inactive</span>}
      </div>

      {/* Actions */}
      <div style={{ display:'flex', gap:'.5rem', paddingTop:'.5rem', borderTop:'1px solid var(--border-soft)' }}>
        <button
          onClick={() => onEdit(sub)}
          style={{
            flex:1, padding:'.5rem', background:'var(--accent-dim)',
            border:'1px solid rgba(124,92,252,.2)', borderRadius:'var(--radius-sm)',
            color:'var(--accent)', fontSize:'.8rem', fontWeight:600,
            cursor:'pointer', fontFamily:'Inter,sans-serif', transition:'all .15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,92,252,.18)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--accent-dim)'}
        >
          ✏ Edit
        </button>
        <button
          onClick={handleDelete}
          style={{
            flex:1, padding:'.5rem', background:'rgba(239,68,68,.07)',
            border:'1px solid rgba(239,68,68,.18)', borderRadius:'var(--radius-sm)',
            color:'#DC2626', fontSize:'.8rem', fontWeight:600,
            cursor:'pointer', fontFamily:'Inter,sans-serif', transition:'all .15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,.14)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,.07)'}
        >
          🗑 Delete
        </button>
      </div>
    </div>
  );
};

export default SubscriptionCard;

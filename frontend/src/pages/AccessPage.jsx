import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import AddSubscriptionModal from '../components/AddSubscriptionModal';
import api from '../services/api';
import { toast } from 'react-toastify';
import { ChevronDown, Bookmark, LayoutGrid, Check, X, Edit2, Trash2, Tv2, Code2, Dumbbell, Cloud, BookOpen, Package } from 'lucide-react';

/* ── helpers ─────────────────────────────────────────────────────────────── */
const CATS = ['streaming','software','fitness','cloud','learning','other'];
const CAT_META = {
  streaming:{ label:'Streaming', Icon: Tv2,       color:'#7B5CF6', light:'#EDE9FE' },
  software: { label:'Software',  Icon: Code2,      color:'#3B82F6', light:'#DBEAFE' },
  fitness:  { label:'Fitness',   Icon: Dumbbell,   color:'#10B981', light:'#D1FAE5' },
  cloud:    { label:'Cloud',     Icon: Cloud,      color:'#F59E0B', light:'#FEF3C7' },
  learning: { label:'Learning',  Icon: BookOpen,   color:'#EF4444', light:'#FEE2E2' },
  other:    { label:'Other',     Icon: Package,    color:'#6B7280', light:'#F3F4F6' },
};

/* ── Category icon pill ─────────────────────────────────────────────────── */
function CatIcon({ cat, size = 22 }) {
  const m = CAT_META[cat];
  if (!m) return null;
  const { Icon, color, light } = m;
  return (
    <div style={{ width: size, height: size, borderRadius: 7, background: light, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={size * 0.55} color={color} strokeWidth={2.2} />
    </div>
  );
}
const APP_COLORS = { dropbox:'#0061FF',zoom:'#2D8CFF',marketo:'#5C4EE5',atlassian:'#0052CC',notion:'#000',hubspot:'#FF7A59',netflix:'#E50914',spotify:'#1DB954' };
const appColor = (name) => APP_COLORS[name?.toLowerCase()] || '#7B5CF6';
const fmt  = n => '₹' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(n || 0));
const fmtD = n => '₹' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(+(n || 0).toFixed(2));
const toMonthly = s => s.billingCycle==='yearly' ? s.cost/12 : s.billingCycle==='weekly' ? s.cost*4.33 : s.cost;

// Budgets stored in native ₹
const DEFAULT_BUDGETS = { streaming: 500, software: 1000, fitness: 500, cloud: 800, learning: 400, other: 600 };

function AppIcon({ name='', size=30 }) {
  const c = appColor(name);
  return (
    <div style={{ width:size, height:size, minWidth:size, borderRadius:9, background:c, color:'#fff', fontWeight:800, fontSize:size*0.44, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

/* ── Small bar for expense widget ─ */
function ExpBar({ label, pct, color }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:7 }}>
      <span style={{ fontSize:9, fontWeight:600, color:'#374151', width:72, flexShrink:0, lineHeight:1.2 }}>{label}</span>
      <div style={{ flex:1, height:5, borderRadius:99, background:'#F3F0FF', overflow:'hidden' }}>
        <div style={{ width:`${pct}%`, height:'100%', background:color, borderRadius:99 }} />
      </div>
      <span style={{ fontSize:9, fontWeight:700, color, width:22, textAlign:'right' }}>{pct}%</span>
    </div>
  );
}

/* ── Subscription row in left panel ─ */
function SubRow({ sub, onEdit, onDelete, perm }) {
  const ps = {
    active:   { bg:'#E8F5E9', color:'#2E7D32', border:'1px solid #A5D6A7', label:'Active'   },
    inactive: { bg:'#F5F5F5', color:'#9E9E9E', border:'1px solid #E0E0E0', label:'Inactive' },
    rarely:   { bg:'#FEF3C7', color:'#92400E', border:'1px solid #FCD34D', label:'Rarely used' },
  };
  const key = sub.usageFrequency === 'rarely' ? 'rarely' : sub.status === 'inactive' ? 'inactive' : 'active';
  const style = ps[key];
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1.8fr 1.2fr 1fr 1.2fr 80px', alignItems:'center', padding:'12px 0', borderTop:'1px solid #F5F5F5', gap:8 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <AppIcon name={sub.serviceName} size={30} />
        <span style={{ fontSize:13, fontWeight:700, color:'#111827' }}>{sub.serviceName}</span>
      </div>
      <div style={{ fontSize:12, color:'#6B7280', fontWeight:500 }}>{CAT_META[sub.category]?.label || sub.category}</div>
      <div style={{ fontSize:13, fontWeight:700, color:'#111827' }}>{fmtD(toMonthly(sub))}/mo</div>
      <div>
        <span style={{ display:'inline-flex', alignItems:'center', padding:'3px 10px', borderRadius:6, fontSize:11, fontWeight:700, background:style.bg, color:style.color, border:style.border }}>
          {style.label}
        </span>
      </div>
      <div style={{ display:'flex', gap:5, justifyContent:'flex-end' }}>
        <button onClick={() => onEdit(sub)} style={{ width:26, height:26, borderRadius:7, border:'1px solid #E5E7EB', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#9CA3AF' }}>
          <Edit2 size={11} />
        </button>
        <button onClick={() => onDelete(sub)} style={{ width:26, height:26, borderRadius:7, border:'1px solid #FEE2E2', background:'#FEF2F2', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#EF4444' }}>
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  );
}

export default function AccessPage() {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [budgets, setBudgets] = useState(() => {
    try { const s = localStorage.getItem('subtrack_budgets'); return s ? JSON.parse(s) : DEFAULT_BUDGETS; } catch { return DEFAULT_BUDGETS; }
  });
  const [editingBudget, setEditingBudget] = useState(null);
  const [tempBudget, setTempBudget] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const load = useCallback(async () => {
    try { const r = await api.get('/subscriptions'); setSubs(r.data.data); }
    catch { toast.error('Failed to load.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const saveBudget = (cat, val) => {
    const nb = { ...budgets, [cat]: parseFloat(val)||0 };
    setBudgets(nb); localStorage.setItem('subtrack_budgets', JSON.stringify(nb));
    setEditingBudget(null);
  };

  const handleDelete = async (sub) => {
    if (!window.confirm(`Delete "${sub.serviceName}"?`)) return;
    try { await api.delete(`/subscriptions/${sub._id}`); toast.success('Removed.'); load(); }
    catch { toast.error('Failed.'); }
  };

  /* ── Computed ── */
  const active = subs.filter(s => s.status==='active');
  const rarely = subs.filter(s => s.usageFrequency==='rarely' && s.status==='active');
  const catSpend = {}; CATS.forEach(c => { catSpend[c]=0; });
  active.forEach(s => { catSpend[s.category||'other'] += toMonthly(s); });
  const totalMonthly = active.reduce((a,s) => a+toMonthly(s), 0);
  const potSaving = rarely.reduce((a,s) => a+toMonthly(s), 0);
  const totalBudget = CATS.reduce((a,c) => a+(budgets[c]||0), 0);

  /* Bar segments — budget usage per category as proportion of total budget */
  const budgetSegments = CATS.map(c => ({
    cat: c,
    proportion: totalBudget > 0 ? Math.round(((budgets[c]||0)/totalBudget)*33) : 0,
    overloaded: catSpend[c] > (budgets[c]||0) && (budgets[c]||0) > 0,
    color: CAT_META[c].color,
  }));

  /* Top 3 spending categories */
  const top3 = CATS.map(c => ({ cat:c, spend:catSpend[c] })).filter(x=>x.spend>0).sort((a,b)=>b.spend-a.spend).slice(0,3);
  const top3Total = top3.reduce((a,x) => a+x.spend, 0)||1;

  return (
    <Layout>
      <div style={{ display:'flex', gap:20, alignItems:'flex-start' }}>

        {/* ══ LEFT: white card ══════════════════════════════════════════════ */}
        <div style={{ flex:1, background:'#fff', borderRadius:24, boxShadow:'0 2px 20px rgba(0,0,0,0.06)', overflow:'hidden', minWidth:0 }}>
          {/* Header block */}
          <div style={{ padding:'28px 32px 0 32px' }}>
            {/* Logo */}
            <div style={{ width:38, height:38, background:'linear-gradient(135deg,#A78BFA 0%,#7C3AED 100%)', borderRadius:11, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 10px rgba(124,58,237,0.35)', marginBottom:18 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <h1 style={{ fontSize:26, fontWeight:800, color:'#111827', margin:'0 0 4px 0' }}>Overload Control</h1>
            <p style={{ fontSize:13, color:'#9CA3AF', fontWeight:500, margin:'0 0 22px 0' }}>Monitor spending across categories and flag subscriptions to cut.</p>

            {/* ── Budget bar segments ── */}
            <div style={{ display:'flex', gap:4, height:40, marginBottom:14 }}>
              {CATS.map(cat => {
                const budget = budgets[cat]||0;
                const spend  = catSpend[cat]||0;
                const over   = spend > budget && budget > 0;
                const segs   = Math.max(2, Math.round((budget/(totalBudget||1))*30));
                const usedSegs = budget > 0 ? Math.round((Math.min(spend,budget)/budget)*segs) : 0;
                return Array.from({ length: segs }).map((_, j) => (
                  <div key={`${cat}-${j}`} style={{
                    flex:1, borderRadius:4,
                    background: j < usedSegs
                      ? (over ? `linear-gradient(180deg,#F87171 0%,#EF4444 100%)` : `linear-gradient(180deg,${CAT_META[cat].color}CC 0%,${CAT_META[cat].color} 100%)`)
                      : '#E9E9F0',
                  }} />
                ));
              })}
            </div>

            {/* ── Category spend-vs-budget mini chart grid ── */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px 14px', marginBottom:24 }}>
              {CATS.map(cat => {
                const spend  = catSpend[cat] || 0;
                const budget = budgets[cat]  || 0;
                const over   = spend > budget && budget > 0;
                const pct    = budget > 0 ? Math.min(100, Math.round((spend / budget) * 100)) : 0;
                const isEditing = editingBudget === cat;
                const { color, light, label } = CAT_META[cat];
                return (
                  <div key={cat} style={{ background:'#FAFAFA', borderRadius:12, padding:'10px 12px', border:`1px solid ${over ? '#FECACA' : '#F3F4F6'}` }}>
                    {/* Header row */}
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:7 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <CatIcon cat={cat} size={24} />
                        <span style={{ fontSize:11, fontWeight:700, color: over ? '#EF4444' : '#111827' }}>{label}</span>
                      </div>
                      {over && <span style={{ fontSize:9, fontWeight:800, color:'#EF4444', background:'#FEE2E2', borderRadius:4, padding:'2px 6px' }}>OVER</span>}
                    </div>

                    {/* Mini bar graph: spend vs budget */}
                    <div style={{ position:'relative', height:6, background:'#E9E9F0', borderRadius:99, overflow:'hidden', marginBottom:6 }}>
                      <div style={{
                        position:'absolute', left:0, top:0, height:'100%',
                        width:`${pct}%`,
                        background: over
                          ? 'linear-gradient(90deg,#F87171,#EF4444)'
                          : `linear-gradient(90deg,${color}99,${color})`,
                        borderRadius:99,
                        transition:'width .4s ease',
                      }} />
                    </div>

                    {/* Values row */}
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <span style={{ fontSize:10, fontWeight:700, color: over ? '#EF4444' : color }}>{fmt(spend)}</span>
                      {isEditing ? (
                        <div style={{ display:'flex', alignItems:'center', gap:3 }}>
                          <input
                            autoFocus type="number" value={tempBudget}
                            onChange={e => setTempBudget(e.target.value)}
                            onKeyDown={e => { if(e.key==='Enter') saveBudget(cat,tempBudget); if(e.key==='Escape') setEditingBudget(null); }}
                            style={{ width:46, border:`1.5px solid ${color}`, borderRadius:5, padding:'2px 5px', fontSize:10, fontWeight:700, outline:'none', textAlign:'right' }}
                          />
                          <button onClick={() => saveBudget(cat,tempBudget)} style={{ border:'none', background:color, color:'#fff', borderRadius:5, padding:'2px 6px', fontSize:9, fontWeight:800, cursor:'pointer' }}>✓</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditingBudget(cat); setTempBudget(budgets[cat]||''); }}
                          style={{ fontSize:9, color:'#9CA3AF', fontWeight:600, background:'none', border:'none', padding:0, cursor:'pointer' }}
                        >
                          {budget > 0 ? `/ ${fmt(budget)}` : '+ Set limit'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Subscriptions table header ── */}
            <h2 style={{ fontSize:17, fontWeight:800, color:'#111827', margin:'0 0 0 0' }}>Subscriptions</h2>
            <div style={{ display:'grid', gridTemplateColumns:'1.8fr 1.2fr 1fr 1.2fr 80px', gap:8, padding:'10px 0 6px 0', borderBottom:'1px solid #F3F4F6' }}>
              {['Service','Category','Cost/mo','Usage Status',''].map((h,i) => (
                <div key={i} style={{ fontSize:11, fontWeight:600, color:'#9CA3AF' }}>{h}</div>
              ))}
            </div>
          </div>

          {/* ── Sub rows ── */}
          <div style={{ padding:'0 32px 24px 32px' }}>
            {loading ? (
              <div style={{ padding:'24px 0', color:'#9CA3AF', fontSize:13 }}>Loading...</div>
            ) : subs.length === 0 ? (
              <div style={{ padding:'28px 0', textAlign:'center', color:'#9CA3AF', fontSize:13 }}>No subscriptions yet. Add one from the dashboard!</div>
            ) : subs.map((s,i) => (
              <SubRow key={s._id} sub={s} onEdit={sub => { setEditData(sub); setModalOpen(true); }} onDelete={handleDelete} />
            ))}
          </div>
        </div>

        {/* ══ RIGHT: purple widget panel (exact reference layout) ════════ */}
        <div style={{ width:360, flexShrink:0, background:'linear-gradient(180deg,#9575F8 0%,#7B5CF6 100%)', borderRadius:24, padding:'24px 20px', boxShadow:'0 12px 48px rgba(107,78,255,0.30)', display:'flex', flexDirection:'column', gap:18, color:'#fff' }}>

          {/* ── Section 1: Spending Insights (= My Favorites) ── */}
          <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:15, fontWeight:800 }}>
            <Bookmark size={17} fill="#fff" strokeWidth={0} /> Spending Insights
          </div>

          <div style={{ display:'flex', gap:10 }}>
            {/* By Category widget */}
            <div style={{ flex:1, background:'#fff', borderRadius:14, padding:'12px 12px 8px 12px' }}>
              <div style={{ fontSize:8, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:9 }}>By Category</div>
              {top3.length === 0 ? (
                <div style={{ fontSize:10, color:'#9CA3AF' }}>No data yet</div>
              ) : top3.map((x,i) => (
                <ExpBar key={x.cat} label={CAT_META[x.cat].label} pct={Math.round((x.spend/top3Total)*100)} color={CAT_META[x.cat].color} />
              ))}
              <div style={{ marginTop:8, paddingTop:7, borderTop:'1px solid #F3F4F6', fontSize:9, fontWeight:700, color:'#6B7280' }}>Top spending categories</div>
            </div>

            {/* Budget status widget */}
            <div style={{ flex:1, background:'#fff', borderRadius:14, padding:'12px 12px 8px 12px' }}>
              <div style={{ fontSize:8, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:9 }}>Budget Health</div>
              {CATS.filter(c => (budgets[c]||0)>0 && catSpend[c]>0).slice(0,3).map((c,i) => {
                const over = catSpend[c] > (budgets[c]||1);
                return (
                  <div key={c} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                      <div style={{ width:7, height:7, borderRadius:2, background:CAT_META[c].color }} />
                      <span style={{ fontSize:10, fontWeight:600, color:'#374151' }}>{CAT_META[c].label}</span>
                    </div>
                    <span style={{ fontSize:9, fontWeight:700, color: over?'#EF4444':'#10B981' }}>{over?'Over':'OK'}</span>
                  </div>
                );
              })}
              {CATS.filter(c => (budgets[c]||0)>0 && catSpend[c]>0).length === 0 && (
                <div style={{ fontSize:10, color:'#9CA3AF' }}>Set category budgets on the left</div>
              )}
              <div style={{ marginTop:8, paddingTop:7, borderTop:'1px solid #F3F4F6', fontSize:9, fontWeight:700, color:'#6B7280' }}>Budget vs. actual</div>
            </div>
          </div>

          {/* ── Section 2: Recommendations (= Add Widgets) ── */}
          <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:15, fontWeight:800 }}>
            <LayoutGrid size={17} /> Recommendations
          </div>

          <div style={{ display:'flex', gap:10 }}>
            {/* Tip widget (white) */}
            <div style={{ flex:1, background:'#fff', borderRadius:14, padding:'14px', display:'flex', flexDirection:'column' }}>
              <div style={{ fontSize:8, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>Spending tip</div>
              <div style={{ fontSize:12, fontWeight:800, color:'#7B5CF6', lineHeight:1.45, flex:1 }}>
                {potSaving > 0
                  ? `You have ${rarely.length} subscription${rarely.length>1?'s':''} you rarely use. Cancel them to save ${fmt(potSaving)}/mo.`
                  : 'Great job! All your subscriptions are in regular use. Keep reviewing them monthly.'}
              </div>
              <div style={{ marginTop:10, paddingTop:8, borderTop:'1px solid #F3F4F6', fontSize:9, fontWeight:700, color:'#6B7280' }}>Monthly review tip</div>
            </div>

            {/* Save X% advice card (purple) */}
            <div style={{ flex:1, background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:14, padding:'14px', display:'flex', flexDirection:'column', backdropFilter:'blur(4px)' }}>
              <div style={{ fontSize:8, fontWeight:700, color:'rgba(255,255,255,0.65)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>Advice</div>
              <div style={{ fontSize:20, fontWeight:800, color:'#fff', lineHeight:1.1, marginBottom:4 }}>
                {totalBudget > 0 ? `Save ${Math.max(0, Math.round(((totalMonthly-totalBudget)/totalMonthly)*100))||'more'}%` : 'Set budgets'}
              </div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.75)', lineHeight:1.4, flex:1 }}>
                {totalBudget > 0
                  ? totalMonthly > totalBudget ? 'You are over your total budget. Review rarely-used subscriptions.' : 'You are within budget. Nice work!'
                  : 'Set category budgets to unlock savings recommendations.'}
              </div>
              <div style={{ marginTop:10, paddingTop:8, borderTop:'1px solid rgba(255,255,255,0.12)', fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.65)' }}>Budget advisor</div>
            </div>
          </div>

          {/* ── Section 3: Rarely Used — Subscriptions to Review ── */}
          <div style={{ background:'#fff', borderRadius:14, padding:'14px 14px 8px 14px' }}>
            <div style={{ fontSize:8, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>Subscriptions to Review</div>

            {loading ? (
              <div style={{ fontSize:12, color:'#9CA3AF', padding:'8px 0' }}>Loading...</div>
            ) : rarely.length === 0 ? (
              <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#10B981', fontWeight:600, padding:'6px 0' }}>
                ✓ No rarely-used subscriptions!
              </div>
            ) : rarely.slice(0,3).map((s,i) => (
              <div key={s._id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 0', borderBottom: i < Math.min(rarely.length,3)-1 ? '1px solid #F5F5F5' : 'none' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <AppIcon name={s.serviceName} size={26} />
                  <div>
                    <div style={{ fontSize:11, fontWeight:700, color:'#111827', lineHeight:1.2 }}>{s.serviceName}</div>
                    <div style={{ fontSize:9, color:'#9CA3AF', marginTop:1 }}>{fmtD(toMonthly(s))}/mo · {s.category}</div>
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ fontSize:9, fontWeight:700, color:'#7B5CF6', background:'#EDE9FE', padding:'2px 7px', borderRadius:5 }}>rarely used</span>
                  <div style={{ display:'flex', gap:4 }}>
                    <button onClick={() => handleDelete(s)} style={{ width:18, height:18, borderRadius:'50%', border:'1px solid #E5E7EB', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <X size={9} color="#9CA3AF" />
                    </button>
                    <button onClick={() => { setEditData(s); setModalOpen(true); }} style={{ width:18, height:18, borderRadius:'50%', border:'none', background:'#10B981', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <Check size={9} color="#fff" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <div style={{ paddingTop:8, paddingBottom:2, fontSize:9, fontWeight:700, color:'#6B7280' }}>
              {rarely.length > 3 ? `+${rarely.length-3} more to review` : 'Subscriptions to review'}
            </div>
          </div>
        </div>
      </div>

      <AddSubscriptionModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSuccess={load} editData={editData} />
    </Layout>
  );
}

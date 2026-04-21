import { useState, useEffect } from 'react';

const RenewalAlertBanner = ({ subscriptions }) => {
  const [visible, setVisible] = useState([]);

  useEffect(() => {
    if (!subscriptions?.length) return;
    const today = new Date(); today.setHours(0,0,0,0);
    const in7 = new Date(today); in7.setDate(today.getDate()+7);
    let dismissed = [];
    try { dismissed = JSON.parse(sessionStorage.getItem('som_dismissed_alerts')||'[]'); } catch {}
    setVisible(subscriptions.filter(s => {
      if (s.status!=='active'||!s.renewalDate||dismissed.includes(s._id)) return false;
      const rd = new Date(s.renewalDate); rd.setHours(0,0,0,0);
      return rd>=today && rd<=in7;
    }));
  }, [subscriptions]);

  const dismiss = id => {
    setVisible(p => p.filter(s=>s._id!==id));
    try {
      const d = JSON.parse(sessionStorage.getItem('som_dismissed_alerts')||'[]');
      d.push(id); sessionStorage.setItem('som_dismissed_alerts',JSON.stringify(d));
    } catch {}
  };

  if (!visible.length) return null;

  const fmt = n => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(n);

  return (
    <div style={{display:'flex',flexDirection:'column',gap:'8px',marginBottom:'16px'}}>
      {visible.map(s => {
        const d = Math.ceil((new Date(s.renewalDate)-new Date())/86400000);
        const urgent = d<=2;
        return (
          <div key={s._id} id={`renewal-alert-${s._id}`}
            className={`renewal-alert ${urgent?'renewal-alert-urgent':'renewal-alert-warn'}`}>
            <span style={{fontSize:'1rem'}}>{urgent?'🔴':'🟡'}</span>
            <div style={{flex:1}}>
              <strong style={{color:urgent?'#991B1B':'#92400E',fontSize:'.87rem'}}>{s.serviceName}</strong>{' '}
              <span style={{fontSize:'.82rem',color:'#6B7280'}}>
                renews {d===0?'today':d===1?'tomorrow':`in ${d} days`} — {fmt(s.cost)}/{s.billingCycle}
              </span>
            </div>
            <button onClick={()=>dismiss(s._id)} aria-label="Dismiss"
              style={{background:'none',border:'none',color:'#9CA3AF',cursor:'pointer',fontSize:'1rem',padding:'0 4px',lineHeight:1,transition:'color .15s'}}
              onMouseEnter={e=>e.target.style.color='#374151'}
              onMouseLeave={e=>e.target.style.color='#9CA3AF'}>
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default RenewalAlertBanner;

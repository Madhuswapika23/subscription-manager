const InsightsPanel = ({ subscriptions }) => {
  if (!subscriptions || subscriptions.length === 0) return null;

  const toMonthly = (cost, cycle) =>
    cycle==='yearly' ? cost/12 : cycle==='weekly' ? cost*4.33 : cost;

  const active = subscriptions.filter(s=>s.status==='active');
  const totalMonthly = active.reduce((sum,s)=>sum+toMonthly(s.cost,s.billingCycle),0);
  const rarelyUsed   = active.filter(s=>s.usageFrequency==='rarely');

  const categoryMap = {};
  active.forEach(s=>{
    if (!categoryMap[s.category]) categoryMap[s.category]=[];
    categoryMap[s.category].push(s);
  });
  const duplicates = Object.entries(categoryMap).filter(([,l])=>l.length>=2);
  const monthlySubs = active.filter(s=>s.billingCycle==='monthly');

  const fmt = n => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(n);

  return (
    <div className="insights-panel">
      <div className="insights-header">
        <span style={{fontSize:'1.15rem'}}>💡</span>
        <h3 style={{fontSize:'.95rem',fontWeight:700,color:'var(--text)'}}>Insights &amp; Recommendations</h3>
      </div>

      {/* Total spend */}
      <div className="insight-card insight-spend">
        <div style={{fontSize:'1.5rem',fontWeight:800,color:'#6366F1',letterSpacing:'-.03em'}}>
          {fmt(totalMonthly)}
          <span style={{fontSize:'.82rem',fontWeight:500,color:'#6B7280',marginLeft:'.3rem'}}>/month</span>
        </div>
        <p style={{fontSize:'.82rem',color:'#6B7280',marginTop:'.3rem'}}>
          That's {fmt(totalMonthly*12)} per year on active subscriptions.
        </p>
      </div>

      {/* Rarely used */}
      {rarelyUsed.length>0 && (
        <div className="insight-card insight-warn">
          <div className="insight-pill insight-pill-warn">⚠️ Rarely Used</div>
          <p style={{fontSize:'.82rem',color:'#6B7280',margin:'.5rem 0 .6rem'}}>
            Consider cancelling — save{' '}
            <strong style={{color:'#92400E'}}>
              {fmt(rarelyUsed.reduce((s,x)=>s+toMonthly(x.cost,x.billingCycle)*12,0))}
            </strong>/year.
          </p>
          <ul style={{listStyle:'none',display:'flex',flexDirection:'column',gap:'5px'}}>
            {rarelyUsed.map(s=>(
              <li key={s._id} className="insight-list-item">
                <span style={{fontWeight:600,color:'var(--text)',fontSize:'.85rem'}}>{s.serviceName}</span>
                <span style={{fontSize:'.78rem',color:'#D97706',fontWeight:600}}>
                  {fmt(toMonthly(s.cost,s.billingCycle)*12)}/yr waste
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Duplicates */}
      {duplicates.length>0 && (
        <div className="insight-card insight-danger">
          <div className="insight-pill insight-pill-danger">🔁 Duplicate Services</div>
          <p style={{fontSize:'.82rem',color:'#6B7280',margin:'.5rem 0 .6rem'}}>
            Multiple active subs in the same category.
          </p>
          {duplicates.map(([cat,list])=>(
            <div key={cat} style={{marginBottom:'8px'}}>
              <span style={{fontSize:'.73rem',textTransform:'capitalize',fontWeight:700,color:'#991B1B',letterSpacing:'.04em'}}>{cat}</span>
              <div style={{display:'flex',flexWrap:'wrap',gap:'5px',marginTop:'4px'}}>
                {list.map(s=><span key={s._id} className="dup-badge">{s.serviceName}</span>)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Optimization tips */}
      {monthlySubs.length>0 && (
        <div className="insight-card insight-tip">
          <div className="insight-pill insight-pill-tip">🚀 Optimization Tips</div>
          <ul style={{listStyle:'none',display:'flex',flexDirection:'column',gap:'5px',marginTop:'10px'}}>
            {monthlySubs.map(s=>{
              const saving = s.cost*12*0.17;
              return (
                <li key={s._id} className="insight-list-item">
                  <span style={{fontSize:'.82rem',color:'#6B7280'}}>
                    Switch <strong style={{color:'var(--text)'}}>{s.serviceName}</strong> to yearly
                  </span>
                  <span style={{fontSize:'.78rem',color:'#16A34A',fontWeight:700,whiteSpace:'nowrap'}}>
                    saves ≈{fmt(saving)}/yr
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {rarelyUsed.length===0 && duplicates.length===0 && monthlySubs.length===0 && (
        <p style={{fontSize:'.84rem',color:'#9CA3AF',textAlign:'center',padding:'12px 0'}}>
          🎉 Your subscriptions look well-optimised!
        </p>
      )}
    </div>
  );
};

export default InsightsPanel;

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import AddSubscriptionModal from '../components/AddSubscriptionModal';
import Sidebar from '../components/Navbar';
import RenewalAlertBanner from '../components/RenewalAlertBanner';
import {
  CreditCard, Package, RefreshCw, AlertTriangle,
  Search, Bell, Edit2, Trash2, TrendingUp, TrendingDown,
  ArrowUpDown, ChevronUp, ChevronDown, Plus
} from 'lucide-react';


const FILTERS = ['all','streaming','software','fitness','cloud','learning','other'];
const CAT_COLOR = {
  streaming:'#FEE2E2',software:'#DBEAFE',fitness:'#DCFCE7',
  cloud:'#E0F2FE',learning:'#FEF9C3',other:'#F3E8FF'
};
const CAT_ICON = {streaming:'📺',software:'💻',fitness:'🏋️',cloud:'☁️',learning:'📚',other:'📦'};
const TOAST_KEY='som_toasted_ids';

const fireUrgentToasts = subs => {
  const today=new Date();today.setHours(0,0,0,0);
  let done=[];try{done=JSON.parse(sessionStorage.getItem(TOAST_KEY)||'[]');}catch{}
  const fmt=n=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(n);
  subs.forEach(s=>{
    if(s.status!=='active'||!s.renewalDate||done.includes(s._id))return;
    const rd=new Date(s.renewalDate);rd.setHours(0,0,0,0);
    const d=Math.round((rd-today)/86400000);
    if(d>1)return;
    const lbl=d<0?`was due ${Math.abs(d)}d ago`:d===0?'renews TODAY':'renews TOMORROW';
    toast(
      <div style={{display:'flex',flexDirection:'column',gap:'2px'}}>
        <span style={{fontWeight:700,fontSize:'.88rem'}}>🔴 {d<0?'Overdue':'Due Soon'}: {s.serviceName}</span>
        <span style={{fontSize:'.78rem',opacity:.8}}>{lbl} · {fmt(s.cost)}/{s.billingCycle}</span>
      </div>,
      {toastId:`u-${s._id}`,autoClose:8000,style:{background:'#FFF',border:'1px solid #FECACA',borderRadius:'12px'}}
    );
    done.push(s._id);
  });
  try{sessionStorage.setItem(TOAST_KEY,JSON.stringify(done));}catch{}
};

const DashboardPage = () => {
  const { user } = useAuth();
  const [subscriptions,setSubscriptions]=useState([]);
  const [stats,setStats]=useState(null);
  const [loading,setLoading]=useState(true);
  const [modalOpen,setModalOpen]=useState(false);
  const [editData,setEditData]=useState(null);
  const [activeFilter,setActiveFilter]=useState('all');
  const [searchQuery,setSearchQuery]=useState('');
  const [sortKey,setSortKey]=useState(null);
  const [sortDir,setSortDir]=useState('asc');

  const fetchData=useCallback(async(isInit=false)=>{
    try{
      const[sr,st]=await Promise.all([api.get('/subscriptions'),api.get('/subscriptions/stats')]);
      const subs=sr.data.data;
      setSubscriptions(subs);setStats(st.data.data);
      if(isInit)fireUrgentToasts(subs);
    }catch{toast.error('Failed to load subscriptions.');}
    finally{setLoading(false);}
  },[]);

  useEffect(()=>{fetchData(true);},[fetchData]);

  const toggleSort=key=>{
    if(sortKey===key)setSortDir(d=>d==='asc'?'desc':'asc');
    else{setSortKey(key);setSortDir('asc');}
  };

  const filtered=subscriptions
    .filter(s=>(activeFilter==='all'||s.category===activeFilter)&&s.serviceName.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a,b)=>{
      if(!sortKey)return 0;
      let av=sortKey==='cost'?(a.billingCycle==='yearly'?a.cost/12:a.cost):new Date(a.renewalDate);
      let bv=sortKey==='cost'?(b.billingCycle==='yearly'?b.cost/12:b.cost):new Date(b.renewalDate);
      return sortDir==='asc'?av>bv?1:-1:av<bv?1:-1;
    });

  const openAddModal=()=>{setEditData(null);setModalOpen(true);};
  const openEditModal=s=>{setEditData(s);setModalOpen(true);};
  const handleDelete=id=>{setSubscriptions(p=>p.filter(s=>s._id!==id));fetchData();};

  const activeCount=subscriptions.filter(s=>s.status==='active').length;
  const fmt=n=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(n);
  const initials=user?.name?.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)||'?';

  const SortIcon=({k})=>{
    if(sortKey!==k)return<ArrowUpDown size={12} style={{opacity:.4}}/>;
    return sortDir==='asc'?<ChevronUp size={12}/>:<ChevronDown size={12}/>;
  };

  return(
    <div className="app-shell">
      <Sidebar onAddClick={openAddModal}/>
      <div className="main-area">
        {/* Top bar */}
        <div className="top-bar">
          <div className="tb-search">
            <Search size={14} style={{color:'#9CA3AF',flexShrink:0}}/>
            <input placeholder="Search subscriptions…" value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}/>
          </div>
          <div className="tb-spacer"/>
          <div className="tb-icon-btn">
            <Bell size={16}/>
            <div className="tb-notif-dot"/>
          </div>
          <div className="tb-user-chip">
            <div className="tb-chip-avatar">{initials}</div>
            <span className="tb-chip-name">{user?.name?.split(' ')[0]}</span>
          </div>
        </div>

        <div className="page-content">
          <RenewalAlertBanner subscriptions={subscriptions}/>

          {/* Page header */}
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">
            Your subscription overview ·{' '}
            <span style={{color:'#10B981',fontWeight:600}}>
              <TrendingUp size={12} style={{display:'inline',marginRight:'3px'}}/>
              {fmt(stats?.totalMonthlySpend??0)}/month
            </span>
          </p>

          {/* KPI Cards */}
          <div className="kpi-grid">
            <KPICard icon={<CreditCard size={20}/>} iconBg="rgba(99,102,241,.1)" iconColor="#6366F1"
              label="Monthly Spend" value={loading?'…':fmt(stats?.totalMonthlySpend??0)}
              trend={`${fmt(stats?.totalYearlySpend??0)}/yr`} trendType="neutral"/>
            <KPICard icon={<Package size={20}/>} iconBg="rgba(16,185,129,.1)" iconColor="#10B981"
              label="Active Subscriptions" value={loading?'…':activeCount}
              trend={`${subscriptions.length} total tracked`} trendType="up"/>
            <KPICard icon={<RefreshCw size={20}/>} iconBg="rgba(245,158,11,.1)" iconColor="#F59E0B"
              label="Renewals in 7 Days" value={loading?'…':(stats?.upcomingRenewals?.length??0)}
              trend={stats?.upcomingRenewals?.length?`Next: ${stats.upcomingRenewals[0]?.serviceName}`:'None upcoming'} trendType="neutral"/>
            <KPICard icon={<AlertTriangle size={20}/>} iconBg="rgba(239,68,68,.1)" iconColor="#EF4444"
              label="Rarely Used" value={loading?'…':(stats?.rarelyUsedSubs?.length??0)}
              trend="Consider cancelling" trendType={stats?.rarelyUsedSubs?.length?'down':'neutral'}/>
          </div>

          {/* Quick stats row */}
          <div className="dash-grid" style={{marginBottom:'28px'}}>
            {/* Upcoming renewals */}
            <div className="card">
              <div className="card-hdr">
                <span className="card-title">Upcoming Renewals</span>
                <span className="card-meta">{stats?.upcomingRenewals?.length??0} in next 7 days</span>
              </div>
              {loading?<LoadingRows/>:
               !stats?.upcomingRenewals?.length?
               <p style={{padding:'20px',color:'#9CA3AF',fontSize:'.82rem',textAlign:'center'}}>🎉 No renewals in the next 7 days</p>:
               stats.upcomingRenewals.slice(0,5).map(s=>{
                 const rd=new Date(s.renewalDate);
                 const dL=Math.ceil((rd-new Date())/86400000);
                 return(
                   <div key={s._id} className="card-row">
                     <div className="row-icon" style={{background:CAT_COLOR[s.category]||'#F3E8FF'}}>{CAT_ICON[s.category]||'📦'}</div>
                     <div style={{flex:1,minWidth:0}}>
                       <div style={{fontWeight:600,fontSize:'.85rem',color:'#111827',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.serviceName}</div>
                       <div style={{fontSize:'.71rem',color:'#9CA3AF',textTransform:'capitalize'}}>{s.category}</div>
                     </div>
                     <div style={{textAlign:'right',marginRight:'10px'}}>
                       <div style={{fontWeight:700,fontSize:'.85rem',color:'#111827'}}>{fmt(s.billingCycle==='yearly'?s.cost/12:s.cost)}/mo</div>
                       <div style={{fontSize:'.7rem',color:'#9CA3AF'}}>in {dL}d</div>
                     </div>
                     <span className={`badge ${dL<=2?'badge-red':dL<=5?'badge-amber':'badge-green'}`}>
                       {dL<=2?'Urgent':dL<=5?'Soon':'OK'}
                     </span>
                   </div>
                 );
               })
              }
            </div>

            {/* Category breakdown */}
            <div className="card">
              <div className="card-hdr">
                <span className="card-title">Spend by Category</span>
                <span className="card-meta">Active subs only</span>
              </div>
              {loading?<LoadingRows/>:
               Object.entries(
                 subscriptions.filter(s=>s.status==='active').reduce((acc,s)=>{
                   const m=s.billingCycle==='yearly'?s.cost/12:s.cost;
                   acc[s.category]=(acc[s.category]||0)+m;return acc;
                 },{})
               ).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([cat,total])=>{
                 const pct=Math.min(100,(total/Math.max(1,(stats?.totalMonthlySpend??1)))*100);
                 return(
                   <div key={cat} className="card-row">
                     <div className="row-icon" style={{background:CAT_COLOR[cat]||'#F3E8FF'}}>{CAT_ICON[cat]||'📦'}</div>
                     <div style={{flex:1,minWidth:0}}>
                       <div style={{fontWeight:600,fontSize:'.85rem',color:'#111827',textTransform:'capitalize',marginBottom:'6px'}}>{cat}</div>
                       <div style={{height:'5px',borderRadius:'99px',background:'#F3F4F6',overflow:'hidden'}}>
                         <div style={{height:'100%',borderRadius:'99px',background:'#6366F1',width:`${pct}%`,transition:'width .5s'}}/>
                       </div>
                     </div>
                     <div style={{textAlign:'right',marginLeft:'12px'}}>
                       <div style={{fontWeight:700,fontSize:'.85rem',color:'#111827'}}>{fmt(total)}</div>
                       <div style={{fontSize:'.7rem',color:'#9CA3AF'}}>/month</div>
                     </div>
                   </div>
                 );
               })
              }
            </div>
          </div>

          {/* Subscriptions table */}
          <div className="section-hdr">
            <div>
              <h2 className="section-title">
                All Subscriptions
                <span style={{marginLeft:'8px',fontSize:'.78rem',fontWeight:500,color:'#9CA3AF'}}>({filtered.length})</span>
              </h2>
            </div>
            <button id="add-sub-btn" className="btn-primary" onClick={openAddModal}>
              <Plus size={15}/> Add New
            </button>
          </div>

          <div className="filter-row">
            {FILTERS.map(f=>(
              <button key={f} className={`filter-pill${activeFilter===f?' active':''}`} onClick={()=>setActiveFilter(f)}>{f}</button>
            ))}
            <button className="sort-btn" onClick={()=>toggleSort('cost')}>
              <ArrowUpDown size={13}/> Price <SortIcon k="cost"/>
            </button>
            <button className="sort-btn" onClick={()=>toggleSort('date')}>
              <ArrowUpDown size={13}/> Renewal <SortIcon k="date"/>
            </button>
          </div>

          {loading?<TableSkeleton/>:
           filtered.length===0?<EmptyState hasSubscriptions={subscriptions.length>0} onAdd={openAddModal} searchQuery={searchQuery} activeFilter={activeFilter}/>:
           <div className="sub-table-wrap">
             <table className="sub-table">
               <thead>
                 <tr>
                   <th>Service</th>
                   <th>Category</th>
                   <th>Billing</th>
                   <th style={{cursor:'pointer'}} onClick={()=>toggleSort('cost')}>Cost <SortIcon k="cost"/></th>
                   <th style={{cursor:'pointer'}} onClick={()=>toggleSort('date')}>Next Renewal <SortIcon k="date"/></th>
                   <th>Status</th>
                   <th style={{textAlign:'right'}}>Actions</th>
                 </tr>
               </thead>
               <tbody>
                 {filtered.map(sub=><SubRow key={sub._id} sub={sub} onEdit={openEditModal} onDelete={handleDelete} fmt={fmt}/>)}
               </tbody>
             </table>
           </div>
          }
        </div>
      </div>
      <AddSubscriptionModal isOpen={modalOpen} onClose={()=>setModalOpen(false)} onSuccess={fetchData} editData={editData}/>
    </div>
  );
};

/* ── Sub-components ── */
const KPICard=({icon,iconBg,iconColor,label,value,trend,trendType})=>(
  <div className="kpi-card">
    <div className="kpi-icon" style={{background:iconBg,color:iconColor}}>{icon}</div>
    <div className="kpi-label">{label}</div>
    <div className="kpi-value">{value}</div>
    <div className={`kpi-trend ${trendType}`}>
      {trendType==='up'&&<TrendingUp size={12}/>}
      {trendType==='down'&&<TrendingDown size={12}/>}
      {trend}
    </div>
  </div>
);

const CAT_BADGE={streaming:'badge-red',software:'badge-blue',fitness:'badge-green',cloud:'badge-indigo',learning:'badge-amber',other:'badge-purple'};

const SubRow=({sub,onEdit,onDelete,fmt})=>{
  const today=new Date();today.setHours(0,0,0,0);
  const rd=new Date(sub.renewalDate);rd.setHours(0,0,0,0);
  const dLeft=Math.round((rd-today)/86400000);
  const isOverdue=dLeft<0;
  const isSoon=dLeft>=0&&dLeft<=7;
  const isInactive=sub.status==='inactive';
  const monthly=sub.billingCycle==='yearly'?sub.cost/12:sub.cost;

  const handleDelete=async()=>{
    if(!window.confirm(`Delete "${sub.serviceName}"?`))return;
    try{
      await api.delete(`/subscriptions/${sub._id}`);
      toast.success(`"${sub.serviceName}" removed.`);
      onDelete(sub._id);
    }catch{ toast.error('Failed to delete.'); }
  };


  return(
    <tr className="sub-row" style={{opacity:isInactive?.55:1}}>
      <td>
        <div className="sub-service">
          <div className="sub-svc-icon" style={{background:CAT_COLOR[sub.category]||'#F3E8FF'}}>{CAT_ICON[sub.category]||'📦'}</div>
          <div>
            <div className="sub-svc-name">{sub.serviceName}</div>
            <div className="sub-svc-sub" style={{textTransform:'capitalize'}}>{sub.usageFrequency} usage</div>
          </div>
        </div>
      </td>
      <td><span className={`badge ${CAT_BADGE[sub.category]||'badge-gray'}`} style={{textTransform:'capitalize'}}>{sub.category}</span></td>
      <td><span className={`badge ${sub.billingCycle==='yearly'?'badge-green':'badge-indigo'}`} style={{textTransform:'capitalize'}}>{sub.billingCycle}</span></td>
      <td>
        <div style={{fontWeight:700,fontSize:'.88rem',color:'#111827'}}>{fmt(monthly)}<span style={{fontWeight:400,fontSize:'.72rem',color:'#9CA3AF'}}>/mo</span></div>
        {sub.billingCycle==='yearly'&&<div style={{fontSize:'.7rem',color:'#9CA3AF'}}>{fmt(sub.cost)}/yr</div>}
      </td>
      <td>
        <div style={{fontSize:'.83rem',color:isOverdue?'#B91C1C':'#374151',fontWeight:isOverdue||isSoon?600:400}}>
          {rd.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}
        </div>
        {isOverdue&&<div style={{fontSize:'.7rem',color:'#B91C1C'}}>Overdue by {Math.abs(dLeft)}d</div>}
        {!isOverdue&&isSoon&&<div style={{fontSize:'.7rem',color:'#A16207'}}>In {dLeft}d</div>}
      </td>
      <td>
        {isInactive?<span className="badge badge-gray">Inactive</span>:
         isOverdue?<span className="badge badge-red">Overdue</span>:
         isSoon?<span className="badge badge-amber">Upcoming</span>:
         <span className="badge badge-green">Active</span>}
      </td>
      <td>
        <div style={{display:'flex',gap:'6px',justifyContent:'flex-end'}}>
          <button onClick={()=>onEdit(sub)} className="act-btn act-btn-edit" title="Edit"><Edit2 size={14}/></button>
          <button onClick={handleDelete} className="act-btn act-btn-del" title="Delete"><Trash2 size={14}/></button>
        </div>
      </td>
    </tr>
  );
};

const LoadingRows=()=>(
  <div>{[1,2,3].map(i=>(
    <div key={i} style={{height:'58px',margin:'1px',background:'linear-gradient(90deg,#FAFAFA 25%,#F3F2FF 50%,#FAFAFA 75%)',backgroundSize:'200% 100%',animation:'pulse 1.5s ease-in-out infinite'}}/>
  ))}</div>
);

const TableSkeleton=()=>(
  <div className="sub-table-wrap">
    {[1,2,3,4].map(i=>(
      <div key={i} style={{height:'60px',margin:'1px',background:'linear-gradient(90deg,#FAFAFA 25%,#F3F2FF 50%,#FAFAFA 75%)',backgroundSize:'200% 100%',animation:'pulse 1.5s ease-in-out infinite'}}/>
    ))}
  </div>
);

const EmptyState=({hasSubscriptions,onAdd,searchQuery,activeFilter})=>(
  <div style={{background:'#fff',border:'2px dashed #E5E3F5',borderRadius:'20px',padding:'52px 24px',textAlign:'center'}}>
    <div style={{fontSize:'2.5rem',marginBottom:'12px'}}>{searchQuery||activeFilter!=='all'?'🔍':'📭'}</div>
    <h4 style={{fontSize:'1rem',fontWeight:700,color:'#111827',marginBottom:'6px'}}>
      {searchQuery?`No results for "${searchQuery}"`:activeFilter!=='all'?`No ${activeFilter} subscriptions`:'No subscriptions yet'}
    </h4>
    <p style={{fontSize:'.84rem',color:'#9CA3AF',marginBottom:'20px'}}>
      {searchQuery||activeFilter!=='all'?'Try a different search or filter.':'Add Netflix, Spotify, Adobe — take control of your spending.'}
    </p>
    {!searchQuery&&activeFilter==='all'&&(
      <button id="empty-add-btn" className="btn-primary" onClick={onAdd}><Plus size={15}/> Add First Subscription</button>
    )}
  </div>
);

export default DashboardPage;

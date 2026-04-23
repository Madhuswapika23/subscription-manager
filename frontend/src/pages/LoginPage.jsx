import { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Eye, EyeOff } from 'lucide-react';

const schema = Yup.object({
  email:    Yup.string().email('Enter a valid email').required('Email is required'),
  password: Yup.string().required('Password is required'),
});

const inp = (error) => ({
  width: '100%', boxSizing: 'border-box',
  background: error ? '#FEF2F2' : '#F9FAFB',
  border: `1.5px solid ${error ? '#FCA5A5' : '#E5E7EB'}`,
  borderRadius: 12, padding: '11px 14px',
  fontSize: 14, fontWeight: 500, color: '#111827',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  outline: 'none', transition: 'border-color .15s, box-shadow .15s, background .15s',
});

const FEATURES = [
  { icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', text: 'Track all subscriptions in one place' },
  { icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9', text: 'Get renewal alerts before you\'re charged' },
  { icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', text: 'Analyse spending across categories' },
  { icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', text: 'Spot rarely-used subs and save money' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [show, setShow] = useState(false);
  const from = location.state?.from?.pathname || '/dashboard';

  const formik = useFormik({
    initialValues: { email: '', password: '' },
    validationSchema: schema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const { data } = await api.post('/auth/login', values);
        login(data.token, data.user);
        toast.success(`Welcome back, ${data.user.name}!`);
        navigate(from, { replace: true });
      } catch (err) {
        toast.error(err.response?.data?.message || 'Login failed. Please try again.');
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* ── Left: Purple branding panel ── */}
      <div style={{
        width: '42%', minWidth: 380, background: 'linear-gradient(160deg,#7B5CF6 0%,#5E3BCC 100%)',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '48px 52px', position: 'relative', overflow: 'hidden',
      }}>
        {/* Subtle background circles */}
        <div style={{ position:'absolute', top:-80, right:-80, width:320, height:320, borderRadius:'50%', background:'rgba(255,255,255,0.05)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:-60, left:-60, width:240, height:240, borderRadius:'50%', background:'rgba(255,255,255,0.05)', pointerEvents:'none' }} />

        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:40, height:40, background:'rgba(255,255,255,0.15)', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid rgba(255,255,255,0.2)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{ fontSize:15, fontWeight:800, color:'#fff', letterSpacing:'-0.02em' }}>SubTrack</span>
        </div>

        {/* Main copy */}
        <div>
          <h2 style={{ fontSize:32, fontWeight:800, color:'#fff', lineHeight:1.2, margin:'0 0 16px 0', letterSpacing:'-0.02em' }}>
            Manage every<br />subscription in<br />one place.
          </h2>
          <p style={{ fontSize:14, color:'rgba(255,255,255,0.7)', fontWeight:500, lineHeight:1.6, marginBottom:36 }}>
            Stop losing money to forgotten subscriptions. Know exactly what you pay, when you pay, and what you actually use.
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:28, height:28, borderRadius:8, background:'rgba(255,255,255,0.12)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, border:'1px solid rgba(255,255,255,0.15)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={f.icon}/>
                  </svg>
                </div>
                <span style={{ fontSize:13, color:'rgba(255,255,255,0.8)', fontWeight:500 }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ fontSize:12, color:'rgba(255,255,255,0.4)', fontWeight:500 }}>© 2025 SubTrack · Built for India</p>
      </div>

      {/* ── Right: Form panel ── */}
      <div style={{ flex:1, background:'#F4F5FB', display:'flex', alignItems:'center', justifyContent:'center', padding:'40px 32px' }}>
        <div style={{ width:'100%', maxWidth:420 }}>
          <div style={{ marginBottom:32 }}>
            <h1 style={{ fontSize:26, fontWeight:800, color:'#111827', margin:'0 0 6px 0', letterSpacing:'-0.02em' }}>Welcome back</h1>
            <p style={{ fontSize:14, color:'#9CA3AF', fontWeight:500, margin:0 }}>Sign in to your SubTrack account.</p>
          </div>

          <div style={{ background:'#fff', borderRadius:20, padding:'28px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)', border:'1px solid #EBEBF0' }}>
            <form onSubmit={formik.handleSubmit} noValidate>

              {/* Email */}
              <div style={{ marginBottom:16 }}>
                <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#6B7280', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>Email Address</label>
                <input
                  id="login-email" type="email" placeholder="you@example.com"
                  style={inp(formik.touched.email && formik.errors.email)}
                  onFocus={e => { e.target.style.borderColor='#7B5CF6'; e.target.style.boxShadow='0 0 0 3px rgba(123,92,246,0.1)'; e.target.style.background='#fff'; }}
                  onBlur={e => { e.target.style.borderColor=formik.errors.email?'#FCA5A5':'#E5E7EB'; e.target.style.boxShadow='none'; e.target.style.background=formik.errors.email?'#FEF2F2':'#F9FAFB'; }}
                  {...formik.getFieldProps('email')}
                />
                {formik.touched.email && formik.errors.email && (
                  <p style={{ fontSize:11, color:'#EF4444', fontWeight:600, marginTop:5 }}>{formik.errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div style={{ marginBottom:22 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                  <label style={{ fontSize:11, fontWeight:700, color:'#6B7280', textTransform:'uppercase', letterSpacing:'0.06em' }}>Password</label>
                </div>
                <div style={{ position:'relative' }}>
                  <input
                    id="login-password" type={show ? 'text' : 'password'} placeholder="Your password"
                    style={{ ...inp(formik.touched.password && formik.errors.password), paddingRight:44 }}
                    onFocus={e => { e.target.style.borderColor='#7B5CF6'; e.target.style.boxShadow='0 0 0 3px rgba(123,92,246,0.1)'; e.target.style.background='#fff'; }}
                    onBlur={e => { e.target.style.borderColor=formik.errors.password?'#FCA5A5':'#E5E7EB'; e.target.style.boxShadow='none'; e.target.style.background=formik.errors.password?'#FEF2F2':'#F9FAFB'; }}
                    {...formik.getFieldProps('password')}
                  />
                  <button type="button" onClick={() => setShow(p => !p)} style={{ position:'absolute', right:13, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#9CA3AF', display:'flex', padding:2 }}>
                    {show ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {formik.touched.password && formik.errors.password && (
                  <p style={{ fontSize:11, color:'#EF4444', fontWeight:600, marginTop:5 }}>{formik.errors.password}</p>
                )}
              </div>

              {/* Submit */}
              <button type="submit" disabled={formik.isSubmitting} style={{
                width:'100%', padding:'13px', borderRadius:12, border:'none',
                background:'linear-gradient(135deg,#8B6BFF 0%,#7B5CF6 100%)',
                fontSize:14, fontWeight:700, color:'#fff', cursor: formik.isSubmitting ? 'not-allowed' : 'pointer',
                boxShadow:'0 4px 16px rgba(123,92,246,0.3)', opacity: formik.isSubmitting ? 0.75 : 1,
                transition:'opacity .15s, transform .1s',
              }}
                onMouseEnter={e => { if (!formik.isSubmitting) e.currentTarget.style.transform='translateY(-1px)'; }}
                onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}
              >
                {formik.isSubmitting ? 'Signing in…' : 'Sign In'}
              </button>
            </form>
          </div>

          <p style={{ textAlign:'center', marginTop:22, fontSize:13, color:'#9CA3AF', fontWeight:500 }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color:'#7B5CF6', fontWeight:700, textDecoration:'none' }}>
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Eye, EyeOff } from 'lucide-react';

const getStrength = pw => {
  if (!pw) return { score: 0, label: '', color: '' };
  let s = 0;
  if (pw.length >= 6)          s++;
  if (pw.length >= 10)         s++;
  if (/[A-Z]/.test(pw))       s++;
  if (/\d/.test(pw))          s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const map = [
    { label: 'Very Weak', color: '#EF4444' },
    { label: 'Weak',      color: '#F97316' },
    { label: 'Fair',      color: '#EAB308' },
    { label: 'Good',      color: '#22C55E' },
    { label: 'Strong',    color: '#10B981' },
  ];
  return { score: s, ...map[Math.min(s, 4)] };
};

const schema = Yup.object({
  name:     Yup.string().min(2, 'Min 2 characters').max(50).required('Name is required'),
  email:    Yup.string().email('Enter a valid email').required('Email is required'),
  password: Yup.string().min(6, 'Min 6 characters').matches(/\d/, 'Must contain a number').required('Password is required'),
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

const STEPS = [
  'Your name and email',
  'A secure password',
  'Done — start tracking',
];

export default function RegisterPage() {
  const { login }       = useAuth();
  const navigate        = useNavigate();
  const [show, setShow] = useState(false);

  const formik = useFormik({
    initialValues: { name: '', email: '', password: '' },
    validationSchema: schema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const { data } = await api.post('/auth/register', values);
        login(data.token, data.user);
        toast.success(`Welcome, ${data.user.name}! Your account is ready.`);
        navigate('/dashboard', { replace: true });
      } catch (err) {
        const msg = err.response?.data?.message || 'Registration failed. Please try again.';
        toast.error(msg);
        if (err.response?.data?.errors) {
          const fieldErrors = {};
          err.response.data.errors.forEach(({ field, message }) => { fieldErrors[field] = message; });
          formik.setErrors(fieldErrors);
        }
      } finally {
        setSubmitting(false);
      }
    },
  });

  const strength = getStrength(formik.values.password);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* ── Left: Purple branding panel ── */}
      <div style={{
        width: '42%', minWidth: 380, background: 'linear-gradient(160deg,#7B5CF6 0%,#5E3BCC 100%)',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '48px 52px', position: 'relative', overflow: 'hidden',
      }}>
        {/* Background circles */}
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
            Get started<br />in 3 simple<br />steps.
          </h2>
          <p style={{ fontSize:14, color:'rgba(255,255,255,0.7)', fontWeight:500, lineHeight:1.6, marginBottom:36 }}>
            Create your free account and start managing all your subscriptions in minutes.
          </p>

          {/* Steps */}
          <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
            {STEPS.map((step, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div style={{
                  width:28, height:28, borderRadius:'50%', flexShrink:0,
                  background: i === 0 ? '#fff' : 'rgba(255,255,255,0.12)',
                  border: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.2)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:12, fontWeight:800,
                  color: i === 0 ? '#7B5CF6' : 'rgba(255,255,255,0.7)',
                }}>
                  {i + 1}
                </div>
                <div style={{ height:1, width: i < 2 ? 0 : 0 }} />
                <span style={{ fontSize:13, color: i === 0 ? '#fff' : 'rgba(255,255,255,0.65)', fontWeight: i === 0 ? 700 : 500 }}>{step}</span>
              </div>
            ))}
          </div>

          {/* Small trust bar */}
          <div style={{ marginTop:40, paddingTop:24, borderTop:'1px solid rgba(255,255,255,0.1)', display:'flex', gap:20 }}>
            {[['Free', 'forever'], ['No', 'credit card'], ['INR', 'native']].map(([a,b]) => (
              <div key={a}>
                <div style={{ fontSize:14, fontWeight:800, color:'#fff' }}>{a}</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)', fontWeight:500 }}>{b}</div>
              </div>
            ))}
          </div>
        </div>

        <p style={{ fontSize:12, color:'rgba(255,255,255,0.4)', fontWeight:500 }}>© 2025 SubTrack · Built for India</p>
      </div>

      {/* ── Right: Form panel ── */}
      <div style={{ flex:1, background:'#F4F5FB', display:'flex', alignItems:'center', justifyContent:'center', padding:'40px 32px' }}>
        <div style={{ width:'100%', maxWidth:420 }}>
          <div style={{ marginBottom:28 }}>
            <h1 style={{ fontSize:26, fontWeight:800, color:'#111827', margin:'0 0 6px 0', letterSpacing:'-0.02em' }}>Create your account</h1>
            <p style={{ fontSize:14, color:'#9CA3AF', fontWeight:500, margin:0 }}>Start managing subscriptions smarter.</p>
          </div>

          <div style={{ background:'#fff', borderRadius:20, padding:'28px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)', border:'1px solid #EBEBF0' }}>
            <form onSubmit={formik.handleSubmit} noValidate>

              {/* Name */}
              <div style={{ marginBottom:16 }}>
                <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#6B7280', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>Full Name</label>
                <input
                  id="reg-name" type="text" placeholder="Your name"
                  style={inp(formik.touched.name && formik.errors.name)}
                  onFocus={e => { e.target.style.borderColor='#7B5CF6'; e.target.style.boxShadow='0 0 0 3px rgba(123,92,246,0.1)'; e.target.style.background='#fff'; }}
                  onBlur={e => { e.target.style.borderColor=formik.errors.name?'#FCA5A5':'#E5E7EB'; e.target.style.boxShadow='none'; e.target.style.background=formik.errors.name?'#FEF2F2':'#F9FAFB'; }}
                  {...formik.getFieldProps('name')}
                />
                {formik.touched.name && formik.errors.name && (
                  <p style={{ fontSize:11, color:'#EF4444', fontWeight:600, marginTop:5 }}>{formik.errors.name}</p>
                )}
              </div>

              {/* Email */}
              <div style={{ marginBottom:16 }}>
                <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#6B7280', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>Email Address</label>
                <input
                  id="reg-email" type="email" placeholder="you@example.com"
                  style={inp(formik.touched.email && formik.errors.email)}
                  onFocus={e => { e.target.style.borderColor='#7B5CF6'; e.target.style.boxShadow='0 0 0 3px rgba(123,92,246,0.1)'; e.target.style.background='#fff'; }}
                  onBlur={e => { e.target.style.borderColor=formik.errors.email?'#FCA5A5':'#E5E7EB'; e.target.style.boxShadow='none'; e.target.style.background=formik.errors.email?'#FEF2F2':'#F9FAFB'; }}
                  {...formik.getFieldProps('email')}
                />
                {formik.touched.email && formik.errors.email && (
                  <p style={{ fontSize:11, color:'#EF4444', fontWeight:600, marginTop:5 }}>{formik.errors.email}</p>
                )}
              </div>

              {/* Password + strength */}
              <div style={{ marginBottom:22 }}>
                <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#6B7280', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>Password</label>
                <div style={{ position:'relative' }}>
                  <input
                    id="reg-password" type={show ? 'text' : 'password'} placeholder="Min 6 chars, include a number"
                    style={{ ...inp(formik.touched.password && formik.errors.password), paddingRight:44 }}
                    onFocus={e => { e.target.style.borderColor='#7B5CF6'; e.target.style.boxShadow='0 0 0 3px rgba(123,92,246,0.1)'; e.target.style.background='#fff'; }}
                    onBlur={e => { e.target.style.borderColor=formik.errors.password?'#FCA5A5':'#E5E7EB'; e.target.style.boxShadow='none'; e.target.style.background=formik.errors.password?'#FEF2F2':'#F9FAFB'; }}
                    {...formik.getFieldProps('password')}
                  />
                  <button type="button" onClick={() => setShow(p => !p)} style={{ position:'absolute', right:13, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#9CA3AF', display:'flex', padding:2 }}>
                    {show ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>

                {/* Password strength bar */}
                {formik.values.password && (
                  <div style={{ marginTop:8 }}>
                    <div style={{ display:'flex', gap:3, marginBottom:5 }}>
                      {[1,2,3,4,5].map(i => (
                        <div key={i} style={{ flex:1, height:3, borderRadius:99, background: i <= strength.score ? strength.color : '#E5E7EB', transition:'background .2s' }} />
                      ))}
                    </div>
                    <span style={{ fontSize:11, fontWeight:700, color: strength.color }}>{strength.label}</span>
                  </div>
                )}
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
                {formik.isSubmitting ? 'Creating account…' : 'Create Account'}
              </button>
            </form>
          </div>

          <p style={{ textAlign:'center', marginTop:22, fontSize:13, color:'#9CA3AF', fontWeight:500 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color:'#7B5CF6', fontWeight:700, textDecoration:'none' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

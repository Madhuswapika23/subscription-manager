import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Eye, EyeOff } from 'lucide-react';

const schema = Yup.object({
  email:    Yup.string().email('Enter a valid email').required('Email is required'),
  password: Yup.string().required('Password is required'),
});

const LoginPage = () => {
  const { login }    = useAuth();
  const navigate     = useNavigate();
  const location     = useLocation();
  const [show, setShow] = useState(false);
  const from = location.state?.from?.pathname || '/dashboard';

  const formik = useFormik({
    initialValues: { email: '', password: '' },
    validationSchema: schema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const { data } = await api.post('/auth/login', values);
        login(data.token, data.user);
        toast.success(`Welcome back, ${data.user.name}! 👋`);
        navigate(from, { replace: true });
      } catch (err) {
        toast.error(err.response?.data?.message || 'Login failed. Please try again.');
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <div className="brand-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
              stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to manage your subscriptions.</p>

        <form onSubmit={formik.handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="login-email" className="form-label">Email Address</label>
            <input id="login-email" type="email" placeholder="you@example.com"
              className={`form-input${formik.touched.email && formik.errors.email ? ' error' : ''}`}
              {...formik.getFieldProps('email')} />
            {formik.touched.email && formik.errors.email && (
              <span className="error-msg">⚠ {formik.errors.email}</span>
            )}
          </div>

          <div className="form-group">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'5px' }}>
              <label htmlFor="login-password" className="form-label" style={{marginBottom:0}}>Password</label>
              <span style={{ fontSize:'.75rem', color:'#6366F1', cursor:'pointer', fontWeight:500 }}>Forgot password?</span>
            </div>
            <div style={{ position:'relative' }}>
              <input id="login-password" type={show ? 'text' : 'password'} placeholder="Your password"
                className={`form-input${formik.touched.password && formik.errors.password ? ' error' : ''}`}
                style={{ paddingRight:'3rem' }}
                {...formik.getFieldProps('password')} />
              <button type="button" onClick={() => setShow(p => !p)}
                style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)',
                  background:'none', border:'none', cursor:'pointer', color:'#9CA3AF', padding:0,
                  display:'flex', alignItems:'center' }}>
                {show ? <EyeOff size={17}/> : <Eye size={17}/>}
              </button>
            </div>
            {formik.touched.password && formik.errors.password && (
              <span className="error-msg">⚠ {formik.errors.password}</span>
            )}
          </div>

          <button id="login-submit" type="submit" className="btn-primary"
            disabled={formik.isSubmitting}
            style={{ width:'100%', padding:'12px', marginTop:'6px', fontSize:'.93rem', borderRadius:'12px' }}>
            {formik.isSubmitting
              ? <span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'8px'}}><span className="spinner"/>Signing in…</span>
              : 'Sign In'}
          </button>
        </form>

        <div className="divider"><span className="divider-text">Don't have an account?</span></div>
        <p style={{ textAlign:'center', fontSize:'.88rem', color:'#6B7280' }}>
          <Link to="/register" className="link-accent">Create a free account →</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;

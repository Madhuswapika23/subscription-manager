import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Eye, EyeOff } from 'lucide-react';

const getStrength = pw => {
  if (!pw) return { score:0, label:'', color:'' };
  let s = 0;
  if (pw.length >= 6)  s++;
  if (pw.length >= 10) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw))    s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const map = [
    {label:'Very Weak',color:'#EF4444'},
    {label:'Weak',     color:'#F97316'},
    {label:'Fair',     color:'#EAB308'},
    {label:'Good',     color:'#22C55E'},
    {label:'Strong',   color:'#10B981'},
  ];
  return { score:s, ...map[Math.min(s,4)] };
};

const schema = Yup.object({
  name:     Yup.string().min(2,'Min 2 characters').max(50).required('Name is required'),
  email:    Yup.string().email('Enter a valid email').required('Email is required'),
  password: Yup.string().min(6,'Min 6 characters').matches(/\d/,'Must contain a number').required('Password is required'),
});

const RegisterPage = () => {
  const { login }   = useAuth();
  const navigate    = useNavigate();
  const [show, setShow] = useState(false);

  const formik = useFormik({
    initialValues: { name:'', email:'', password:'' },
    validationSchema: schema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const { data } = await api.post('/auth/register', values);
        login(data.token, data.user);
        toast.success(`Welcome aboard, ${data.user.name}! 🎉`);
        navigate('/dashboard', { replace:true });
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
    <div className="auth-bg">
      <div className="auth-card">
        <div className="brand-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
              stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Start managing subscriptions smarter — free forever.</p>

        <form onSubmit={formik.handleSubmit} noValidate>
          {/* Name */}
          <div className="form-group">
            <label htmlFor="reg-name" className="form-label">Full Name</label>
            <input id="reg-name" type="text" placeholder="John Doe"
              className={`form-input${formik.touched.name && formik.errors.name ? ' error' : ''}`}
              {...formik.getFieldProps('name')} />
            {formik.touched.name && formik.errors.name && (
              <span className="error-msg">⚠ {formik.errors.name}</span>
            )}
          </div>

          {/* Email */}
          <div className="form-group">
            <label htmlFor="reg-email" className="form-label">Email Address</label>
            <input id="reg-email" type="email" placeholder="john@example.com"
              className={`form-input${formik.touched.email && formik.errors.email ? ' error' : ''}`}
              {...formik.getFieldProps('email')} />
            {formik.touched.email && formik.errors.email && (
              <span className="error-msg">⚠ {formik.errors.email}</span>
            )}
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="reg-password" className="form-label">Password</label>
            <div style={{ position:'relative' }}>
              <input id="reg-password" type={show ? 'text' : 'password'} placeholder="Min 6 chars with a number"
                className={`form-input${formik.touched.password && formik.errors.password ? ' error' : ''}`}
                style={{ paddingRight:'3rem' }}
                {...formik.getFieldProps('password')} />
              <button type="button" onClick={() => setShow(p => !p)} aria-label="Toggle password visibility"
                style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)',
                  background:'none', border:'none', cursor:'pointer', color:'#9CA3AF', padding:0,
                  display:'flex', alignItems:'center' }}>
                {show ? <EyeOff size={17}/> : <Eye size={17}/>}
              </button>
            </div>

            {/* Strength bar */}
            {formik.values.password && (
              <>
                <div className="strength-bar" style={{marginTop:'6px'}}>
                  <div className="strength-fill" style={{ width:`${(strength.score/5)*100}%`, backgroundColor:strength.color }}/>
                </div>
                <span style={{ fontSize:'.72rem', color:strength.color, marginTop:'3px', display:'block' }}>{strength.label}</span>
              </>
            )}
            {formik.touched.password && formik.errors.password && (
              <span className="error-msg" style={{marginTop:'3px'}}>⚠ {formik.errors.password}</span>
            )}
          </div>

          <button id="register-submit" type="submit" className="btn-primary"
            disabled={formik.isSubmitting}
            style={{ width:'100%', padding:'12px', marginTop:'6px', fontSize:'.93rem', borderRadius:'12px' }}>
            {formik.isSubmitting
              ? <span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'8px'}}><span className="spinner"/>Creating account…</span>
              : 'Create Account'}
          </button>
        </form>

        <div className="divider"><span className="divider-text">Already have an account?</span></div>
        <p style={{ textAlign:'center', fontSize:'.88rem', color:'#6B7280' }}>
          <Link to="/login" className="link-accent">Sign in instead →</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;

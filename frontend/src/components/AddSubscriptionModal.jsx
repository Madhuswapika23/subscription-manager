import { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import api from '../services/api';
import { X } from 'lucide-react';

const CATEGORIES = ['streaming','software','fitness','cloud','learning','other'];
const CYCLES     = ['monthly','yearly'];
const USAGE      = ['daily','weekly','monthly','rarely'];
const CAT_ICONS  = { streaming:'📺', software:'💻', fitness:'🏋️', cloud:'☁️', learning:'📚', other:'📦' };

const schema = Yup.object({
  serviceName:    Yup.string().trim().min(1).max(100).required('Service name is required'),
  cost:           Yup.number().typeError('Must be a number').min(0).required('Cost is required'),
  billingCycle:   Yup.string().oneOf(CYCLES).required('Billing cycle is required'),
  renewalDate:    Yup.string().required('Renewal date is required'),
  category:       Yup.string().oneOf(CATEGORIES).required('Category is required'),
  status:         Yup.string().oneOf(['active','inactive']).required('Status is required'),
  usageFrequency: Yup.string().oneOf(USAGE).required('Usage frequency is required'),
});

const inp = {
  width: '100%', background: '#F8F7FF', border: '1.5px solid #E5E3F5',
  borderRadius: '12px', padding: '10px 14px', color: '#111827',
  fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none',
  boxSizing: 'border-box', transition: 'border-color .2s, box-shadow .2s',
};
const errInp  = { borderColor: '#EF4444', boxShadow: '0 0 0 3px rgba(239,68,68,.1)' };
const focusCss = { borderColor: '#6366F1', boxShadow: '0 0 0 3px rgba(99,102,241,.1)', background: '#fff' };

const AddSubscriptionModal = ({ isOpen, onClose, onSuccess, editData }) => {
  const isEditing = !!editData;

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      serviceName:    editData?.serviceName    || '',
      cost:           editData?.cost           ?? '',
      billingCycle:   editData?.billingCycle   || 'monthly',
      renewalDate:    editData?.renewalDate
        ? new Date(editData.renewalDate).toISOString().split('T')[0] : '',
      category:       editData?.category       || 'other',
      status:         editData?.status         || 'active',
      usageFrequency: editData?.usageFrequency || 'monthly',
    },
    validationSchema: schema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        if (isEditing) {
          await api.put(`/subscriptions/${editData._id}`, values);
          toast.success('Subscription updated ✅');
        } else {
          await api.post('/subscriptions', values);
          toast.success('Subscription added 🎉');
        }
        resetForm();
        onSuccess();
        onClose();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Something went wrong.');
      } finally {
        setSubmitting(false);
      }
    },
  });

  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const fi = field => ({ ...inp, ...(formik.touched[field] && formik.errors[field] ? errInp : {}) });

  const onFocus = e => Object.assign(e.target.style, focusCss);
  const onBlur  = (e, field) => {
    if (formik.touched[field] && formik.errors[field]) {
      Object.assign(e.target.style, errInp);
    } else {
      Object.assign(e.target.style, { borderColor:'#E5E3F5', boxShadow:'none', background:'#F8F7FF' });
    }
  };

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position:'fixed', inset:0, background:'rgba(17,24,39,.5)',
        backdropFilter:'blur(6px)', display:'flex', alignItems:'center',
        justifyContent:'center', zIndex:1000, padding:16,
      }}
    >
      <div style={{
        background:'#fff', border:'1px solid #E5E3F5', borderRadius:24,
        padding:28, width:'100%', maxWidth:520, maxHeight:'92vh',
        overflowY:'auto', boxShadow:'0 20px 60px rgba(99,102,241,.18)',
      }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:22 }}>
          <div>
            <h2 style={{ fontSize:'1.15rem', fontWeight:800, color:'#111827', margin:0 }}>
              {isEditing ? 'Edit Subscription' : 'Add Subscription'}
            </h2>
            <p style={{ fontSize:'.8rem', color:'#9CA3AF', marginTop:3 }}>
              {isEditing ? 'Update subscription details.' : 'Track a new recurring expense.'}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background:'#F3F4F6', border:'none', borderRadius:10, width:34, height:34, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#6B7280' }}
            onMouseEnter={e => { e.currentTarget.style.background='#E5E7EB'; e.currentTarget.style.color='#111827'; }}
            onMouseLeave={e => { e.currentTarget.style.background='#F3F4F6'; e.currentTarget.style.color='#6B7280'; }}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={formik.handleSubmit} noValidate>

          {/* Service Name */}
          <F label="Service / App Name" error={formik.touched.serviceName && formik.errors.serviceName}>
            <input
              id="sub-serviceName" type="text" placeholder="e.g. Netflix, Spotify, Adobe"
              style={fi('serviceName')}
              onFocus={onFocus} onBlur={e => onBlur(e,'serviceName')}
              {...formik.getFieldProps('serviceName')}
            />
          </F>

          {/* Cost + Billing */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <F label="Cost (₹)" error={formik.touched.cost && formik.errors.cost}>
              <div style={{ position:'relative' }}>
                <span style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', fontSize:14, color:'#6B7280', pointerEvents:'none' }}>₹</span>
                <input
                  id="sub-cost" type="number" min="0" step="1" placeholder="999"
                  style={{ ...fi('cost'), paddingLeft:28 }}
                  onFocus={onFocus} onBlur={e => onBlur(e,'cost')}
                  {...formik.getFieldProps('cost')}
                />
              </div>
            </F>
            <F label="Billing Cycle" error={formik.touched.billingCycle && formik.errors.billingCycle}>
              <select id="sub-billingCycle" style={fi('billingCycle')} onFocus={onFocus} onBlur={e => onBlur(e,'billingCycle')} {...formik.getFieldProps('billingCycle')}>
                {CYCLES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
              </select>
            </F>
          </div>

          {/* Renewal Date */}
          <F label="Next Renewal Date" error={formik.touched.renewalDate && formik.errors.renewalDate}>
            <input id="sub-renewalDate" type="date" style={fi('renewalDate')} onFocus={onFocus} onBlur={e => onBlur(e,'renewalDate')} {...formik.getFieldProps('renewalDate')} />
          </F>

          {/* Category + Status */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <F label="Category" error={formik.touched.category && formik.errors.category}>
              <select id="sub-category" style={fi('category')} onFocus={onFocus} onBlur={e => onBlur(e,'category')} {...formik.getFieldProps('category')}>
                {CATEGORIES.map(c => <option key={c} value={c}>{CAT_ICONS[c]} {c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
              </select>
            </F>
            <F label="Status" error={formik.touched.status && formik.errors.status}>
              <select id="sub-status" style={fi('status')} onFocus={onFocus} onBlur={e => onBlur(e,'status')} {...formik.getFieldProps('status')}>
                <option value="active">✅ Active</option>
                <option value="inactive">⏸ Inactive</option>
              </select>
            </F>
          </div>

          {/* Usage Frequency */}
          <F label="How often do you use it?" error={formik.touched.usageFrequency && formik.errors.usageFrequency}>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {USAGE.map(f => {
                const sel = formik.values.usageFrequency === f;
                return (
                  <button key={f} type="button"
                    onClick={() => formik.setFieldValue('usageFrequency', f)}
                    style={{
                      padding:'7px 16px', borderRadius:99,
                      border: sel ? '1.5px solid #6366F1' : '1.5px solid #E5E3F5',
                      background: sel ? '#EEF2FF' : '#F8F7FF',
                      color: sel ? '#4F46E5' : '#6B7280',
                      fontSize:'.82rem', fontWeight: sel ? 600 : 500, cursor:'pointer',
                    }}
                  >
                    {f.charAt(0).toUpperCase()+f.slice(1)}
                  </button>
                );
              })}
            </div>
          </F>

          {/* Actions */}
          <div style={{ display:'flex', gap:10, marginTop:20 }}>
            <button type="button" onClick={onClose}
              style={{ flex:1, padding:11, background:'#F9FAFB', border:'1.5px solid #E5E7EB', borderRadius:12, color:'#6B7280', fontSize:'.9rem', fontWeight:600, cursor:'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.background='#F3F4F6'; e.currentTarget.style.color='#111827'; }}
              onMouseLeave={e => { e.currentTarget.style.background='#F9FAFB'; e.currentTarget.style.color='#6B7280'; }}
            >Cancel</button>
            <button id="modal-submit-btn" type="submit" disabled={formik.isSubmitting}
              style={{
                flex:2, padding:11, fontSize:'.9rem', fontWeight:700, borderRadius:12, border:'none', cursor:'pointer',
                background:'linear-gradient(135deg,#8B6BFF 0%,#7B5CF6 100%)', color:'#fff',
                boxShadow:'0 4px 14px rgba(123,92,246,0.35)', opacity: formik.isSubmitting ? 0.7 : 1,
              }}
            >
              {formik.isSubmitting ? (isEditing ? 'Saving…' : 'Adding…') : (isEditing ? 'Save Changes' : '+ Add Subscription')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const F = ({ label, error, children }) => (
  <div style={{ marginBottom:14 }}>
    <label style={{ display:'block', fontSize:'.72rem', fontWeight:700, color:'#6B7280', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6 }}>
      {label}
    </label>
    {children}
    {error && <span style={{ fontSize:'.73rem', color:'#EF4444', display:'flex', alignItems:'center', gap:3, marginTop:4 }}>⚠ {error}</span>}
  </div>
);

export default AddSubscriptionModal;

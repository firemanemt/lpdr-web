import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { FiUser, FiMail, FiLock, FiPhone, FiCheck, FiShield } from 'react-icons/fi';

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const defaultRole = searchParams.get('role') === 'drone_pilot' ? 'drone_pilot' : 'pet_owner';
  
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: defaultRole,
    agreeToTerms: false,
    // Pilot-specific fields
    faaCertNumber: '',
    insuranceProvider: '',
    insurancePolicyNumber: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { register } = useAuth();
  const navigate = useNavigate();

  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const validate = () => {
    const errs = {};
    if (!form.firstName.trim()) errs.firstName = 'First name is required';
    if (!form.lastName.trim()) errs.lastName = 'Last name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    if (!form.password || form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (!form.agreeToTerms) errs.agreeToTerms = 'You must agree to the Terms of Service';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      const user = await register({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role: form.role,
        agreeToTerms: form.agreeToTerms,
        faaCertNumber: form.role === 'drone_pilot' ? form.faaCertNumber : undefined,
        insuranceProvider: form.role === 'drone_pilot' ? form.insuranceProvider : undefined,
        insurancePolicyNumber: form.role === 'drone_pilot' ? form.insurancePolicyNumber : undefined,
      });
      
      toast.success(`Welcome, ${user.firstName}! Please check your email to verify your account.`);
      
      if (user.role === 'pet_owner') navigate('/owner/dashboard');
      else if (user.role === 'drone_pilot') navigate('/pilot/dashboard');
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 120px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem 1rem' }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <img src="/lpdr-logo.png" alt="LPDR" style={{ height: '56px', margin: '0 auto 1rem', display: 'block', filter: 'drop-shadow(0 0 16px rgba(4,107,210,0.4))' }} />
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>ENROLLMENT</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Join the LPDR network</p>
        </div>

        {/* Role Toggle */}
        <div style={{ display: 'flex', marginBottom: '1rem', border: '1px solid var(--border-default)', borderRadius: '8px', overflow: 'hidden' }}>
          <button
            style={{
              flex: 1, padding: '0.65rem',
              background: form.role === 'pet_owner' ? 'var(--primary-bg)' : 'var(--bg-card)',
              color: form.role === 'pet_owner' ? 'var(--primary)' : 'var(--text-muted)',
              border: 'none', borderRight: '1px solid var(--border-default)',
              fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'var(--font-body)',
              textTransform: 'uppercase', letterSpacing: '0.04em',
            }}
            onClick={() => updateField('role', 'pet_owner')}
          >
            🐾 Pet Owner
          </button>
          <button
            style={{
              flex: 1, padding: '0.65rem',
              background: form.role === 'drone_pilot' ? 'var(--primary-bg)' : 'var(--bg-card)',
              color: form.role === 'drone_pilot' ? 'var(--primary)' : 'var(--text-muted)',
              border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem',
              fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.04em',
            }}
            onClick={() => updateField('role', 'drone_pilot')}
          >
            🛸 Drone Pilot
          </button>
        </div>

        {/* Registration Form */}
        <div className="card">
          <div className="card-body" style={{ padding: '1.5rem' }}>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">First Name *</label>
                  <input type="text" className={`form-input ${errors.firstName ? 'error' : ''}`} value={form.firstName} onChange={(e) => updateField('firstName', e.target.value)} placeholder="John" />
                  {errors.firstName && <div className="form-error">{errors.firstName}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name *</label>
                  <input type="text" className={`form-input ${errors.lastName ? 'error' : ''}`} value={form.lastName} onChange={(e) => updateField('lastName', e.target.value)} placeholder="Doe" />
                  {errors.lastName && <div className="form-error">{errors.lastName}</div>}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label"><FiMail size={11} style={{ verticalAlign: 'middle', marginRight: '0.3rem' }} />Email *</label>
                <input type="email" className={`form-input ${errors.email ? 'error' : ''}`} value={form.email} onChange={(e) => updateField('email', e.target.value)} placeholder="you@example.com" />
                {errors.email && <div className="form-error">{errors.email}</div>}
              </div>

              <div className="form-group">
                <label className="form-label"><FiPhone size={11} style={{ verticalAlign: 'middle', marginRight: '0.3rem' }} />Phone</label>
                <input type="tel" className="form-input" value={form.phone} onChange={(e) => updateField('phone', e.target.value)} placeholder="(555) 123-4567" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label"><FiLock size={11} style={{ verticalAlign: 'middle', marginRight: '0.3rem' }} />Password *</label>
                  <input type="password" className={`form-input ${errors.password ? 'error' : ''}`} value={form.password} onChange={(e) => updateField('password', e.target.value)} placeholder="Min 6 chars" />
                  {errors.password && <div className="form-error">{errors.password}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm *</label>
                  <input type="password" className={`form-input ${errors.confirmPassword ? 'error' : ''}`} value={form.confirmPassword} onChange={(e) => updateField('confirmPassword', e.target.value)} placeholder="Confirm" />
                  {errors.confirmPassword && <div className="form-error">{errors.confirmPassword}</div>}
                </div>
              </div>

              {/* Pilot-specific fields */}
              {form.role === 'drone_pilot' && (
                <div style={{
                  background: 'var(--primary-bg)',
                  border: '1px solid rgba(4,107,210,0.2)',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  marginBottom: '0.75rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)' }}>
                    <FiShield size={14} /> Pilot Verification
                  </div>
                  <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                    <label className="form-label">FAA Part 107 Certificate #</label>
                    <input type="text" className="form-input" value={form.faaCertNumber} onChange={(e) => updateField('faaCertNumber', e.target.value)} placeholder="e.g., FAA-107-4235678" style={{ fontSize: '0.85rem' }} />
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Required to get verified and appear on the map</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Insurance Provider</label>
                      <input type="text" className="form-input" value={form.insuranceProvider} onChange={(e) => updateField('insuranceProvider', e.target.value)} placeholder="SkyWatch, AOPA..." style={{ fontSize: '0.85rem' }} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Policy Number</label>
                      <input type="text" className="form-input" value={form.insurancePolicyNumber} onChange={(e) => updateField('insurancePolicyNumber', e.target.value)} placeholder="SW-2024-..." style={{ fontSize: '0.85rem' }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Terms of Service */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <input
                    type="checkbox"
                    checked={form.agreeToTerms}
                    onChange={(e) => updateField('agreeToTerms', e.target.checked)}
                    style={{ marginTop: '0.15rem', accentColor: 'var(--primary)' }}
                  />
                  <span>
                    I agree to the{' '}
                    <Link to="/terms" target="_blank" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>Terms of Service</Link>
                    {' '}and{' '}
                    <Link to="/privacy" target="_blank" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>Privacy Policy</Link>
                  </span>
                </label>
                {errors.agreeToTerms && <div className="form-error">{errors.agreeToTerms}</div>}
              </div>

              <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Creating Account...' : `Create ${form.role === 'drone_pilot' ? 'Pilot' : 'Pet Owner'} Account`}
              </button>
            </form>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

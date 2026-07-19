import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

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
      });
      
      toast.success(`Welcome, ${user.firstName}!`);
      
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
    <div style={{ minHeight: 'calc(100vh - 200px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: '520px' }}>
        <div className="card-body" style={{ padding: '2.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <svg width="48" height="48" viewBox="0 0 40 40" fill="none" style={{ margin: '0 auto 1rem' }}>
              <rect width="40" height="40" rx="10" fill="#059669"/>
              <path d="M20 8C16 8 12 12 12 18C12 24 20 32 20 32C20 32 28 24 28 18C28 12 24 8 20 8Z" fill="white" opacity="0.9"/>
              <path d="M20 14C22 14 24 16 24 18C24 22 20 26 20 26C20 26 16 22 16 18C16 16 18 14 20 14Z" fill="#059669"/>
            </svg>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Create Your Account</h1>
            <p style={{ color: 'var(--gray-500)', fontSize: '0.95rem' }}>Join the LPDR community</p>
          </div>

          {/* Role Toggle */}
          <div style={{ display: 'flex', marginBottom: '2rem', border: '2px solid var(--gray-200)', borderRadius: '12px', overflow: 'hidden' }}>
            <button
              style={{
                flex: 1,
                padding: '0.75rem',
                background: form.role === 'pet_owner' ? 'var(--primary)' : 'white',
                color: form.role === 'pet_owner' ? 'white' : 'var(--gray-600)',
                border: 'none',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onClick={() => updateField('role', 'pet_owner')}
            >
              🐾 Pet Owner
            </button>
            <button
              style={{
                flex: 1,
                padding: '0.75rem',
                background: form.role === 'drone_pilot' ? 'var(--primary)' : 'white',
                color: form.role === 'drone_pilot' ? 'white' : 'var(--gray-600)',
                border: 'none',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onClick={() => updateField('role', 'drone_pilot')}
            >
              🛸 Drone Pilot
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">First Name *</label>
                <input
                  type="text"
                  className={`form-input ${errors.firstName ? 'error' : ''}`}
                  value={form.firstName}
                  onChange={(e) => updateField('firstName', e.target.value)}
                  placeholder="John"
                />
                {errors.firstName && <div className="form-error">{errors.firstName}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Last Name *</label>
                <input
                  type="text"
                  className={`form-input ${errors.lastName ? 'error' : ''}`}
                  value={form.lastName}
                  onChange={(e) => updateField('lastName', e.target.value)}
                  placeholder="Doe"
                />
                {errors.lastName && <div className="form-error">{errors.lastName}</div>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email *</label>
              <input
                type="email"
                className={`form-input ${errors.email ? 'error' : ''}`}
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="you@example.com"
              />
              {errors.email && <div className="form-error">{errors.email}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Phone</label>
              <input
                type="tel"
                className="form-input"
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Password *</label>
                <input
                  type="password"
                  className={`form-input ${errors.password ? 'error' : ''}`}
                  value={form.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  placeholder="Min 6 characters"
                />
                {errors.password && <div className="form-error">{errors.password}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password *</label>
                <input
                  type="password"
                  className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                  value={form.confirmPassword}
                  onChange={(e) => updateField('confirmPassword', e.target.value)}
                  placeholder="Confirm password"
                />
                {errors.confirmPassword && <div className="form-error">{errors.confirmPassword}</div>}
              </div>
            </div>

            {form.role === 'drone_pilot' && (
              <div style={{
                background: 'var(--primary-bg)',
                padding: '1rem',
                borderRadius: '8px',
                marginBottom: '1rem',
                fontSize: '0.9rem',
                color: 'var(--gray-700)',
              }}>
                <strong>📋 Pilot account:</strong> After registering, you'll set up your pilot profile including equipment, service area, and pricing. Pilot accounts require a membership plan to appear on the map.
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Creating Account...' : `Create ${form.role === 'drone_pilot' ? 'Pilot' : 'Pet Owner'} Account`}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--gray-500)' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

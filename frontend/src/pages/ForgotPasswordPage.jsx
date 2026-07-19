import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../services/api';
import { FiMail, FiArrowLeft } from 'react-icons/fi';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (err) {
      // Don't reveal errors (prevents email enumeration)
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 120px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem 1rem' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img src="/lpdr-logo.png" alt="LPDR" style={{ height: '56px', margin: '0 auto 1rem', display: 'block', filter: 'drop-shadow(0 0 16px rgba(4,107,210,0.4))' }} />
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>RESET PASSWORD</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>We'll send you a reset link</p>
        </div>

        {!sent ? (
          <div className="card">
            <div className="card-body" style={{ padding: '1.5rem' }}>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">
                    <FiMail size={12} style={{ verticalAlign: 'middle', marginRight: '0.3rem' }} />
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="form-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="card-body" style={{ padding: '2rem', textAlign: 'center' }}>
              <FiMail size={32} style={{ color: 'var(--primary)', margin: '0 auto 1rem' }} />
              <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Check Your Email</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                If an account exists with that email, you'll receive a password reset link within a few minutes. The link expires in 1 hour.
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                Don't see it? Check your spam folder.
              </p>
            </div>
          </div>
        )}

        <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <FiArrowLeft size={14} /> Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
import { FiLock, FiCheck, FiX } from 'react-icons/fi';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(token ? 'form' : 'invalid');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.resetPassword(token, password);
      // Auto-login after reset
      if (res.data.token) {
        localStorage.setItem('lpdr_token', res.data.token);
        localStorage.setItem('lpdr_user', JSON.stringify(res.data.user));
      }
      setStatus('success');
    } catch (err) {
      setError(err.response?.data?.error || 'Reset failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 120px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem 1rem' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img src="/lpdr-logo.png" alt="LPDR" style={{ height: '56px', margin: '0 auto 1rem', display: 'block', filter: 'drop-shadow(0 0 16px rgba(4,107,210,0.4))' }} />
        </div>

        {status === 'form' && (
          <div className="card">
            <div className="card-body" style={{ padding: '1.5rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: '0.5rem', textAlign: 'center' }}>NEW PASSWORD</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', marginBottom: '1.25rem' }}>Set your new password below.</p>
              
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">
                    <FiLock size={12} style={{ verticalAlign: 'middle', marginRight: '0.3rem' }} />
                    New Password
                  </label>
                  <input
                    type="password"
                    className="form-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <input
                    type="password"
                    className="form-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    required
                  />
                </div>

                {error && <div className="form-error" style={{ marginBottom: '0.75rem' }}>{error}</div>}

                <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="card">
            <div className="card-body" style={{ padding: '2rem', textAlign: 'center' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--success-bg)', border: '2px solid var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <FiCheck size={28} style={{ color: 'var(--success)' }} />
              </div>
              <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--success)' }}>Password Reset!</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>Your password has been updated. You're now signed in.</p>
              <button onClick={() => navigate('/')} className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                Continue to Dashboard
              </button>
            </div>
          </div>
        )}

        {status === 'invalid' && (
          <div className="card">
            <div className="card-body" style={{ padding: '2rem', textAlign: 'center' }}>
              <FiX size={32} style={{ color: 'var(--danger)', margin: '0 auto 1rem' }} />
              <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--danger)' }}>Invalid Link</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>This password reset link is invalid or missing.</p>
              <button onClick={() => navigate('/forgot-password')} className="btn btn-secondary">
                Request New Link
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

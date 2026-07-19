import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../services/api';
import { FiCheck, FiX, FiLoader, FiMail } from 'react-icons/fi';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (token) {
      verifyToken();
    } else {
      setStatus('form');
    }
  }, [token]);

  const verifyToken = async () => {
    try {
      const res = await authApi.verifyEmail(token);
      setStatus('success');
      
      // Auto-login after verification
      if (res.data.token) {
        const { token: authToken, user } = res.data;
        localStorage.setItem('lpdr_token', authToken);
        localStorage.setItem('lpdr_user', JSON.stringify(user));
      }
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.error || 'Verification link is invalid or expired.');
    }
  };

  const handleResend = async (e) => {
    e.preventDefault();
    if (!resendEmail.trim()) return;
    
    setResending(true);
    try {
      await authApi.resendVerification(resendEmail);
      setMessage('If an account with that email exists, a new verification link has been sent.');
      setStatus('resent');
    } catch (err) {
      setMessage('Something went wrong. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 120px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem 1rem' }}>
      <div style={{ width: '100%', maxWidth: '440px', textAlign: 'center' }}>
        <img src="/lpdr-logo.png" alt="LPDR" style={{ height: '56px', margin: '0 auto 1.5rem', display: 'block', filter: 'drop-shadow(0 0 16px rgba(4,107,210,0.4))' }} />

        {status === 'loading' && (
          <div className="card">
            <div className="card-body" style={{ padding: '2rem', textAlign: 'center' }}>
              <FiLoader size={32} className="pulse" style={{ color: 'var(--primary)', margin: '0 auto 1rem' }} />
              <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Verifying your email...</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>One moment, confirming your identity.</p>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="card">
            <div className="card-body" style={{ padding: '2rem', textAlign: 'center' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--success-bg)', border: '2px solid var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <FiCheck size={28} style={{ color: 'var(--success)' }} />
              </div>
              <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--success)' }}>Email Verified!</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>Your email has been confirmed. You're all set.</p>
              <button onClick={() => navigate('/login')} className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                Sign In
              </button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="card">
            <div className="card-body" style={{ padding: '2rem', textAlign: 'center' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(239,68,68,0.1)', border: '2px solid var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <FiX size={28} style={{ color: 'var(--danger)' }} />
              </div>
              <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--danger)' }}>Verification Failed</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>{message || 'This link is invalid or has expired.'}</p>
              
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Need a new link? Enter your email:</p>
                <form onSubmit={handleResend}>
                  <input
                    type="email"
                    className="form-input"
                    value={resendEmail}
                    onChange={e => setResendEmail(e.target.value)}
                    placeholder="your@email.com"
                    style={{ marginBottom: '0.75rem' }}
                  />
                  <button type="submit" className="btn btn-secondary" style={{ width: '100%' }} disabled={resending}>
                    <FiMail size={14} /> {resending ? 'Sending...' : 'Resend Verification'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {status === 'resent' && (
          <div className="card">
            <div className="card-body" style={{ padding: '2rem', textAlign: 'center' }}>
              <FiMail size={32} style={{ color: 'var(--primary)', margin: '0 auto 1rem' }} />
              <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Check Your Email</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>{message}</p>
              <button onClick={() => navigate('/login')} className="btn btn-secondary" style={{ width: '100%' }}>
                Back to Sign In
              </button>
            </div>
          </div>
        )}

        {status === 'form' && (
          <div className="card">
            <div className="card-body" style={{ padding: '2rem', textAlign: 'center' }}>
              <FiMail size={32} style={{ color: 'var(--primary)', margin: '0 auto 1rem' }} />
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: '0.5rem' }}>VERIFY EMAIL</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>Enter your email to get a new verification link.</p>
              <form onSubmit={handleResend}>
                <input
                  type="email"
                  className="form-input"
                  value={resendEmail}
                  onChange={e => setResendEmail(e.target.value)}
                  placeholder="your@email.com"
                  style={{ marginBottom: '0.75rem' }}
                />
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={resending}>
                  <FiMail size={14} /> {resending ? 'Sending...' : 'Send Verification Link'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

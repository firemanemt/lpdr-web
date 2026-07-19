import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { pilotApi } from '../services/api';
import toast from 'react-hot-toast';
import { FiCheck, FiClock, FiAlertCircle, FiShield, FiArrowLeft } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const statusConfig = {
  unsubmitted: { label: 'Not Submitted', color: 'var(--text-muted)', icon: FiAlertCircle, description: 'Submit your FAA certification to get verified and appear on the map.' },
  pending: { label: 'Under Review', color: 'var(--warning)', icon: FiClock, description: 'Your verification is being reviewed. This usually takes 1-2 business days.' },
  approved: { label: 'Verified ✓', color: 'var(--success)', icon: FiCheck, description: 'You\'re verified! You appear on the pilot map and can receive case alerts.' },
  rejected: { label: 'Not Approved', color: 'var(--danger)', icon: FiAlertCircle, description: 'Your verification was not approved. See notes below and resubmit with updated information.' },
};

export default function PilotVerificationPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    faaCertNumber: '',
    insuranceProvider: '',
    insurancePolicyNumber: '',
  });

  useEffect(() => { loadVerification(); }, []);

  const loadVerification = async () => {
    try {
      const res = await pilotApi.getVerification();
      setVerification(res.data.verification);
      if (res.data.verification.faaCertNumber) {
        setForm(prev => ({ ...prev, faaCertNumber: res.data.verification.faaCertNumber }));
      }
      if (res.data.verification.insuranceProvider) {
        setForm(prev => ({ ...prev, insuranceProvider: res.data.verification.insuranceProvider }));
      }
    } catch (err) {
      console.error('Failed to load verification:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.faaCertNumber.trim()) {
      toast.error('FAA certificate number is required');
      return;
    }
    setSubmitting(true);
    try {
      await pilotApi.submitVerification(form);
      toast.success('Verification submitted! We\'ll review it within 1-2 business days.');
      loadVerification();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit verification');
    } finally {
      setSubmitting(false);
    }
  };

  const statusKey = verification?.status || 'unsubmitted';
  const config = statusConfig[statusKey];
  const StatusIcon = config.icon;

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>;

  return (
    <div>
      <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)', padding: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={() => navigate('/pilot/dashboard')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <FiArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>PILOT VERIFICATION</h1>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>FAA Part 107 Certification</p>
          </div>
        </div>
      </div>

      <div style={{ padding: '1rem', maxWidth: '600px', margin: '0 auto' }}>
        {/* Status Card */}
        <div className="card" style={{ marginBottom: '1rem', borderLeft: `3px solid ${config.color}` }}>
          <div style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: `${config.color}15`, border: `1px solid ${config.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <StatusIcon size={22} style={{ color: config.color }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: config.color }}>{config.label}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: '0.2rem' }}>{config.description}</div>
            </div>
          </div>
        </div>

        {/* Rejection notes */}
        {verification?.status === 'rejected' && verification?.notes && (
          <div className="card" style={{ marginBottom: '1rem', borderLeft: '3px solid var(--danger)' }}>
            <div style={{ padding: '1rem' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>Review Notes</div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{verification.notes}</p>
            </div>
          </div>
        )}

        {/* Info about verification */}
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div style={{ padding: '1rem' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FiShield size={12} /> Why Get Verified?
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <FiCheck size={14} style={{ color: 'var(--success)', marginTop: '0.15rem', flexShrink: 0 }} />
                <span>Appear on the pilot map and get discovered by pet owners</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <FiCheck size={14} style={{ color: 'var(--success)', marginTop: '0.15rem', flexShrink: 0 }} />
                <span>Receive case alerts and accept search missions</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <FiCheck size={14} style={{ color: 'var(--success)', marginTop: '0.15rem', flexShrink: 0 }} />
                <span>Access owner contact info (phone/email) for active cases</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <FiCheck size={14} style={{ color: 'var(--success)', marginTop: '0.15rem', flexShrink: 0 }} />
                <span>Build trust with a verified badge on your profile</span>
              </div>
            </div>
          </div>
        </div>

        {/* Verification Form (show if unsubmitted or rejected) */}
        {(verification?.status === 'unsubmitted' || verification?.status === 'rejected') && (
          <div className="card">
            <div style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>
                {verification?.status === 'rejected' ? 'Resubmit Verification' : 'Submit Verification'}
              </h3>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">FAA Part 107 Certificate Number *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.faaCertNumber}
                    onChange={(e) => setForm(prev => ({ ...prev, faaCertNumber: e.target.value }))}
                    placeholder="e.g., FAA-107-4235678"
                  />
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Your Remote Pilot Certificate number</div>
                </div>

                <div className="form-group">
                  <label className="form-label">Insurance Provider</label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.insuranceProvider}
                    onChange={(e) => setForm(prev => ({ ...prev, insuranceProvider: e.target.value }))}
                    placeholder="e.g., SkyWatch, AOPA, Thompson Insurance"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Insurance Policy Number</label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.insurancePolicyNumber}
                    onChange={(e) => setForm(prev => ({ ...prev, insurancePolicyNumber: e.target.value }))}
                    placeholder="e.g., SW-2024-78901"
                  />
                </div>

                <div style={{ background: 'var(--primary-bg)', border: '1px solid rgba(4,107,210,0.2)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  By submitting, you confirm that all information is accurate and current. Falsifying credentials may result in permanent account termination.
                </div>

                <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit for Verification'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Already submitted / approved */}
        {(verification?.status === 'pending' || verification?.status === 'approved') && verification?.faaCertNumber && (
          <div className="card">
            <div style={{ padding: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>FAA Cert #</div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', fontFamily: 'var(--font-mono)' }}>{verification.faaCertNumber}</div>
                </div>
                {verification.insuranceProvider && (
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Insurance</div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{verification.insuranceProvider}</div>
                  </div>
                )}
                {verification.submittedAt && (
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Submitted</div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{new Date(verification.submittedAt).toLocaleDateString()}</div>
                  </div>
                )}
                {verification.reviewedAt && (
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Reviewed</div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{new Date(verification.reviewedAt).toLocaleDateString()}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

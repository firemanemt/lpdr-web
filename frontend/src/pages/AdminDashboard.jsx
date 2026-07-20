import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { adminApi } from '../services/api';
import { FiUsers, FiRadio, FiCheck, FiX, FiClock, FiMapPin, FiMail, FiPhone, FiShield, FiActivity } from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [verifications, setVerifications] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState({});

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [statsRes, verRes] = await Promise.all([
        adminApi.getStats(),
        adminApi.getVerifications(),
      ]);
      setStats(statsRes.data);
      setVerifications(verRes.data.verifications || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (pilotId, status) => {
    const notes = status === 'rejected' 
      ? prompt('Enter reason for rejection (shown to pilot):') || ''
      : '';
    if (status === 'rejected' && !notes) return;

    setReviewing(prev => ({ ...prev, [pilotId]: true }));
    try {
      await adminApi.reviewVerification(pilotId, status, notes);
      setVerifications(prev => prev.filter(v => v.id !== pilotId));
      setStats(prev => ({ ...prev, pendingVerifications: Math.max(0, (prev.pendingVerifications || 1) - 1) }));
    } catch (err) {
      console.error('Failed to review:', err);
    } finally {
      setReviewing(prev => ({ ...prev, [pilotId]: false }));
    }
  };

  if (loading) return <LoadingSpinner text="Loading admin dashboard..." />;

  return (
    <div>
      {/* Header */}
      <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)', padding: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)', fontWeight: 700, fontSize: '0.9rem', fontFamily: 'var(--font-display)' }}>
            ADM
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '1rem' }}>Admin Dashboard</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FiShield size={12} /> Restricted Access
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ padding: '1rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
          <div className="card stat-card" style={{ padding: '0.75rem' }}>
            <div className="value" style={{ fontSize: '1.3rem' }}>{stats.users?.pet_owner || 0}</div>
            <div className="label" style={{ fontSize: '0.6rem' }}>Pet Owners</div>
          </div>
          <div className="card stat-card" style={{ padding: '0.75rem' }}>
            <div className="value" style={{ fontSize: '1.3rem' }}>{stats.users?.drone_pilot || 0}</div>
            <div className="label" style={{ fontSize: '0.6rem' }}>Drone Pilots</div>
          </div>
          <div className="card stat-card" style={{ padding: '0.75rem' }}>
            <div className="value" style={{ fontSize: '1.3rem' }}>{stats.users?.admin || 0}</div>
            <div className="label" style={{ fontSize: '0.6rem' }}>Admins</div>
          </div>
          <div className="card stat-card" style={{ padding: '0.75rem' }}>
            <div className="value" style={{ fontSize: '1.3rem' }}>{Object.values(stats.cases || {}).reduce((a, b) => a + b, 0)}</div>
            <div className="label" style={{ fontSize: '0.6rem' }}>Total Cases</div>
          </div>
          <div className="card stat-card" style={{ padding: '0.75rem' }}>
            <div className="value" style={{ fontSize: '1.3rem', color: 'var(--accent)' }}>{stats.cases?.searching || 0}</div>
            <div className="label" style={{ fontSize: '0.6rem' }}>Searching</div>
          </div>
          <div className="card stat-card" style={{ padding: '0.75rem' }}>
            <div className="value" style={{ fontSize: '1.3rem', color: stats.pendingVerifications > 0 ? 'var(--danger)' : 'var(--success)' }}>{stats.pendingVerifications || 0}</div>
            <div className="label" style={{ fontSize: '0.6rem' }}>Pending Verifications</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ padding: '0 1rem' }}>
        <div className="tabs">
          <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
            <FiActivity size={12} style={{ verticalAlign: 'middle', marginRight: '0.3rem' }} /> Overview
          </button>
          <button className={`tab ${activeTab === 'verifications' ? 'active' : ''}`} onClick={() => setActiveTab('verifications')}>
            <FiShield size={12} style={{ verticalAlign: 'middle', marginRight: '0.3rem' }} /> Verifications
            {verifications.length > 0 && (
              <span style={{ marginLeft: '0.3rem', background: 'var(--danger)', color: 'white', fontSize: '0.6rem', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 700 }}>{verifications.length}</span>
            )}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div style={{ padding: '0 1rem 1rem' }}>
        {activeTab === 'overview' && (
          <div className="fade-in">
            {/* Case status breakdown */}
            {stats?.cases && (
              <div className="card" style={{ marginBottom: '0.75rem' }}>
                <div className="card-header"><FiRadio size={14} /> Case Status Breakdown</div>
                <div style={{ padding: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {Object.entries(stats.cases).map(([status, count]) => (
                    <div key={status} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
                      <span style={{ fontSize: '0.85rem', textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{status}</span>
                      <span style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* System info */}
            <div className="card">
              <div className="card-header"><FiActivity size={14} /> System Status</div>
              <div style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Mode</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Production</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Database</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--success)' }}>Connected</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>WP Pilot Sync</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--success)' }}>Active</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Notifications</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent)' }}>Email + Log</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'verifications' && (
          <div className="fade-in">
            {verifications.length === 0 ? (
              <div className="card">
                <div className="empty-state">
                  <div className="icon">✅</div>
                  <h3>All caught up!</h3>
                  <p>No pending pilot verifications.</p>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {verifications.map(v => (
                  <div key={v.id} className="card" style={{ borderLeft: '3px solid var(--accent)' }}>
                    <div style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '1rem' }}>{v.first_name} {v.last_name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.15rem' }}>
                            <FiMail size={11} /> {v.email}
                          </div>
                          {v.phone && (
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.1rem' }}>
                              <FiPhone size={11} /> {v.phone}
                            </div>
                          )}
                        </div>
                        <span className="badge badge-yellow">PENDING</span>
                      </div>

                      <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '8px', marginBottom: '0.75rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>FAA Certificate #</div>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem', fontFamily: 'var(--font-mono)' }}>{v.faa_cert_number || 'Not provided'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Insurance</div>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{v.insurance_provider || 'Not provided'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Policy #</div>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem', fontFamily: 'var(--font-mono)' }}>{v.insurance_policy_number || 'Not provided'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Submitted</div>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{v.verification_submitted_at ? new Date(v.verification_submitted_at).toLocaleDateString() : 'Unknown'}</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleReview(v.id, 'approved')}
                          className="btn btn-primary btn-sm"
                          style={{ flex: 1 }}
                          disabled={reviewing[v.id]}
                        >
                          <FiCheck size={14} /> {reviewing[v.id] ? 'Processing...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleReview(v.id, 'rejected')}
                          className="btn btn-danger btn-sm"
                          style={{ flex: 1, background: 'var(--danger)', borderColor: 'var(--danger)', color: 'white' }}
                          disabled={reviewing[v.id]}
                        >
                          <FiX size={14} /> {reviewing[v.id] ? 'Processing...' : 'Reject'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

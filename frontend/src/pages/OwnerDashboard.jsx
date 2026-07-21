import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { caseApi } from '../services/api';
import { requestNotificationPermission, notifyCaseUpdate } from '../services/notificationService';
import { FiPlus, FiMessageSquare, FiMapPin, FiClock, FiCheckCircle, FiAlertCircle, FiChevronRight } from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner';

const statusConfig = {
  submitted: { label: 'Submitted', color: 'badge-blue' },
  notifying: { label: 'Finding Pilot', color: 'badge-yellow' },
  matched: { label: 'Pilot Matched', color: 'badge-green' },
  searching: { label: 'Searching', color: 'badge-purple' },
  found: { label: 'Found!', color: 'badge-green' },
  completed: { label: 'Completed', color: 'badge-gray' },
  reviewed: { label: 'Reviewed', color: 'badge-gray' },
  cancelled: { label: 'Cancelled', color: 'badge-red' },
};

export default function OwnerDashboard() {
  const { user } = useAuth();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => { loadCases(); requestNotificationPermission(); }, []);

  const loadCases = async () => {
    try {
      const res = await caseApi.list();
      setCases(res.data.cases || []);
    } catch (err) {
      console.error('Failed to load cases:', err);
    } finally {
      setLoading(false);
    }
  };

  const activeCases = cases.filter(c => !['cancelled', 'completed', 'reviewed'].includes(c.status));
  const pastCases = cases.filter(c => ['completed', 'reviewed', 'cancelled'].includes(c.status));

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;

  return (
    <div>
      {/* Status Bar */}
      <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)', padding: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--primary-bg)', border: '1px solid rgba(4,107,210,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 700, fontSize: '0.9rem', fontFamily: 'var(--font-display)' }}>
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '1rem' }}>{user?.firstName} {user?.lastName}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className="status-dot online" /> Pet Owner — Active
            </div>
          </div>
        </div>
        
        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
          <div className="card stat-card" style={{ padding: '0.75rem' }}>
            <div className="value" style={{ fontSize: '1.3rem' }}>{activeCases.length}</div>
            <div className="label" style={{ fontSize: '0.65rem' }}>Active</div>
          </div>
          <div className="card stat-card" style={{ padding: '0.75rem' }}>
            <div className="value" style={{ fontSize: '1.3rem' }}>{pastCases.length}</div>
            <div className="label" style={{ fontSize: '0.65rem' }}>Resolved</div>
          </div>
          <div className="card stat-card" style={{ padding: '0.75rem' }}>
            <div className="value" style={{ fontSize: '1.3rem', color: 'var(--success)' }}>—</div>
            <div className="label" style={{ fontSize: '0.65rem' }}>Rating</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '1rem' }}>
        {/* Quick Action */}
        <Link to="/cases/new" className="card card-interactive" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', textDecoration: 'none', marginBottom: '1rem', borderLeft: '3px solid var(--accent)' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: 'var(--accent-bg)', border: '1px solid rgba(250,145,24,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', flexShrink: 0 }}>
            <FiPlus size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>Report a Lost Pet</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Every second counts. Start a new case now.</div>
          </div>
          <FiChevronRight style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        </Link>

        {/* Active Cases */}
        <div className="section-title">
          <FiAlertCircle size={14} />
          Active Cases ({activeCases.length})
        </div>

        {activeCases.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="icon">🐾</div>
              <h3>No active cases</h3>
              <p>If your pet goes missing, we're here 24/7.</p>
              <Link to="/cases/new" className="btn btn-primary btn-sm">
                <FiPlus size={14} /> Report Lost Pet
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {activeCases.map(c => {
              const cfg = statusConfig[c.status] || statusConfig.submitted;
              return (
                <div key={c.id} className="card card-interactive fade-in" style={{ cursor: 'pointer' }} onClick={() => navigate(`/cases/${c.id}`)}>
                  <div style={{ padding: '0.85rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ fontSize: '1.5rem' }}>
                        {c.pet_type === 'dog' ? '🐕' : c.pet_type === 'cat' ? '🐱' : c.pet_type === 'horse' ? '🐴' : '🐾'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{c.pet_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {c.pet_breed} · {new Date(c.last_seen_date).toLocaleDateString()}
                        </div>
                        {c.pilotName && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: '0.15rem' }}>
                            → {c.pilotName}
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {c.unreadMessages > 0 && (
                        <span style={{ background: 'var(--primary)', color: 'white', fontSize: '0.65rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}>
                          {c.unreadMessages}
                        </span>
                      )}
                      <span className={`badge ${cfg.color}`}>{cfg.label}</span>
                      <FiChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Past Cases */}
        {pastCases.length > 0 && (
          <>
            <div className="section-title" style={{ marginTop: '1.5rem' }}>
              <FiCheckCircle size={14} />
              Resolved ({pastCases.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {pastCases.slice(0, 5).map(c => {
                const cfg = statusConfig[c.status] || statusConfig.submitted;
                return (
                  <div key={c.id} className="card" style={{ cursor: 'pointer', opacity: 0.7 }} onClick={() => navigate(`/cases/${c.id}`)}>
                    <div style={{ padding: '0.6rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{ fontSize: '1.1rem' }}>🐾</span>
                        <div>
                          <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{c.pet_name}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: '0.4rem', fontFamily: 'var(--font-mono)' }}>
                            {c.pet_breed}
                          </span>
                        </div>
                      </div>
                      <span className={`badge ${cfg.color}`}>{cfg.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Quick Links */}
        <div style={{ marginTop: '1.5rem' }}>
          <div className="section-title">Quick Actions</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <Link to="/map" className="btn btn-secondary" style={{ textDecoration: 'none', justifyContent: 'flex-start' }}>
              <FiMapPin size={16} /> Find Pilots
            </Link>
            <Link to="/faqs" className="btn btn-secondary" style={{ textDecoration: 'none', justifyContent: 'flex-start' }}>
              <FiMessageSquare size={16} /> Get Help
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

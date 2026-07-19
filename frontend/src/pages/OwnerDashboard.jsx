import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { caseApi } from '../services/api';
import { FiPlus, FiMessageSquare, FiMapPin, FiClock, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
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

  useEffect(() => {
    loadCases();
  }, []);

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

  if (loading) return <LoadingSpinner text="Loading your dashboard..." />;

  return (
    <div>
      {/* Welcome Banner */}
      <section className="page-header" style={{ padding: '2rem 0' }}>
        <div className="container">
          <h1 style={{ fontSize: '1.8rem' }}>Welcome, {user?.firstName}! 🐾</h1>
          <p>Here's your pet recovery dashboard</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {/* Stats + Quick Actions */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="welcome-banner" style={{ marginBottom: 0 }}>
              <h2>Need to report a lost pet?</h2>
              <p style={{ marginBottom: '1.5rem' }}>Every second counts. Start a new case and we'll alert nearby pilots immediately.</p>
              <Link to="/cases/new" className="btn btn-accent btn-lg">
                <FiPlus size={20} />
                Report a Lost Pet
              </Link>
            </div>

            <div className="card">
              <div className="card-body" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary)' }}>{activeCases.length}</div>
                <div style={{ color: 'var(--gray-500)', fontSize: '0.95rem' }}>Active Cases</div>
                <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--gray-400)' }}>
                  {pastCases.length} completed
                </div>
                <Link to="/map" className="btn btn-outline btn-sm" style={{ marginTop: '1rem' }}>
                  <FiMapPin size={14} />
                  Find Pilots Near You
                </Link>
              </div>
            </div>
          </div>

          {/* Active Cases */}
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
            {activeCases.length > 0 ? 'Active Cases' : 'No Active Cases'}
          </h2>

          {activeCases.length === 0 ? (
            <div className="card">
              <div className="card-body" style={{ textAlign: 'center', padding: '3rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🐾</div>
                <h3 style={{ marginBottom: '0.5rem' }}>No active cases</h3>
                <p style={{ color: 'var(--gray-500)', marginBottom: '1.5rem' }}>
                  If your pet goes missing, we're here to help 24/7.
                </p>
                <Link to="/cases/new" className="btn btn-primary">
                  <FiPlus size={16} />
                  Report a Lost Pet
                </Link>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {activeCases.map(c => {
                const cfg = statusConfig[c.status] || statusConfig.submitted;
                return (
                  <div key={c.id} className="card fade-in" style={{ cursor: 'pointer' }} onClick={() => navigate(`/cases/${c.id}`)}>
                    <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ fontSize: '2rem' }}>
                          {c.pet_type === 'dog' ? '🐕' : c.pet_type === 'cat' ? '🐱' : c.pet_type === 'horse' ? '🐴' : '🐾'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{c.pet_name}</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>
                            {c.pet_breed} · Lost {new Date(c.last_seen_date).toLocaleDateString()}
                          </div>
                          {c.pilotName && (
                            <div style={{ fontSize: '0.85rem', color: 'var(--primary)', marginTop: '0.25rem' }}>
                              Assigned to: {c.pilotName}
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {c.unreadMessages > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--primary)', fontWeight: 600, fontSize: '0.85rem' }}>
                            <FiMessageSquare size={14} />
                            {c.unreadMessages}
                          </div>
                        )}
                        <span className={`badge ${cfg.color}`}>{cfg.label}</span>
                        <FiClock size={16} style={{ color: 'var(--gray-400)' }} />
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
              <h2 style={{ fontSize: '1.25rem', marginTop: '2rem', marginBottom: '1rem' }}>Past Cases</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {pastCases.slice(0, 5).map(c => {
                  const cfg = statusConfig[c.status] || statusConfig.submitted;
                  return (
                    <div key={c.id} className="card" style={{ opacity: 0.7, cursor: 'pointer' }} onClick={() => navigate(`/cases/${c.id}`)}>
                      <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ fontSize: '1.5rem' }}>🐾</span>
                          <div>
                            <span style={{ fontWeight: 500 }}>{c.pet_name}</span>
                            <span style={{ color: 'var(--gray-400)', fontSize: '0.85rem', marginLeft: '0.5rem' }}>
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
        </div>
      </section>
    </div>
  );
}

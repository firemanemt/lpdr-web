import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { caseApi, pilotApi } from '../services/api';
import { FiToggleLeft, FiToggleRight, FiMapPin, FiStar, FiClock, FiPhone, FiDollarSign } from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner';

const statusConfig = {
  submitted: { label: 'New', color: 'badge-blue' },
  notifying: { label: 'Alerting', color: 'badge-yellow' },
  matched: { label: 'Your Case', color: 'badge-green' },
  searching: { label: 'Searching', color: 'badge-purple' },
  found: { label: 'Found!', color: 'badge-green' },
  completed: { label: 'Completed', color: 'badge-gray' },
};

export default function PilotDashboard() {
  const { user } = useAuth();
  const [cases, setCases] = useState([]);
  const [available, setAvailable] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [casesRes, meRes] = await Promise.all([
        caseApi.list(),
        pilotApi.getById(user.id).catch(() => null),
      ]);
      setCases(casesRes.data.cases || []);
      if (meRes?.data?.pilot?.profile) {
        setProfile(meRes.data.pilot.profile);
        setAvailable(meRes.data.pilot.profile.available);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async () => {
    const newState = !available;
    setAvailable(newState);
    try {
      await pilotApi.toggleAvailability(newState);
    } catch (err) {
      setAvailable(!newState);
    }
  };

  const acceptCase = async (caseId) => {
    try {
      await caseApi.accept(caseId);
      loadData();
    } catch (err) {
      console.error('Failed to accept case:', err);
    }
  };

  const updateStatus = async (caseId, status) => {
    try {
      await caseApi.updateStatus(caseId, status);
      loadData();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  if (loading) return <LoadingSpinner text="Loading pilot dashboard..." />;

  const activeCases = cases.filter(c => ['matched', 'searching'].includes(c.status));
  const availableCases = cases.filter(c => c.status === 'notifying');
  const completedCases = cases.filter(c => ['found', 'completed', 'reviewed'].includes(c.status));

  return (
    <div>
      <section className="page-header" style={{ padding: '2rem 0' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '1.8rem' }}>Welcome, {user?.firstName}! 🛸</h1>
              <p>Pilot Dashboard — manage your cases and availability</p>
            </div>
            <button
              onClick={toggleAvailability}
              className={`btn ${available ? 'btn-primary' : 'btn-secondary'} btn-lg`}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {available ? <FiToggleRight size={24} /> : <FiToggleLeft size={24} />}
              {available ? 'Online & Available' : 'Offline'}
            </button>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {/* Stats */}
          <div className="stats-grid" style={{ marginBottom: '2rem' }}>
            <div className="card stat-card">
              <div className="value">{activeCases.length}</div>
              <div className="label">Active Cases</div>
            </div>
            <div className="card stat-card">
              <div className="value">{availableCases.length}</div>
              <div className="label">Available Nearby</div>
            </div>
            <div className="card stat-card">
              <div className="value">{profile?.average_rating || '—'}</div>
              <div className="label">Rating ({profile?.total_reviews || 0} reviews)</div>
            </div>
            <div className="card stat-card">
              <div className="value">{completedCases.length}</div>
              <div className="label">Completed</div>
            </div>
          </div>

          <div className="dashboard-grid">
            <div>
              {/* Active Cases */}
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
                Your Active Cases ({activeCases.length})
              </h2>
              
              {activeCases.length === 0 ? (
                <div className="card">
                  <div className="card-body" style={{ textAlign: 'center', padding: '2rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛸</div>
                    <h3 style={{ marginBottom: '0.5rem' }}>No active searches</h3>
                    <p style={{ color: 'var(--gray-500)' }}>
                      {available ? 'Waiting for case alerts...' : 'Toggle yourself as available to receive case alerts'}
                    </p>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {activeCases.map(c => (
                    <div key={c.id} className="card fade-in">
                      <div className="card-body" style={{ cursor: 'pointer' }} onClick={() => navigate(`/cases/${c.id}`)}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ fontSize: '1.5rem' }}>🐾</span>
                            <div>
                              <strong>{c.pet_name}</strong>
                              <span style={{ color: 'var(--gray-500)', fontSize: '0.85rem', marginLeft: '0.5rem' }}>
                                {c.pet_breed} · {c.pet_type}
                              </span>
                            </div>
                          </div>
                          <span className={`badge ${statusConfig[c.status]?.color || 'badge-gray'}`}>
                            {statusConfig[c.status]?.label || c.status}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--gray-600)' }}>
                          <FiMapPin size={14} /> {c.last_seen_address}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--gray-400)', marginTop: '0.25rem' }}>
                          Owner: {c.ownerName}
                        </div>
                      </div>
                      <div className="card-footer" style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        {c.status === 'matched' && (
                          <button onClick={() => updateStatus(c.id, 'searching')} className="btn btn-primary btn-sm">
                            <FiMapPin size={14} /> Start Search
                          </button>
                        )}
                        {c.status === 'searching' && (
                          <button onClick={() => updateStatus(c.id, 'found', 'Pet found via drone search!')} className="btn btn-accent btn-sm">
                            <FiStar size={14} /> Mark as Found!
                          </button>
                        )}
                        <button onClick={() => navigate(`/cases/${c.id}`)} className="btn btn-secondary btn-sm">
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Available Cases */}
              {availableCases.length > 0 && (
                <>
                  <h2 style={{ fontSize: '1.25rem', marginTop: '2rem', marginBottom: '1rem' }}>
                    Available Cases Near You ({availableCases.length})
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {availableCases.map(c => (
                      <div key={c.id} className="card fade-in" style={{ borderLeft: '4px solid var(--accent)' }}>
                        <div className="card-body">
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <div>
                              <strong>{c.pet_name}</strong>
                              <span style={{ color: 'var(--gray-500)', marginLeft: '0.5rem', fontSize: '0.9rem' }}>
                                {c.pet_breed} · {c.pet_type}
                              </span>
                            </div>
                            <span className={`badge ${c.urgency === 'critical' || c.urgency === 'high' ? 'badge-red' : 'badge-yellow'}`}>
                              {c.urgency}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.9rem', color: 'var(--gray-600)' }}>
                            <FiMapPin size={14} /> {c.last_seen_address}
                          </div>
                          <div style={{ marginTop: '0.75rem' }}>
                            <button onClick={() => acceptCase(c.id)} className="btn btn-primary btn-sm">
                              Accept Case
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Sidebar */}
            <div>
              <div className="card" style={{ marginBottom: '1rem' }}>
                <div className="card-header">Quick Actions</div>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <button onClick={() => navigate('/map')} className="btn btn-outline btn-sm" style={{ justifyContent: 'flex-start' }}>
                    <FiMapPin size={14} /> View Map
                  </button>
                  <button onClick={() => navigate('/pilot/profile')} className="btn btn-outline btn-sm" style={{ justifyContent: 'flex-start' }}>
                    <FiStar size={14} /> Edit Profile
                  </button>
                </div>
              </div>

              <div className="card">
                <div className="card-header">Your Profile Summary</div>
                <div className="card-body">
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>Status</div>
                    <div style={{ fontWeight: 600, color: available ? 'var(--primary)' : 'var(--gray-400)' }}>
                      {available ? '🟢 Available' : '🔴 Offline'}
                    </div>
                  </div>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>Rating</div>
                    <div style={{ fontWeight: 600 }}>{'⭐'.repeat(Math.round(profile?.average_rating || 0))} {profile?.average_rating || 'N/A'}</div>
                  </div>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>Response Time</div>
                    <div style={{ fontWeight: 600 }}>{profile?.response_time || '—'} min avg</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>Membership</div>
                    <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{profile?.membership_status || 'Inactive'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

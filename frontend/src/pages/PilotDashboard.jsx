import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { caseApi, pilotApi } from '../services/api';
import { FiToggleLeft, FiToggleRight, FiMapPin, FiStar, FiClock, FiPhone, FiDollarSign, FiChevronRight, FiRadio, FiShield, FiEdit3 } from 'react-icons/fi';
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

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      // Load cases and profile separately so one failure doesn't kill the other
      let casesRes = null;
      let meRes = null;
      
      try { casesRes = await caseApi.list(); } catch (e) { console.warn('Cases load failed:', e.message); }
      try { meRes = await pilotApi.getById(user.id); } catch (e) { console.warn('Profile load failed:', e.message); }
      
      if (casesRes?.data?.cases) setCases(casesRes.data.cases);
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

  const [toggling, setToggling] = useState(false);

  const toggleAvailability = async () => {
    if (toggling) return;
    setToggling(true);
    try {
      const newState = !available;
      await pilotApi.toggleAvailability(newState);
      // Re-read profile from server to get authoritative state
      const meRes = await pilotApi.getById(user.id);
      if (meRes?.data?.pilot?.profile) {
        setProfile(meRes.data.pilot.profile);
        setAvailable(meRes.data.pilot.profile.available);
      } else {
        // Fallback if re-read fails
        setAvailable(newState);
      }
    } catch (err) {
      console.error('Failed to toggle availability:', err);
    } finally {
      setToggling(false);
    }
  };

  const acceptCase = async (caseId) => {
    try { await caseApi.accept(caseId); loadData(); } catch (err) { console.error('Failed to accept case:', err); }
  };

  const updateStatus = async (caseId, status) => {
    try { await caseApi.updateStatus(caseId, status); loadData(); } catch (err) { console.error('Failed to update status:', err); }
  };

  if (loading) return <LoadingSpinner text="Loading pilot dashboard..." />;

  const activeCases = cases.filter(c => ['matched', 'searching'].includes(c.status));
  const availableCases = cases.filter(c => c.status === 'notifying');
  const completedCases = cases.filter(c => ['found', 'completed', 'reviewed'].includes(c.status));

  return (
    <div>
      {/* Status Bar */}
      <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)', padding: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--primary-bg)', border: '1px solid rgba(4,107,210,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 700, fontSize: '0.9rem', fontFamily: 'var(--font-display)' }}>
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '1rem' }}>{user?.firstName} {user?.lastName}</div>
              <div style={{ fontSize: '0.75rem', color: available ? 'var(--success)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span className={`status-dot ${available ? 'online' : 'offline'}`} />
                {available ? 'Online & Available' : 'Offline'}
                {profile?.verification_status === 'approved' && (
                  <span style={{ marginLeft: '0.3rem', fontSize: '0.65rem', background: 'var(--success-bg)', color: 'var(--success)', padding: '0.1rem 0.35rem', borderRadius: '4px', border: '1px solid rgba(16,185,129,0.2)', fontWeight: 700 }}>✓ VERIFIED</span>
                )}
                {profile?.verification_status === 'pending' && (
                  <span style={{ marginLeft: '0.3rem', fontSize: '0.65rem', background: 'var(--accent-bg)', color: 'var(--accent)', padding: '0.1rem 0.35rem', borderRadius: '4px', border: '1px solid rgba(250,145,24,0.2)', fontWeight: 700 }}>PENDING</span>
                )}
              </div>
            </div>
          </div>
          <button onClick={toggleAvailability} disabled={toggling} style={{
            padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid',
            borderColor: available ? 'var(--success)' : 'var(--border-default)',
            background: available ? 'var(--success-bg)' : 'var(--bg-card)',
            color: available ? 'var(--success)' : 'var(--text-muted)',
            fontWeight: 600, fontSize: '0.8rem', cursor: toggling ? 'wait' : 'pointer', fontFamily: 'var(--font-body)',
            textTransform: 'uppercase', letterSpacing: '0.04em',
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            opacity: toggling ? 0.6 : 1,
          }}>
            {available ? <FiToggleRight size={18} /> : <FiToggleLeft size={18} />}
            {toggling ? '...' : available ? 'ON' : 'OFF'}
          </button>
        </div>
        
        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
          <div className="card stat-card" style={{ padding: '0.6rem' }}>
            <div className="value" style={{ fontSize: '1.1rem' }}>{activeCases.length}</div>
            <div className="label" style={{ fontSize: '0.6rem' }}>Active</div>
          </div>
          <div className="card stat-card" style={{ padding: '0.6rem' }}>
            <div className="value" style={{ fontSize: '1.1rem' }}>{availableCases.length}</div>
            <div className="label" style={{ fontSize: '0.6rem' }}>Available</div>
          </div>
          <div className="card stat-card" style={{ padding: '0.6rem' }}>
            <div className="value" style={{ fontSize: '1.1rem' }}>{profile?.average_rating || '—'}</div>
            <div className="label" style={{ fontSize: '0.6rem' }}>Rating</div>
          </div>
          <div className="card stat-card" style={{ padding: '0.6rem' }}>
            <div className="value" style={{ fontSize: '1.1rem' }}>{completedCases.length}</div>
            <div className="label" style={{ fontSize: '0.6rem' }}>Done</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '1rem' }}>
        {/* Available Cases (Alerts) */}
        {availableCases.length > 0 && (
          <>
            <div className="section-title" style={{ color: 'var(--danger)' }}>
              <FiRadio size={14} />
              Incoming Alerts ({availableCases.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
              {availableCases.map(c => (
                <div key={c.id} className="card fade-in" style={{ borderLeft: '3px solid var(--accent)' }}>
                  <div style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                      <div>
                        <strong style={{ fontSize: '0.95rem' }}>{c.pet_name}</strong>
                        <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                          {c.pet_breed} · {c.pet_type}
                        </span>
                      </div>
                      <span className={`badge ${c.urgency === 'critical' || c.urgency === 'high' ? 'badge-red' : 'badge-yellow'}`}>
                        {c.urgency}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                      <FiMapPin size={12} style={{ verticalAlign: 'middle' }} /> {c.last_seen_address}
                    </div>
                    <button onClick={() => acceptCase(c.id)} className="btn btn-accent btn-sm">
                      Accept Mission
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Active Cases */}
        <div className="section-title">
          <FiRadio size={14} />
          Active Missions ({activeCases.length})
        </div>

        {activeCases.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="icon">🛸</div>
              <h3>No active searches</h3>
              <p>{available ? 'Standing by for case alerts...' : 'Go online to receive case alerts'}</p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {activeCases.map(c => (
              <div key={c.id} className="card card-interactive fade-in" style={{ cursor: 'pointer' }} onClick={() => navigate(`/cases/${c.id}`)}>
                <div style={{ padding: '0.85rem 1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ fontSize: '1.3rem' }}>🐾</span>
                      <div>
                        <strong style={{ fontSize: '0.95rem' }}>{c.pet_name}</strong>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: '0.4rem', fontFamily: 'var(--font-mono)' }}>
                          {c.pet_breed}
                        </span>
                      </div>
                    </div>
                    <span className={`badge ${statusConfig[c.status]?.color || 'badge-gray'}`}>
                      {statusConfig[c.status]?.label || c.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <FiMapPin size={12} style={{ verticalAlign: 'middle' }} /> {c.last_seen_address}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    Owner: {c.ownerName}
                  </div>
                </div>
                <div style={{ padding: '0.5rem 1rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', background: 'var(--bg-secondary)' }}>
                  {c.status === 'matched' && (
                    <button onClick={(e) => { e.stopPropagation(); updateStatus(c.id, 'searching'); }} className="btn btn-primary btn-sm">
                      <FiMapPin size={12} /> Launch Search
                    </button>
                  )}
                  {c.status === 'searching' && (
                    <button onClick={(e) => { e.stopPropagation(); updateStatus(c.id, 'found'); }} className="btn btn-accent btn-sm">
                      <FiStar size={12} /> Mark Found!
                    </button>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); navigate(`/cases/${c.id}`); }} className="btn btn-ghost btn-sm">
                    Details <FiChevronRight size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Profile Summary */}
        <div style={{ marginTop: '1.5rem' }}>
          <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Pilot Profile</span>
            <Link to="/pilot/profile" style={{ fontSize: '0.8rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <FiEdit3 size={12} /> Edit
            </Link>
          </div>
          <div className="card">
            <div style={{ padding: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status</div>
                <div style={{ fontWeight: 600, color: available ? 'var(--success)' : 'var(--text-muted)', fontSize: '0.9rem' }}>
                  {available ? '🟢 Online' : '🔴 Offline'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Rating</div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{'⭐'.repeat(Math.round(profile?.average_rating || 0))} {profile?.average_rating || 'N/A'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Response</div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', fontFamily: 'var(--font-mono)' }}>{profile?.response_time || '—'} min</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Verification</div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', textTransform: 'capitalize', color: profile?.verification_status === 'approved' ? 'var(--success)' : profile?.verification_status === 'pending' ? 'var(--accent)' : 'var(--text-muted)' }}>
                  {profile?.verification_status === 'approved' ? '✓ Verified' : profile?.verification_status === 'pending' ? '⏳ Pending' : 'Not Submitted'}
                </div>
              </div>
            </div>
            <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '0.75rem 1rem' }}>
              {profile?.verification_status === 'approved' ? (
                <div style={{ fontSize: '0.85rem', color: 'var(--success)', textAlign: 'center', fontWeight: 600 }}>
                  ✓ FAA Part 107 Verified
                </div>
              ) : (
                <Link to="/pilot/verification" className="btn btn-accent btn-sm" style={{ width: '100%', textDecoration: 'none' }}>
                  <FiShield size={14} /> {profile?.verification_status === 'pending' ? 'View Verification Status' : 'Submit FAA Verification'}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

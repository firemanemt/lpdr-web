import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { adminApi } from '../services/api';
import { FiUsers, FiRadio, FiCheck, FiX, FiClock, FiMapPin, FiMail, FiPhone, FiShield, FiActivity, FiSearch, FiSend, FiAlertCircle, FiChevronRight, FiEye, FiUserCheck, FiUserX, FiTrash2 } from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [verifications, setVerifications] = useState([]);
  const [users, setUsers] = useState([]);
  const [cases, setCases] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState({});
  const [userFilter, setUserFilter] = useState('');
  const [caseFilter, setCaseFilter] = useState('');
  const [selectedCase, setSelectedCase] = useState(null);
  const [assigningPilot, setAssigningPilot] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastSending, setBroadcastSending] = useState(false);

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

  const loadUsers = async () => {
    try {
      const res = await adminApi.getUsers({ limit: 100 });
      setUsers(res.data.users || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const loadCases = async () => {
    try {
      const res = await adminApi.getCases({ limit: 100 });
      setCases(res.data.cases || []);
    } catch (err) {
      console.error('Failed to load cases:', err);
    }
  };

  // Load data for tabs when switching
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'users' && users.length === 0) loadUsers();
    if (tab === 'cases' && cases.length === 0) loadCases();
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

  const handleAssignPilot = async (caseId, pilotEmail) => {
    if (!pilotEmail) return;
    setAssigningPilot(true);
    try {
      // Find pilot by email from users list
      const pilot = users.find(u => u.email === pilotEmail && u.role === 'drone_pilot');
      if (!pilot) {
        alert('Pilot not found. Make sure the email matches a registered drone pilot.');
        setAssigningPilot(false);
        return;
      }
      await adminApi.assignPilot(caseId, pilot.id);
      alert('Pilot assigned!');
      setSelectedCase(null);
      loadCases();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to assign pilot');
    } finally {
      setAssigningPilot(false);
    }
  };

  const handleBroadcast = async () => {
    if (!broadcastMsg.trim()) return;
    setBroadcastSending(true);
    try {
      await adminApi.broadcast(broadcastMsg);
      alert('Broadcast sent!');
      setBroadcastMsg('');
    } catch (err) {
      alert('Failed to send broadcast');
    } finally {
      setBroadcastSending(false);
    }
  };

  const filteredUsers = users.filter(u => {
    if (!userFilter) return true;
    const f = userFilter.toLowerCase();
    return (u.email || '').toLowerCase().includes(f) || 
           (u.first_name || '').toLowerCase().includes(f) || 
           (u.last_name || '').toLowerCase().includes(f) ||
           (u.role || '').toLowerCase().includes(f);
  });

  const filteredCases = cases.filter(c => {
    if (!caseFilter) return true;
    const f = caseFilter.toLowerCase();
    return (c.pet_name || '').toLowerCase().includes(f) ||
           (c.status || '').toLowerCase().includes(f) ||
           (c.owner_first || '').toLowerCase().includes(f);
  });

  if (loading) return <LoadingSpinner text="Loading admin dashboard..." />;

  const roleBadge = (role) => {
    const colors = {
      pet_owner: { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.3)', color: '#3b82f6', label: 'Owner' },
      drone_pilot: { bg: 'rgba(250,145,24,0.1)', border: 'rgba(250,145,24,0.3)', color: '#fa9118', label: 'Pilot' },
      admin: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', color: '#ef4444', label: 'Admin' },
    };
    const c = colors[role] || colors.pet_owner;
    return <span style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.color, padding: '0.1rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>{c.label}</span>;
  };

  const statusBadge = (status) => {
    const colors = {
      submitted: '#3b82f6', notifying: '#f59e0b', matched: '#10b981',
      searching: '#8b5cf6', found: '#10b981', completed: '#6b7280',
      reviewed: '#6b7280', cancelled: '#ef4444',
    };
    const color = colors[status] || '#6b7280';
    return <span style={{ background: `${color}20`, border: `1px solid ${color}40`, color, padding: '0.1rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'capitalize' }}>{status}</span>;
  };

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
        <div className="tabs" style={{ overflowX: 'auto', flexWrap: 'nowrap' }}>
          {[
            { id: 'overview', label: 'Overview', icon: <FiActivity size={12} /> },
            { id: 'verifications', label: 'Verifications', icon: <FiShield size={12} />, badge: verifications.length },
            { id: 'users', label: 'Users', icon: <FiUsers size={12} /> },
            { id: 'cases', label: 'Cases', icon: <FiRadio size={12} /> },
            { id: 'broadcast', label: 'Broadcast', icon: <FiSend size={12} /> },
          ].map(tab => (
            <button key={tab.id} className={`tab ${activeTab === tab.id ? 'active' : ''}`} onClick={() => handleTabChange(tab.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap' }}>
              {tab.icon} {tab.label}
              {tab.badge > 0 && (
                <span style={{ marginLeft: '0.3rem', background: 'var(--danger)', color: 'white', fontSize: '0.6rem', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 700 }}>{tab.badge}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div style={{ padding: '0 1rem 1rem' }}>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="fade-in">
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
            <div className="card">
              <div className="card-header"><FiActivity size={14} /> System Status</div>
              <div style={{ padding: '1rem' }}>
                {[
                  { label: 'Mode', value: 'Production', color: null },
                  { label: 'Database', value: 'PostgreSQL Connected', color: 'var(--success)' },
                  { label: 'WP Pilot Sync', value: 'Active (25 pilots)', color: 'var(--success)' },
                  { label: 'Email', value: 'SMTP Active', color: 'var(--success)' },
                  { label: 'App URL', value: window.location.hostname, color: 'var(--primary)' },
                ].map((row, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: i < 4 ? '1px solid var(--border-subtle)' : 'none' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{row.label}</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: row.color || 'var(--text-primary)' }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VERIFICATIONS TAB */}
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
                        <button onClick={() => handleReview(v.id, 'approved')} className="btn btn-primary btn-sm" style={{ flex: 1 }} disabled={reviewing[v.id]}>
                          <FiCheck size={14} /> {reviewing[v.id] ? 'Processing...' : 'Approve'}
                        </button>
                        <button onClick={() => handleReview(v.id, 'rejected')} className="btn btn-danger btn-sm" style={{ flex: 1, background: 'var(--danger)', borderColor: 'var(--danger)', color: 'white' }} disabled={reviewing[v.id]}>
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

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div className="fade-in">
            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ position: 'relative' }}>
                <FiSearch size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input className="form-input" style={{ paddingLeft: '2.25rem' }} placeholder="Search by name, email, or role..." value={userFilter} onChange={e => setUserFilter(e.target.value)} />
              </div>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
            </div>
            {filteredUsers.length === 0 ? (
              <div className="card"><div className="empty-state"><div className="icon">👤</div><h3>No users found</h3></div></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {filteredUsers.map(u => (
                  <div key={u.id} className="card" style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--primary-bg)', border: '1px solid rgba(4,107,210,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 700, fontSize: '0.8rem', fontFamily: 'var(--font-display)' }}>
                          {u.first_name?.[0]}{u.last_name?.[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{u.first_name} {u.last_name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {u.email_verified && (
                          <span style={{ color: 'var(--success)', fontSize: '0.7rem', fontWeight: 700 }}>✓</span>
                        )}
                        {roleBadge(u.role)}
                        <button
                          onClick={async () => {
                            if (confirm(`Delete ${u.first_name} ${u.last_name} (${u.email})? This cannot be undone.`)) {
                              try {
                                await adminApi.deleteUser(u.id);
                                setUsers(prev => prev.filter(x => x.id !== u.id));
                              } catch (err) {
                                alert(err.response?.data?.error || 'Failed to delete user');
                              }
                            }
                          }}
                          style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.2rem', opacity: 0.6 }}
                          title="Delete user"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.4rem', fontFamily: 'var(--font-mono)' }}>
                      Joined {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'Unknown'}
                      {u.phone && <span style={{ marginLeft: '0.75rem' }}>📞 {u.phone}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CASES TAB */}
        {activeTab === 'cases' && (
          <div className="fade-in">
            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ position: 'relative' }}>
                <FiSearch size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input className="form-input" style={{ paddingLeft: '2.25rem' }} placeholder="Search by pet name, status, or owner..." value={caseFilter} onChange={e => setCaseFilter(e.target.value)} />
              </div>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              {filteredCases.length} case{filteredCases.length !== 1 ? 's' : ''}
            </div>
            {filteredCases.length === 0 ? (
              <div className="card"><div className="empty-state"><div className="icon">📋</div><h3>No cases found</h3></div></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {filteredCases.map(c => (
                  <div key={c.id} className="card" style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ fontSize: '1.3rem' }}>
                          {c.pet_type === 'dog' ? '🐕' : c.pet_type === 'cat' ? '🐱' : '🐾'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{c.pet_name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Owner: {c.owner_first} {c.owner_last}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {statusBadge(c.status)}
                        {!c.pilot_id && ['submitted', 'notifying'].includes(c.status) && (
                          <button onClick={() => setSelectedCase(selectedCase === c.id ? null : c.id)} style={{
                            background: 'var(--accent-bg)', border: '1px solid rgba(250,145,24,0.3)',
                            color: 'var(--accent)', fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.5rem',
                            borderRadius: '4px', cursor: 'pointer', fontFamily: 'var(--font-body)',
                          }}>
                            <FiUserCheck size={10} /> Assign
                          </button>
                        )}
                      </div>
                    </div>
                    {selectedCase === c.id && (
                      <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Enter pilot email to assign:</div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <input id={`assign-${c.id}`} className="form-input" style={{ flex: 1 }} placeholder="pilot@email.com" />
                          <button onClick={() => handleAssignPilot(c.id, document.getElementById(`assign-${c.id}`)?.value)} className="btn btn-primary btn-sm" disabled={assigningPilot}>
                            <FiUserCheck size={14} /> {assigningPilot ? '...' : 'Assign'}
                          </button>
                        </div>
                      </div>
                    )}
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.3rem', display: 'flex', gap: '1rem', fontFamily: 'var(--font-mono)' }}>
                      <span>{new Date(c.created_at).toLocaleDateString()}</span>
                      <span>{c.pet_breed || c.pet_type}</span>
                      {c.pilot_id && <span style={{ color: 'var(--success)' }}>Pilot assigned</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* BROADCAST TAB */}
        {activeTab === 'broadcast' && (
          <div className="fade-in">
            <div className="card">
              <div style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <FiSend size={16} style={{ color: 'var(--accent)' }} />
                  <div>
                    <div style={{ fontWeight: 700 }}>Send Broadcast Email</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sends to all registered users from support@lostpetdronerecovery.com</div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Message</label>
                  <textarea className="form-textarea" value={broadcastMsg} onChange={e => setBroadcastMsg(e.target.value)} placeholder="Important update, new feature announcement, etc..." rows={4} />
                </div>

                <div style={{ background: 'var(--accent-bg)', border: '1px solid rgba(250,145,24,0.2)', padding: '0.75rem', borderRadius: '8px', marginBottom: '0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <FiAlertCircle size={14} style={{ verticalAlign: 'middle', marginRight: '0.4rem', color: 'var(--accent)' }} />
                  Use sparingly. This emails every registered user.
                </div>

                <button onClick={handleBroadcast} className="btn btn-accent" style={{ width: '100%' }} disabled={!broadcastMsg.trim() || broadcastSending}>
                  <FiSend size={16} /> {broadcastSending ? 'Sending...' : 'Send Broadcast'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

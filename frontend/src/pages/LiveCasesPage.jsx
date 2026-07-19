import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiRadio, FiMapPin, FiClock, FiEye, FiRefreshCw } from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner';

export default function LiveCasesPage() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { loadCases(); }, []);

  const loadCases = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/content/live-cases');
      const data = await res.json();
      setCases(data.cases || []);
    } catch (err) {
      setError('Failed to load live cases');
    } finally {
      setLoading(false);
    }
  };

  const petEmoji = (type) => {
    switch (type) {
      case 'dog': return '🐕';
      case 'cat': return '🐱';
      case 'horse': return '🐴';
      case 'bird': return '🐦';
      case 'rabbit': return '🐰';
      default: return '🐾';
    }
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  };

  if (loading) return <LoadingSpinner text="Fetching live cases from LPDR..." />;

  return (
    <div>
      {/* Header */}
      <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)', padding: '1.25rem 1rem' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', marginBottom: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FiRadio size={18} style={{ color: 'var(--danger)' }} /> LIVE FEED
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
              {cases.length} cases from lostpetdronerecovery.com
            </p>
          </div>
          <button onClick={loadCases} className="btn btn-secondary btn-sm" style={{ gap: '0.3rem' }}>
            <FiRefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {error ? (
        <div className="container" style={{ padding: '2rem 1rem' }}>
          <div className="card" style={{ borderLeft: '3px solid var(--danger)' }}>
            <div style={{ padding: '1.25rem' }}>
              <p style={{ color: 'var(--danger)', marginBottom: '0.5rem' }}>{error}</p>
              <button onClick={loadCases} className="btn btn-primary btn-sm">Try Again</button>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ padding: '0.75rem 1rem' }}>
          {cases.length === 0 ? (
            <div className="empty-state">
              <div className="icon">📡</div>
              <h3>No live cases</h3>
              <p>Check back soon for new submissions.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {cases.map((c, i) => (
                <div key={c.id} className="card card-interactive fade-in">
                  <div style={{ padding: '0.85rem 1rem', display: 'flex', gap: '0.75rem' }}>
                    {/* Photo or emoji */}
                    {c.photo_thumb ? (
                      <div style={{ width: '56px', height: '56px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, border: '1px solid var(--border-subtle)' }}>
                        <img src={c.photo_thumb} alt={c.pet_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ) : (
                      <div style={{ width: '56px', height: '56px', borderRadius: '8px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
                        {petEmoji(c.pet_type)}
                      </div>
                    )}

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.2rem' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                          {c.pet_name}
                        </div>
                        <span className="badge badge-red" style={{ flexShrink: 0 }}>LOST</span>
                      </div>
                      
                      {c.pet_breed && c.pet_breed !== c.pet_type && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '0.15rem' }}>
                          {c.pet_breed}
                        </div>
                      )}
                      
                      {c.last_seen_address && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <FiMapPin size={11} /> {c.last_seen_address}
                        </div>
                      )}
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.3rem' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          Owner: {c.owner_name || 'Unknown'}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <FiClock size={10} /> {timeAgo(c.date)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

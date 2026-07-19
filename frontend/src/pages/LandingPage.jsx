import { Link } from 'react-router-dom';
import { FiSearch, FiMapPin, FiUsers, FiHeart, FiChevronRight, FiRadio } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';

export default function LandingPage() {
  const { isAuthenticated, isPetOwner } = useAuth();
  const [liveStats, setLiveStats] = useState(null);
  const [liveCount, setLiveCount] = useState(null);

  useEffect(() => {
    // Fetch live stats and case count from the website
    fetch('/api/content/stats').then(r => r.json()).then(d => setLiveStats(d)).catch(() => {});
    fetch('/api/content/live-cases').then(r => r.json()).then(d => setLiveCount(d.total || 0)).catch(() => {});
  }, []);

  const stats = [
    { value: liveStats?.casesReceived || '130+', label: 'Cases', icon: '📋' },
    { value: liveStats?.activePilots || '50+', label: 'Pilots', icon: '🛸' },
    { value: liveStats?.recoveryRate || '85%', label: 'Recovery', icon: '✓' },
    { value: liveStats?.avgResponseTime || '48hr', label: 'Avg Time', icon: '⏱' },
  ];

  const steps = [
    { num: 1, title: 'Submit Info', desc: 'Tell us what happened and where. The more detail, the faster we act.' },
    { num: 2, title: 'Get Matched', desc: 'Connected with the nearest thermal drone pilot ready to assist.' },
    { num: 3, title: 'Search Begins', desc: 'Pilot deploys with thermal tech, covering ground fast.' },
    { num: 4, title: 'Reunite', desc: 'The moment we live for — your pet back home.' },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <img src="/lpdr-logo.png" alt="LPDR" style={{ height: '72px', margin: '0 auto 1.25rem', display: 'block', filter: 'drop-shadow(0 0 20px rgba(4,107,210,0.4))' }} />
          <h1>Lost Pet?<br />Eyes In The Sky</h1>
          <p>Connect instantly with thermal drone pilots in your area.</p>
          <div className="hero-buttons">
            {isAuthenticated && isPetOwner ? (
              <Link to="/cases/new" className="btn btn-accent btn-lg">
                <FiSearch size={18} />
                Report Lost Pet
              </Link>
            ) : (
              <Link to="/register" className="btn btn-accent btn-lg">
                <FiSearch size={18} />
                Help Me Find My Pet!
              </Link>
            )}
            <Link to="/map" className="btn btn-outline btn-lg">
              <FiMapPin size={18} />
              Find a Pilot
            </Link>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginTop: '2rem' }}>
            {stats.map((s, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '0.75rem', background: 'rgba(4,107,210,0.06)', borderRadius: '8px', border: '1px solid rgba(4,107,210,0.12)' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)' }}>{s.value}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Live Feed Link */}
          {liveCount > 0 && (
            <Link to="/live" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', color: 'var(--danger)', fontWeight: 600, fontSize: '0.85rem', textDecoration: 'none' }}>
              <FiRadio size={14} /> {liveCount} active cases on live feed →
            </Link>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="section">
        <div className="container">
          <div className="section-title">
            <FiRadio size={14} />
            How It Works
          </div>
          <div className="steps">
            {steps.map((step, i) => (
              <div key={i} className="step fade-in">
                <div className="step-number">{step.num}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Map Preview */}
      <section className="section">
        <div className="container">
          <div className="section-title">
            <FiMapPin size={14} />
            Pilots Near You
          </div>
          
          <div className="card" style={{ height: '300px', background: 'var(--bg-secondary)', position: 'relative', overflow: 'hidden' }}>
            {/* Grid */}
            <div style={{ position: 'absolute', inset: 0, opacity: 0.15 }}>
              {[10, 20, 30, 40, 50, 60, 70, 80, 90].map((p, i) => (
                <div key={`h${i}`} style={{ position: 'absolute', left: 0, right: 0, top: `${p}%`, height: '1px', background: 'var(--primary)' }} />
              ))}
              {[10, 20, 30, 40, 50, 60, 70, 80, 90].map((p, i) => (
                <div key={`v${i}`} style={{ position: 'absolute', top: 0, bottom: 0, left: `${p}%`, width: '1px', background: 'var(--primary)' }} />
              ))}
            </div>
            
            {/* Pilot dots */}
            {[
              { left: '25%', top: '30%', active: true },
              { left: '55%', top: '45%', active: true },
              { left: '70%', top: '25%', active: false },
              { left: '40%', top: '65%', active: true },
              { left: '80%', top: '60%', active: false },
              { left: '15%', top: '70%', active: true },
            ].map((dot, i) => (
              <div key={i} style={{
                position: 'absolute', left: dot.left, top: dot.top,
                width: '14px', height: '14px', borderRadius: '50%',
                background: dot.active ? 'var(--primary)' : 'var(--text-muted)',
                boxShadow: dot.active ? '0 0 12px var(--primary-glow)' : 'none',
                transform: 'translate(-50%, -50%)',
                zIndex: 2,
              }} />
            ))}
            
            {/* Legend */}
            <div style={{ position: 'absolute', bottom: '0.75rem', left: '0.75rem', background: 'var(--bg-card)', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-subtle)', fontSize: '0.75rem', zIndex: 3 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                <span className="status-dot online" /> <span style={{ color: 'var(--text-secondary)' }}>Available</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span className="status-dot offline" /> <span style={{ color: 'var(--text-secondary)' }}>Offline</span>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <Link to={isAuthenticated ? '/map' : '/register'} className="btn btn-primary">
              <FiMapPin size={16} />
              {isAuthenticated ? 'View Full Map' : 'Get Started'}
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section">
        <div className="container">
          <div className="section-title">
            <FiHeart size={14} />
            Reunited Families
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { name: 'Amelia C.', role: 'Cat Owner', text: 'Within hours of reaching out, a drone pilot was in the air — and we found her hiding under a shed. Absolutely incredible.' },
              { name: 'Jeff U.', role: 'Dog Owner', text: 'I submitted my info at midnight — by the next morning, a pilot had already started searching. Reunited later that day.' },
              { name: 'Holly D.', role: 'Horse Owner', text: 'A drone team found her within minutes and even helped guide her back. Total lifesavers.' },
            ].map((t, i) => (
              <div key={i} className="card fade-in" style={{ borderLeft: '2px solid var(--primary)' }}>
                <div className="card-body" style={{ padding: '1rem 1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'var(--primary-bg)', border: '1px solid rgba(4,107,210,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 700, fontSize: '0.75rem', fontFamily: 'var(--font-display)' }}>
                      {t.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{t.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t.role}</div>
                    </div>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5 }}>"{t.text}"</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <div className="container">
          <div className="card" style={{ background: 'linear-gradient(135deg, var(--bg-elevated) 0%, var(--bg-card) 100%)', borderLeft: '3px solid var(--accent)' }}>
            <div className="card-body" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', marginBottom: '0.5rem' }}>Join The Mission</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                Drone pilots nationwide are stepping up. There's a role for everyone.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link to="/register?role=drone_pilot" className="btn btn-accent">
                  <FiUsers size={16} />
                  Sign Up As Pilot
                </Link>
                <Link to="/register" className="btn btn-outline">
                  <FiHeart size={16} />
                  Pet Owner
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

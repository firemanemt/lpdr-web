import { Link, useNavigate } from 'react-router-dom';
import { FiSearch, FiMapPin, FiUsers, FiHeart, FiChevronRight, FiRadio } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { contentApi } from '../services/api';

// WP website pilot icon for mini-map (orange circle)
const miniPilotIcon = L.divIcon({
  className: 'mini-wp-pilot-icon',
  html: `<div style="
    width: 24px; height: 24px; border-radius: 50%;
    background: #fa9118; border: 2px solid #d97a0a;
    box-shadow: 0 0 10px rgba(250,145,24,0.5);
    display: flex; align-items: center; justify-content: center;
    color: white; font-weight: 700; font-size: 0.55rem;
  ">🐾</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -14],
});

function LandingMap({ pilots }) {
  if (!pilots.length) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        Loading pilots...
      </div>
    );
  }
  return (
    <>
      <MapContainer
        center={[39.8283, -98.5795]}
        zoom={4}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        attributionControl={false}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        touchZoom={false}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
        {pilots.map(pilot => (
          <Marker key={pilot.id} position={[parseFloat(pilot.lat), parseFloat(pilot.lng)]} icon={miniPilotIcon}>
            <Popup maxWidth={220} minWidth={180}>
              <div style={{ fontFamily: "'Cabin Condensed', sans-serif", padding: '0.15rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827', marginBottom: '0.2rem' }}>🐾 {pilot.businessName || pilot.name}</div>
                {(pilot.businessName && pilot.name !== pilot.businessName) && (
                  <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{pilot.name}</div>
                )}
                {pilot.city && pilot.state && (
                  <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{pilot.city}, {pilot.state}</div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      <style>{`
        .mini-wp-pilot-icon { background: none !important; border: none !important; }
        .leaflet-container { background: #060a13 !important; }
        .leaflet-popup-content-wrapper { background: #111a2e !important; color: #f1f5f9 !important; border-radius: 10px !important; border: 1px solid #253352 !important; }
        .leaflet-popup-tip { background: #111a2e !important; }
      `}</style>
    </>
  );
}

export default function LandingPage() {
  const { isAuthenticated, isPetOwner } = useAuth();
  const [liveStats, setLiveStats] = useState(null);
  const [liveCount, setLiveCount] = useState(null);
  const [recentCases, setRecentCases] = useState([]);
  const [landingPilots, setLandingPilots] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch live stats and case count from the website
    fetch('/api/content/stats').then(r => r.json()).then(d => setLiveStats(d)).catch(() => {});
    fetch('/api/content/live-cases').then(r => r.json()).then(d => {
      setLiveCount(d.total || 0);
      setRecentCases((d.cases || []).slice(0, 3));
    }).catch(() => {});
    // Fetch real WP pilots for the mini map
    contentApi.getWPPilots().then(res => {
      const pilots = (res.data.pilots || []).filter(p => p.lat && p.lng);
      setLandingPilots(pilots);
    }).catch(() => {});
  }, []);

  const stats = [
    { value: liveStats?.casesReceived || '501', label: 'Cases', icon: '📋', live: !!liveStats?.casesReceived },
    { value: liveStats?.activePilots || '25', label: 'Pilots', icon: '🛸' },
    { value: liveStats?.statesCovered || '15', label: 'States', icon: '🇺🇸' },
    { value: '24/7', label: 'Available', icon: '⚡' },
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
              <div key={i} style={{ textAlign: 'center', padding: '0.75rem', background: i === 0 && s.live ? 'rgba(4,107,210,0.12)' : 'rgba(4,107,210,0.06)', borderRadius: '8px', border: i === 0 && s.live ? '1px solid rgba(4,107,210,0.25)' : '1px solid rgba(4,107,210,0.12)', position: 'relative' }}>
                {i === 0 && s.live && (
                  <span style={{ position: 'absolute', top: '0.4rem', right: '0.4rem', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 8px var(--success-glow)', animation: 'pulse-green 2s ease-in-out infinite' }} />
                )}
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.3rem', fontWeight: 700, color: i === 0 ? 'var(--primary)' : 'var(--text-primary)' }}>{s.value}</div>
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

      {/* Map Preview — Real Leaflet map with WP pilots */}
      <section className="section">
        <div className="container">
          <div className="section-title">
            <FiMapPin size={14} />
            Pilots Near You
          </div>
          
          <div className="card" style={{ height: '300px', background: 'var(--bg-secondary)', position: 'relative', overflow: 'hidden', padding: 0 }}>
            <LandingMap pilots={landingPilots} />
          </div>

          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <Link to={isAuthenticated ? '/map' : '/register'} className="btn btn-primary">
              <FiMapPin size={16} />
              {isAuthenticated ? 'View Full Map' : 'Get Started'}
            </Link>
          </div>
        </div>
      </section>

      {/* Recent Lost Pets - LIVE from website */}
      {recentCases.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-title">
              <FiRadio size={14} style={{ color: 'var(--danger)' }} />
              <span style={{ color: 'var(--danger)' }}>Live — Recently Reported Lost Pets</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {recentCases.map((c, i) => (
                <div key={c.id} className="card card-interactive fade-in" style={{ cursor: 'pointer', borderLeft: '3px solid var(--danger)' }} onClick={() => navigate(`/live/${c.id}`)}>
                  <div style={{ padding: '0.75rem 1rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    {c.photo_thumb ? (
                      <div style={{ width: '48px', height: '48px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, border: '1px solid var(--border-subtle)' }}>
                        <img src={c.photo_thumb} alt={c.pet_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ) : (
                      <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>
                        {c.pet_type === 'dog' ? '🐕' : c.pet_type === 'cat' ? '🐱' : '🐾'}
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{c.pet_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <FiMapPin size={11} /> {c.last_seen_address || 'Location not specified'}
                      </div>
                    </div>
                    <FiChevronRight size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <Link to="/live" className="btn btn-secondary btn-sm">
                <FiRadio size={14} /> View All Live Cases
              </Link>
            </div>
          </div>
        </section>
      )}

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

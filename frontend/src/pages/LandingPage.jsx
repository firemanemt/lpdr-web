import { Link } from 'react-router-dom';
import { FiSearch, FiMapPin, FiUsers, FiHeart } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';

export default function LandingPage() {
  const { isAuthenticated, isPetOwner } = useAuth();

  const stats = [
    { value: '260+', label: 'Cases Received' },
    { value: '50+', label: 'Active Pilots' },
    { value: '85%', label: 'Recovery Rate' },
    { value: '48hrs', label: 'Avg Response Time' },
  ];

  const steps = [
    { num: 1, title: 'Submit Info', desc: 'Lost your pet? Start here. Tell us what happened, where it happened, and any details that could help.' },
    { num: 2, title: 'Get Matched', desc: 'We\'ll connect you with the nearest available thermal drone pilot ready to assist in your area.' },
    { num: 3, title: 'Search Begins', desc: 'Your pilot hits the sky, using thermal tech and search strategies to cover ground quickly.' },
    { num: 4, title: 'Reunite', desc: 'The moment we live for — getting your furry friend back home. This is why we do it.' },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="hero">
        <h1>Lost Pet? We've Got<br />Eyes In The Sky</h1>
        <p>Connect instantly with drone pilots in your area who are ready to help find your lost pet using thermal technology.</p>
        <div className="hero-buttons">
          {isAuthenticated && isPetOwner ? (
            <Link to="/cases/new" className="btn btn-accent btn-lg">
              <FiSearch size={20} />
              Report a Lost Pet
            </Link>
          ) : (
            <Link to="/register" className="btn btn-accent btn-lg">
              <FiSearch size={20} />
              Help Me Find My Pet!
            </Link>
          )}
          <Link to="/map" className="btn btn-lg" style={{
            background: 'rgba(255,255,255,0.15)',
            color: 'white',
            border: '2px solid rgba(255,255,255,0.3)',
          }}>
            <FiMapPin size={20} />
            Find a Drone Pilot
          </Link>
        </div>

        <div style={{ marginTop: '3rem' }}>
          <p style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '1rem' }}>
            Trusted by hundreds of pet owners nationwide
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
            {stats.map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 800 }}>{s.value}</div>
                <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section">
        <div className="container">
          <h2 style={{ textAlign: 'center', fontSize: '2rem', marginBottom: '0.5rem' }}>How We Help You</h2>
          <p style={{ textAlign: 'center', color: 'var(--gray-500)', maxWidth: '600px', margin: '0 auto 3rem', fontSize: '1.05rem' }}>
            When your pet goes missing, every second counts. That's why Lost Pet Drone Recovery makes it simple.
          </p>
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

      {/* Interactive Map Preview */}
      <section className="section" style={{ background: 'var(--gray-100)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Our Interactive Map Shows Pilots Near You</h2>
            <p style={{ color: 'var(--gray-500)', maxWidth: '600px', margin: '0 auto' }}>
              Need help fast? Our live interactive map shows trained drone pilots ready to respond in your area.
            </p>
          </div>
          
          <div className="card" style={{ height: '400px', background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
            {/* Simplified map illustration */}
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              {/* Grid lines */}
              {[20, 40, 60, 80].map((p, i) => (
                <div key={`h${i}`} style={{ position: 'absolute', left: 0, right: 0, top: `${p}%`, height: '1px', background: 'rgba(5, 150, 105, 0.2)' }} />
              ))}
              {[20, 40, 60, 80].map((p, i) => (
                <div key={`v${i}`} style={{ position: 'absolute', top: 0, bottom: 0, left: `${p}%`, width: '1px', background: 'rgba(5, 150, 105, 0.2)' }} />
              ))}
              
              {/* Dots representing pilots */}
              {[
                { left: '25%', top: '30%', pulse: true },
                { left: '55%', top: '45%', pulse: true },
                { left: '70%', top: '25%', pulse: false },
                { left: '40%', top: '65%', pulse: true },
                { left: '80%', top: '60%', pulse: false },
                { left: '15%', top: '70%', pulse: true },
              ].map((dot, i) => (
                <div key={i} style={{
                  position: 'absolute',
                  left: dot.left,
                  top: dot.top,
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: dot.pulse ? '#059669' : '#9ca3af',
                  boxShadow: dot.pulse ? '0 0 0 4px rgba(5, 150, 105, 0.2)' : 'none',
                  transform: 'translate(-50%, -50%)',
                  animation: dot.pulse ? 'pulse 2s ease-in-out infinite' : 'none',
                  cursor: 'pointer',
                  zIndex: 2,
                }} />
              ))}
              
              {/* Labels */}
              <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', background: 'white', padding: '0.75rem 1rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#059669' }} />
                  <span>Available Pilot</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#9ca3af' }} />
                  <span>Offline</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <Link to={isAuthenticated ? '/map' : '/register'} className="btn btn-primary btn-lg">
              <FiMapPin size={20} />
              {isAuthenticated ? 'View Full Map' : 'Submit a Lost Pet Case'}
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section">
        <div className="container">
          <h2 style={{ textAlign: 'center', fontSize: '2rem', marginBottom: '0.5rem' }}>Recently Reunited Families</h2>
          <p style={{ textAlign: 'center', color: 'var(--gray-500)', marginBottom: '3rem' }}>
            Behind every case is a real story, a scared pet, a worried family, and a reunion.
          </p>

          <div className="grid-3">
            {[
              { name: 'Amelia C.', role: 'Cat Owner', text: 'I thought I\'d never see my cat again. Within hours of reaching out, a drone pilot was here, in the air — and we found her hiding under a shed. Absolutely incredible team and organization.' },
              { name: 'Jeff U.', role: 'Dog Owner', text: 'Our dog ran off during a fireworks show. I submitted my info at midnight — by the next morning, a pilot had already started searching. We were reunited later that day. I still can\'t believe it.' },
              { name: 'Holly D.', role: 'Horse Owner', text: 'One of our horses broke through the fence and vanished into the woods. A drone team showed up the next morning, found her within minutes, and even helped guide her back. Total lifesavers.' },
            ].map((t, i) => (
              <div key={i} className="card fade-in">
                <div className="card-body">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div className="user-avatar" style={{ width: '48px', height: '48px', fontSize: '1.1rem', background: 'var(--primary-bg)', color: 'var(--primary)' }}>
                      {t.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{t.name}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>{t.role}</div>
                    </div>
                  </div>
                  <p style={{ color: 'var(--gray-600)', lineHeight: 1.6, fontSize: '0.95rem' }}>"{t.text}"</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section" style={{
        background: 'linear-gradient(135deg, var(--primary) 0%, #0d9488 100%)',
        color: 'white',
        textAlign: 'center',
      }}>
        <div className="container">
          <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Join Our Nationwide Movement</h2>
          <p style={{ maxWidth: '600px', margin: '0 auto 2rem', opacity: 0.9, fontSize: '1.1rem' }}>
            So many drone pilots across the country are stepping up to help families find their lost pets. 
            There's a role for everyone in this mission.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register?role=drone_pilot" className="btn btn-lg" style={{ background: 'white', color: 'var(--primary)', fontWeight: 700 }}>
              <FiUsers size={20} />
              Sign Up As a Pilot
            </Link>
            <Link to="/register" className="btn btn-lg" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '2px solid rgba(255,255,255,0.3)' }}>
              <FiHeart size={20} />
              Register as Pet Owner
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

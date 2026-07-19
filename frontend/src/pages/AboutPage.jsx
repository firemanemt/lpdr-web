import { Link } from 'react-router-dom';
import { FiTarget, FiUsers, FiHeart, FiCamera } from 'react-icons/fi';

export default function AboutPage() {
  return (
    <div>
      {/* Header */}
      <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)', padding: '1.5rem 1rem' }}>
        <div className="container">
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '0.25rem' }}>About LPDR</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>From the front lines to the sky — bringing pets home</p>
        </div>
      </div>

      <section className="section">
        <div className="container" style={{ maxWidth: '800px' }}>
          {/* Story */}
          <div style={{ marginBottom: '2rem' }}>
            <div className="section-title"><FiTarget size={14} /> Our Story</div>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.95rem', marginBottom: '0.75rem' }}>
              Lost Pet Drone Recovery was founded by a firefighter, drone pilots, and lifelong animal lovers who saw a heartbreaking pattern: families losing pets and running out of options. With a background in emergency response and search and rescue, they realized that the same drones used to save lives could also bring pets back home.
            </p>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.95rem' }}>
              What started as one search in one town has now grown into a nationwide movement — built by people who know what it means to show up when it matters most.
            </p>
          </div>

          {/* Values */}
          <div className="section-title"><FiHeart size={14} /> What Drives Us</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '2rem' }}>
            {[
              { icon: '🚒', title: 'Search & Rescue', desc: "We started from the field. As firefighters, first responders, and rescue volunteers, we've spent years running toward emergencies. Now we're running toward lost pets." },
              { icon: '🔥', title: 'Thermal Imaging', desc: 'We saw firsthand how powerful thermal drones could be in real rescues. So we took that same tech and pointed it toward the families who needed it most.' },
              { icon: '🐾', title: 'Pet Owners', desc: "We've lost pets too. We know that pit in your stomach, the sleepless nights. That's why we built something better." },
              { icon: '🛸', title: 'Certified Pilots', desc: "We aren't just hobbyists — we're trained, certified, with hundreds of hours of airtime. Now we're giving other pilots a way to turn skills into real-world rescues." },
            ].map((v, i) => (
              <div key={i} className="card fade-in" style={{ padding: '1.25rem' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{v.icon}</div>
                <h3 style={{ fontSize: '0.95rem', marginBottom: '0.4rem' }}>{v.title}</h3>
                <p style={{ color: 'var(--text-muted)', lineHeight: 1.5, fontSize: '0.85rem' }}>{v.desc}</p>
              </div>
            ))}
          </div>

          {/* Mission */}
          <div className="card" style={{ borderLeft: '3px solid var(--primary)', marginBottom: '2rem' }}>
            <div style={{ padding: '1.5rem', textAlign: 'center' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '0.75rem', color: 'var(--primary)', fontSize: '1.1rem' }}>Our Mission</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.95rem', maxWidth: '500px', margin: '0 auto' }}>
                Lost Pet Drone Recovery was born from a simple question: "What if we could do more?" 
                We combined our backgrounds in emergency response, drone operations, and animal rescue 
                to create a nationwide support system for families in crisis. This isn't just a platform — it's a calling.
              </p>
            </div>
          </div>

          {/* CTA */}
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>Ready to join the movement?</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/register" className="btn btn-primary">Sign Up as Pet Owner</Link>
              <Link to="/register?role=drone_pilot" className="btn btn-outline">Become a Pilot</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

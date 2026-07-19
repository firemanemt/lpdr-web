import { Link } from 'react-router-dom';
import { FiTarget, FiUsers, FiHeart, FiCamera } from 'react-icons/fi';

export default function AboutPage() {
  return (
    <div>
      <section className="page-header">
        <div className="container">
          <h1>About Lost Pet Drone Recovery</h1>
          <p>From the front lines to the sky — bringing pets home</p>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: '800px' }}>
          {/* Story */}
          <div style={{ marginBottom: '3rem' }}>
            <h2 style={{ marginBottom: '1rem' }}>Our Story</h2>
            <p style={{ color: 'var(--gray-600)', lineHeight: 1.8, fontSize: '1.05rem', marginBottom: '1rem' }}>
              Lost Pet Drone Recovery was founded by a firefighter, drone pilots, and lifelong animal lovers who saw a heartbreaking pattern: families losing pets and running out of options. With a background in emergency response and search and rescue, they realized that the same drones used to save lives could also bring pets back home.
            </p>
            <p style={{ color: 'var(--gray-600)', lineHeight: 1.8, fontSize: '1.05rem' }}>
              What started as one search in one town has now grown into a nationwide movement — built by people who know what it means to show up when it matters most.
            </p>
          </div>

          {/* Values */}
          <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>What Drives Us</h2>
          <div className="grid-2" style={{ marginBottom: '3rem' }}>
            <div className="card fade-in">
              <div className="card-body" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🚒</div>
                <h3 style={{ marginBottom: '0.75rem' }}>Search & Rescue</h3>
                <p style={{ color: 'var(--gray-500)', lineHeight: 1.6 }}>
                  We didn't start this from a boardroom — we started it from the field. As firefighters, first responders, and rescue volunteers, we've spent years running toward emergencies. Now we're running toward lost pets.
                </p>
              </div>
            </div>
            <div className="card fade-in">
              <div className="card-body" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔥</div>
                <h3 style={{ marginBottom: '0.75rem' }}>Thermal Imaging</h3>
                <p style={{ color: 'var(--gray-500)', lineHeight: 1.6 }}>
                  We saw firsthand how powerful thermal drones could be, not just in training, but in real rescues. So we took that same tech and pointed it toward the families who needed it most.
                </p>
              </div>
            </div>
            <div className="card fade-in">
              <div className="card-body" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🐾</div>
                <h3 style={{ marginBottom: '0.75rem' }}>Experienced Pet Owners</h3>
                <p style={{ color: 'var(--gray-500)', lineHeight: 1.6 }}>
                  We've lost pets too. We know that pit in your stomach, the sleepless nights, and the desperate feeling of not knowing where to turn. That's why we built something better.
                </p>
              </div>
            </div>
            <div className="card fade-in">
              <div className="card-body" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🛸</div>
                <h3 style={{ marginBottom: '0.75rem' }}>Certified Drone Pilots</h3>
                <p style={{ color: 'var(--gray-500)', lineHeight: 1.6 }}>
                  We aren't just drone hobbyists — we're trained, certified, and have hundreds of hours of airtime. Now we're giving other pilots a way to turn their skills into real-world rescues that matter.
                </p>
              </div>
            </div>
          </div>

          {/* Mission */}
          <div style={{
            background: 'var(--primary-bg)',
            padding: '2.5rem',
            borderRadius: '16px',
            textAlign: 'center',
            marginBottom: '3rem',
          }}>
            <h2 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Our Mission</h2>
            <p style={{ color: 'var(--gray-700)', lineHeight: 1.8, fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
              Lost Pet Drone Recovery was born from a simple question: "What if we could do more?" 
              We combined our backgrounds in emergency response, drone operations, and animal rescue 
              to create a nationwide support system for families in crisis. This isn't just a platform 
              — it's a calling.
            </p>
          </div>

          {/* CTA */}
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ marginBottom: '1rem' }}>Ready to join the movement?</h3>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/register" className="btn btn-primary btn-lg">Sign Up as Pet Owner</Link>
              <Link to="/register?role=drone_pilot" className="btn btn-outline btn-lg">Become a Pilot</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

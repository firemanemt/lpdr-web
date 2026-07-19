import { Link } from 'react-router-dom';
import { FiHome, FiArrowLeft } from 'react-icons/fi';

export default function NotFoundPage() {
  return (
    <div style={{ minHeight: 'calc(100vh - 120px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div style={{ textAlign: 'center', maxWidth: '320px' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📡</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>SIGNAL LOST</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <Link to="/" className="btn btn-primary">
            <FiHome size={16} /> Home
          </Link>
          <button onClick={() => window.history.back()} className="btn btn-secondary">
            <FiArrowLeft size={16} /> Back
          </button>
        </div>
      </div>
    </div>
  );
}

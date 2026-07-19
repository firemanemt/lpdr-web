import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiMapPin, FiClock, FiPhone, FiMail, FiAlertCircle, FiShare2, FiExternalLink } from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner';

export default function LiveCaseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCase();
  }, [id]);

  const loadCase = async () => {
    setLoading(true);
    try {
      // Fetch from WP API directly for full details
      const res = await fetch(`https://lostpetdronerecovery.com/wp-json/wp/v2/submit-a-new-case/${id.replace('wp-', '')}`);
      const data = await res.json();
      const acf = data.acf || {};
      const photo = acf.photo && typeof acf.photo === 'object' ? acf.photo : null;

      setCaseData({
        id: `wp-${data.id}`,
        wp_id: data.id,
        pet_name: acf.pet_name || 'Unknown',
        pet_type: normalizePetType(acf.pet_type),
        pet_breed: acf.pet_type || '',
        last_seen: acf.last_seen || '',
        owner_name: acf.pet_owner || '',
        email: acf.email_address || '',
        phone: acf.phone || '',
        street_address: acf.street_address || '',
        city: acf.city || '',
        state: acf.state || '',
        zip_code: acf.zip_code || '',
        description: acf.description || '',
        photo_url: photo?.sizes?.large || photo?.url || null,
        photo_full: photo?.url || null,
        date: data.date,
        status: acf.status || 'submitted',
        wp_link: data.link,
      });
    } catch (err) {
      console.error('Failed to load case:', err);
    } finally {
      setLoading(false);
    }
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const petEmoji = (type) => {
    switch (type) {
      case 'dog': return '🐕';
      case 'cat': return '🐱';
      case 'horse': return '🐴';
      case 'bird': return '🐦';
      default: return '🐾';
    }
  };

  const formatPhone = (phone) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) return `(${cleaned.slice(0,3)}) ${cleaned.slice(3,6)}-${cleaned.slice(6)}`;
    return phone;
  };

  if (loading) return <LoadingSpinner text="Loading case details..." />;

  if (!caseData) {
    return (
      <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Case not found</p>
        <button onClick={() => navigate('/live')} className="btn btn-primary btn-sm">
          <FiArrowLeft size={14} /> Back to Live Feed
        </button>
      </div>
    );
  }

  const fullAddress = [caseData.street_address, caseData.city, caseData.state, caseData.zip_code].filter(Boolean).join(', ');

  return (
    <div>
      {/* Top Bar */}
      <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button onClick={() => navigate('/live')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.25rem' }}>
          <FiArrowLeft size={20} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '1rem' }}>{caseData.pet_name}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Lost Pet Case #{caseData.wp_id}
          </div>
        </div>
        <span className="badge badge-red" style={{ fontSize: '0.7rem' }}>LOST</span>
      </div>

      {/* Photo */}
      {caseData.photo_url && (
        <div style={{ width: '100%', maxHeight: '300px', overflow: 'hidden', borderBottom: '1px solid var(--border-subtle)' }}>
          <img
            src={caseData.photo_url}
            alt={caseData.pet_name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>
      )}

      <div style={{ padding: '1rem' }}>
        {/* Pet Info Card */}
        <div className="card" style={{ marginBottom: '0.75rem' }}>
          <div style={{ padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {!caseData.photo_url && (
              <div style={{ width: '64px', height: '64px', borderRadius: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', flexShrink: 0 }}>
                {petEmoji(caseData.pet_type)}
              </div>
            )}
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.15rem' }}>{caseData.pet_name}</h2>
              {caseData.pet_breed && caseData.pet_breed.toLowerCase() !== caseData.pet_type && (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.15rem' }}>{caseData.pet_breed}</div>
              )}
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <FiClock size={11} /> Reported {timeAgo(caseData.date)}
              </div>
            </div>
          </div>
        </div>

        {/* Last Seen */}
        <div className="card" style={{ marginBottom: '0.75rem', borderLeft: '3px solid var(--danger)' }}>
          <div style={{ padding: '1rem' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <FiAlertCircle size={12} style={{ color: 'var(--danger)' }} /> Last Seen
            </div>
            {caseData.last_seen && (
              <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.3rem' }}>{caseData.last_seen}</div>
            )}
            {fullAddress && (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <FiMapPin size={13} /> {fullAddress}
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {caseData.description && (
          <div className="card" style={{ marginBottom: '0.75rem' }}>
            <div style={{ padding: '1rem' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>Description</div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{caseData.description}</p>
            </div>
          </div>
        )}

        {/* Owner Contact */}
        <div className="card" style={{ marginBottom: '0.75rem' }}>
          <div style={{ padding: '1rem' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>Pet Owner</div>
            <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.5rem' }}>{caseData.owner_name}</div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {caseData.phone && (
                <a href={`tel:${caseData.phone}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', textDecoration: 'none', fontSize: '0.9rem', padding: '0.4rem 0.5rem', borderRadius: '6px', background: 'var(--primary-bg)', border: '1px solid rgba(4,107,210,0.15)' }}>
                  <FiPhone size={14} /> {formatPhone(caseData.phone)}
                </a>
              )}
              {caseData.email && (
                <a href={`mailto:${caseData.email}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', textDecoration: 'none', fontSize: '0.9rem', padding: '0.4rem 0.5rem', borderRadius: '6px', background: 'var(--primary-bg)', border: '1px solid rgba(4,107,210,0.15)' }}>
                  <FiMail size={14} /> {caseData.email}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          {caseData.phone && (
            <a href={`tel:${caseData.phone}`} className="btn btn-accent" style={{ flex: 1, textDecoration: 'none' }}>
              <FiPhone size={16} /> Call Owner
            </a>
          )}
          {caseData.wp_link && (
            <a href={caseData.wp_link} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
              <FiExternalLink size={16} /> View on Site
            </a>
          )}
        </div>

        {/* Source */}
        <div style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', padding: '0.5rem' }}>
          Source: lostpetdronerecovery.com · WP Case #{caseData.wp_id}
        </div>
      </div>
    </div>
  );
}

function normalizePetType(type) {
  if (!type) return 'other';
  const t = type.toLowerCase().trim();
  if (t.includes('dog') || t.includes('poodle') || t.includes('doodle') || t.includes('lab') || t.includes('retriever') || t.includes('collie') || t.includes('boxer') || t.includes('pyrenees')) return 'dog';
  if (t.includes('cat')) return 'cat';
  if (t.includes('horse')) return 'horse';
  if (t.includes('bird')) return 'bird';
  return 'other';
}

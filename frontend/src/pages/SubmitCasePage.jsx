import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { caseApi } from '../services/api';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiArrowRight, FiCheck, FiSend } from 'react-icons/fi';

const steps = ['Pet Info', 'Location', 'Details', 'Review'];

export default function SubmitCasePage() {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    petName: '', petType: 'dog', petBreed: '', petColor: '', petWeight: '',
    microchip: '', distinctiveMarks: '', lastSeenAddress: '', lastSeenLat: 0,
    lastSeenLng: 0, lastSeenDate: new Date().toISOString().slice(0, 16),
    searchRadius: 10, circumstances: '', temperament: 'unknown', dangerNotes: '', urgency: 'medium',
  });

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        ...form, petWeight: form.petWeight ? parseFloat(form.petWeight) : undefined,
        searchRadius: parseInt(form.searchRadius),
        lastSeenDate: new Date(form.lastSeenDate).toISOString(),
        lastSeenLat: form.lastSeenLat || 40.7128, lastSeenLng: form.lastSeenLng || -74.0060,
      };
      const res = await caseApi.create(payload);
      toast.success('Case submitted! Notifying nearby pilots now.');
      navigate(`/cases/${res.data.case.id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit case');
    } finally {
      setSubmitting(false);
    }
  };

  const canProceed = () => {
    if (step === 0) return form.petName.trim() && form.petType;
    if (step === 1) return form.lastSeenAddress.trim() && form.lastSeenDate;
    return true;
  };

  const renderStep = () => {
    switch (step) {
      case 0: return (
        <div className="fade-in">
          <h3 style={{ marginBottom: '1.25rem', fontSize: '1.05rem' }}>Tell us about your pet</h3>
          <div className="form-group">
            <label className="form-label">Pet Name *</label>
            <input className="form-input" value={form.petName} onChange={e => update('petName', e.target.value)} placeholder="Buddy" />
          </div>
          <div className="form-group">
            <label className="form-label">Pet Type *</label>
            <select className="form-select" value={form.petType} onChange={e => update('petType', e.target.value)}>
              <option value="dog">🐕 Dog</option><option value="cat">🐱 Cat</option>
              <option value="horse">🐴 Horse</option><option value="bird">🐦 Bird</option>
              <option value="rabbit">🐰 Rabbit</option><option value="reptile">🦎 Reptile</option>
              <option value="other">🐾 Other</option>
            </select>
          </div>
          <div className="grid-2" style={{ marginBottom: 0 }}>
            <div className="form-group">
              <label className="form-label">Breed</label>
              <input className="form-input" value={form.petBreed} onChange={e => update('petBreed', e.target.value)} placeholder="Golden Retriever" />
            </div>
            <div className="form-group">
              <label className="form-label">Color</label>
              <input className="form-input" value={form.petColor} onChange={e => update('petColor', e.target.value)} placeholder="Golden / Brown" />
            </div>
          </div>
          <div className="grid-2" style={{ marginBottom: 0 }}>
            <div className="form-group">
              <label className="form-label">Weight (lbs)</label>
              <input type="number" className="form-input" value={form.petWeight} onChange={e => update('petWeight', e.target.value)} placeholder="75" />
            </div>
            <div className="form-group">
              <label className="form-label">Microchip #</label>
              <input className="form-input" value={form.microchip} onChange={e => update('microchip', e.target.value)} placeholder="985112003456789" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Distinctive Marks</label>
            <textarea className="form-textarea" value={form.distinctiveMarks} onChange={e => update('distinctiveMarks', e.target.value)} placeholder="Red collar, scar on left ear, etc." />
          </div>
        </div>
      );

      case 1: return (
        <div className="fade-in">
          <h3 style={{ marginBottom: '1.25rem', fontSize: '1.05rem' }}>Where was your pet last seen?</h3>
          <div className="form-group">
            <label className="form-label">Address *</label>
            <textarea className="form-textarea" value={form.lastSeenAddress} onChange={e => update('lastSeenAddress', e.target.value)} placeholder="123 Main St, Oneonta, NY 13820" rows={2} />
          </div>
          <div className="form-group">
            <label className="form-label">Date & Time Last Seen *</label>
            <input type="datetime-local" className="form-input" value={form.lastSeenDate} onChange={e => update('lastSeenDate', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Search Radius (miles)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <input type="range" min="1" max="50" value={form.searchRadius} onChange={e => update('searchRadius', e.target.value)} style={{ flex: 1, accentColor: 'var(--primary)' }} />
              <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', minWidth: '3rem', textAlign: 'center' }}>{form.searchRadius} mi</span>
            </div>
          </div>
        </div>
      );

      case 2: return (
        <div className="fade-in">
          <h3 style={{ marginBottom: '1.25rem', fontSize: '1.05rem' }}>Circumstances & Details</h3>
          <div className="form-group">
            <label className="form-label">How did your pet get lost?</label>
            <textarea className="form-textarea" value={form.circumstances} onChange={e => update('circumstances', e.target.value)} placeholder="Buddy ran out the back door when the mailman came..." rows={3} />
          </div>
          <div className="form-group">
            <label className="form-label">Temperament</label>
            <select className="form-select" value={form.temperament} onChange={e => update('temperament', e.target.value)}>
              <option value="friendly">😊 Friendly — will approach strangers</option>
              <option value="skittish">😰 Skittish — may hide or run</option>
              <option value="aggressive">😤 Aggressive — do not approach</option>
              <option value="unknown">🤷 Unknown / Not sure</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Nearby Dangers</label>
            <textarea className="form-textarea" value={form.dangerNotes} onChange={e => update('dangerNotes', e.target.value)} placeholder="Busy road nearby, coyotes in the area, nearby river..." rows={2} />
          </div>
          <div className="form-group">
            <label className="form-label">Urgency</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {[
                { value: 'low', label: '🔵 Low' }, { value: 'medium', label: '🟡 Medium' },
                { value: 'high', label: '🟠 High' }, { value: 'critical', label: '🔴 Critical' },
              ].map(u => (
                <button key={u.value} onClick={() => update('urgency', u.value)} style={{
                  flex: 1, padding: '0.5rem', borderRadius: '6px',
                  border: `1px solid ${form.urgency === u.value ? 'var(--primary)' : 'var(--border-default)'}`,
                  background: form.urgency === u.value ? 'var(--primary-bg)' : 'var(--bg-card)',
                  color: form.urgency === u.value ? 'var(--primary)' : 'var(--text-secondary)',
                  cursor: 'pointer', fontWeight: form.urgency === u.value ? 600 : 400,
                  fontSize: '0.8rem', fontFamily: 'var(--font-body)',
                }}>
                  {u.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      );

      case 3: return (
        <div className="fade-in">
          <h3 style={{ marginBottom: '1.25rem', fontSize: '1.05rem' }}>Review & Submit</h3>
          <div className="card" style={{ marginBottom: '1rem', background: 'var(--bg-secondary)' }}>
            <div style={{ padding: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {[
                { label: 'Pet Name', value: form.petName },
                { label: 'Type', value: form.petType, cap: true },
                { label: 'Breed', value: form.petBreed },
                { label: 'Color', value: form.petColor },
              ].map((item, i) => (
                <div key={i}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.label}</div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', textTransform: item.cap ? 'capitalize' : 'none' }}>{item.value || '—'}</div>
                </div>
              ))}
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Last Seen</div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{form.lastSeenAddress}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Date</div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', fontFamily: 'var(--font-mono)' }}>{new Date(form.lastSeenDate).toLocaleString()}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Urgency</div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', textTransform: 'capitalize' }}>{form.urgency}</div>
              </div>
              {form.circumstances && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Circumstances</div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{form.circumstances}</div>
                </div>
              )}
            </div>
          </div>

          <div style={{ background: 'var(--primary-bg)', border: '1px solid rgba(4,107,210,0.2)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <FiCheck size={14} style={{ verticalAlign: 'middle', marginRight: '0.4rem', color: 'var(--primary)' }} />
            By submitting, nearby drone pilots will be notified and can accept your case.
          </div>

          <button onClick={handleSubmit} className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={submitting}>
            {submitting ? 'Submitting...' : (<><FiSend size={16} /> Submit Case & Notify Pilots</>)}
          </button>
        </div>
      );
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)', padding: '1.5rem 1rem' }}>
        <div className="container">
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', marginBottom: '0.25rem' }}>Report Lost Pet</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>We'll notify nearby drone pilots immediately</p>
        </div>
      </div>

      <section className="section">
        <div className="container" style={{ maxWidth: '700px' }}>
          {/* Progress Steps */}
          <div style={{ display: 'flex', marginBottom: '1.5rem', gap: '0.25rem' }}>
            {steps.map((s, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '6px',
                  background: i <= step ? 'var(--primary)' : 'var(--bg-elevated)',
                  border: `1px solid ${i <= step ? 'var(--primary)' : 'var(--border-default)'}`,
                  color: i <= step ? 'white' : 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, margin: '0 auto 0.35rem', fontSize: '0.8rem',
                  fontFamily: 'var(--font-mono)', transition: 'all 0.3s',
                  boxShadow: i === step ? '0 0 12px var(--primary-glow)' : 'none',
                }}>
                  {i < step ? <FiCheck size={14} /> : i + 1}
                </div>
                <div style={{ fontSize: '0.65rem', color: i <= step ? 'var(--primary)' : 'var(--text-muted)', fontWeight: i === step ? 600 : 400, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {s}
                </div>
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="card">
            <div className="card-body">{renderStep()}</div>
            <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
              <button onClick={() => setStep(s => s - 1)} className="btn btn-secondary btn-sm" disabled={step === 0}>
                <FiArrowLeft size={14} /> Back
              </button>
              {step < steps.length - 1 && (
                <button onClick={() => setStep(s => s + 1)} className="btn btn-primary btn-sm" disabled={!canProceed()}>
                  Next <FiArrowRight size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

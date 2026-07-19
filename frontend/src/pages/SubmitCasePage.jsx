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
    petName: '',
    petType: 'dog',
    petBreed: '',
    petColor: '',
    petWeight: '',
    microchip: '',
    distinctiveMarks: '',
    lastSeenAddress: '',
    lastSeenLat: 0,
    lastSeenLng: 0,
    lastSeenDate: new Date().toISOString().slice(0, 16),
    searchRadius: 10,
    circumstances: '',
    temperament: 'unknown',
    dangerNotes: '',
    urgency: 'medium',
  });

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        petWeight: form.petWeight ? parseFloat(form.petWeight) : undefined,
        searchRadius: parseInt(form.searchRadius),
        lastSeenDate: new Date(form.lastSeenDate).toISOString(),
        lastSeenLat: form.lastSeenLat || 40.7128,
        lastSeenLng: form.lastSeenLng || -74.0060,
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
    if (step === 2) return true;
    return true;
  };

  const renderStep = () => {
    switch (step) {
      case 0: return (
        <div className="fade-in">
          <h3 style={{ marginBottom: '1.5rem' }}>Tell us about your pet</h3>
          
          <div className="form-group">
            <label className="form-label">Pet Name *</label>
            <input className="form-input" value={form.petName} onChange={e => update('petName', e.target.value)} placeholder="Buddy" />
          </div>

          <div className="form-group">
            <label className="form-label">Pet Type *</label>
            <select className="form-select" value={form.petType} onChange={e => update('petType', e.target.value)}>
              <option value="dog">🐕 Dog</option>
              <option value="cat">🐱 Cat</option>
              <option value="horse">🐴 Horse</option>
              <option value="bird">🐦 Bird</option>
              <option value="rabbit">🐰 Rabbit</option>
              <option value="reptile">🦎 Reptile</option>
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
          <h3 style={{ marginBottom: '1.5rem' }}>Where was your pet last seen?</h3>

          <div className="form-group">
            <label className="form-label">Address *</label>
            <textarea className="form-textarea" value={form.lastSeenAddress} onChange={e => update('lastSeenAddress', e.target.value)}
              placeholder="123 Main St, Oneonta, NY 13820" rows={2} />
          </div>

          <div className="form-group">
            <label className="form-label">Date & Time Last Seen *</label>
            <input type="datetime-local" className="form-input" value={form.lastSeenDate} onChange={e => update('lastSeenDate', e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Search Radius (miles)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <input type="range" min="1" max="50" value={form.searchRadius} onChange={e => update('searchRadius', e.target.value)} style={{ flex: 1 }} />
              <span style={{ fontWeight: 700, minWidth: '3rem', textAlign: 'center' }}>{form.searchRadius} mi</span>
            </div>
          </div>
        </div>
      );

      case 2: return (
        <div className="fade-in">
          <h3 style={{ marginBottom: '1.5rem' }}>Circumstances & Details</h3>

          <div className="form-group">
            <label className="form-label">How did your pet get lost?</label>
            <textarea className="form-textarea" value={form.circumstances} onChange={e => update('circumstances', e.target.value)}
              placeholder="Buddy ran out the back door when the mailman came. He usually stays close but might have gotten spooked." rows={3} />
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
            <textarea className="form-textarea" value={form.dangerNotes} onChange={e => update('dangerNotes', e.target.value)}
              placeholder="Busy road nearby, coyotes in the area, nearby river/creek, extreme weather..." rows={2} />
          </div>

          <div className="form-group">
            <label className="form-label">Urgency</label>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {[
                { value: 'low', label: '🔵 Low' },
                { value: 'medium', label: '🟡 Medium' },
                { value: 'high', label: '🟠 High' },
                { value: 'critical', label: '🔴 Critical' },
              ].map(u => (
                <button
                  key={u.value}
                  onClick={() => update('urgency', u.value)}
                  style={{
                    flex: 1,
                    padding: '0.6rem',
                    borderRadius: '8px',
                    border: `2px solid ${form.urgency === u.value ? 'var(--primary)' : 'var(--gray-200)'}`,
                    background: form.urgency === u.value ? 'var(--primary-bg)' : 'white',
                    cursor: 'pointer',
                    fontWeight: form.urgency === u.value ? 600 : 400,
                    fontSize: '0.9rem',
                  }}
                >
                  {u.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      );

      case 3: return (
        <div className="fade-in">
          <h3 style={{ marginBottom: '1.5rem' }}>Review & Submit</h3>
          
          <div className="card" style={{ marginBottom: '1rem' }}>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>Pet Name</div>
                  <div style={{ fontWeight: 600 }}>{form.petName}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>Type</div>
                  <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{form.petType}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>Breed</div>
                  <div style={{ fontWeight: 600 }}>{form.petBreed || '—'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>Color</div>
                  <div style={{ fontWeight: 600 }}>{form.petColor || '—'}</div>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>Last Seen</div>
                  <div style={{ fontWeight: 600 }}>{form.lastSeenAddress}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>Date</div>
                  <div style={{ fontWeight: 600 }}>{new Date(form.lastSeenDate).toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>Search Radius</div>
                  <div style={{ fontWeight: 600 }}>{form.searchRadius} miles</div>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>Urgency</div>
                  <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{form.urgency}</div>
                </div>
                {form.circumstances && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>Circumstances</div>
                    <div style={{ fontWeight: 600 }}>{form.circumstances}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--primary-bg)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--gray-700)' }}>
            <FiCheck size={16} style={{ verticalAlign: 'middle', marginRight: '0.5rem', color: 'var(--primary)' }} />
            By submitting, nearby drone pilots will be notified and can accept your case. You'll be able to communicate with your assigned pilot directly.
          </div>

          <button onClick={handleSubmit} className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={submitting}>
            {submitting ? 'Submitting...' : (
              <><FiSend size={18} /> Submit Case & Notify Pilots</>
            )}
          </button>
        </div>
      );
    }
  };

  return (
    <div>
      <section className="page-header" style={{ padding: '2rem 0' }}>
        <div className="container">
          <h1 style={{ fontSize: '1.8rem' }}>Report a Lost Pet</h1>
          <p>We'll notify nearby drone pilots immediately</p>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: '700px' }}>
          {/* Progress Steps */}
          <div style={{ display: 'flex', marginBottom: '2rem', gap: '0.5rem' }}>
            {steps.map((s, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: i <= step ? 'var(--primary)' : 'var(--gray-200)',
                  color: i <= step ? 'white' : 'var(--gray-400)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  margin: '0 auto 0.5rem',
                  fontSize: '0.85rem',
                  transition: 'all 0.3s',
                }}>
                  {i < step ? <FiCheck size={18} /> : i + 1}
                </div>
                <div style={{ fontSize: '0.75rem', color: i <= step ? 'var(--primary)' : 'var(--gray-400)', fontWeight: i === step ? 600 : 400 }}>
                  {s}
                </div>
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="card">
            <div className="card-body">
              {renderStep()}
            </div>

            {/* Navigation */}
            <div className="card-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button
                onClick={() => setStep(s => s - 1)}
                className="btn btn-secondary"
                disabled={step === 0}
              >
                <FiArrowLeft size={16} /> Back
              </button>
              
              {step < steps.length - 1 ? (
                <button
                  onClick={() => setStep(s => s + 1)}
                  className="btn btn-primary"
                  disabled={!canProceed()}
                >
                  Next <FiArrowRight size={16} />
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

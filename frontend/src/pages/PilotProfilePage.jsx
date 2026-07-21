import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { pilotApi } from '../services/api';
import toast from 'react-hot-toast';
import { FiUser, FiMail, FiPhone, FiMapPin, FiEdit3, FiSave, FiArrowLeft, FiShield, FiLogOut } from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner';

export default function PilotProfilePage() {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    bio: '',
    baseLat: '',
    baseLng: '',
    serviceRadius: 25,
    equipment: [{ droneModel: '', hasThermal: false, hasSpotlight: false, hasSpeaker: false, cameraType: '', notes: '' }],
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const res = await pilotApi.getById(user.id);
      const pilot = res.data.pilot;
      setForm({
        firstName: pilot.first_name || user.firstName || '',
        lastName: pilot.last_name || user.lastName || '',
        phone: pilot.phone || user.phone || '',
        bio: pilot.profile?.bio || '',
        baseLat: pilot.profile?.base_lat || '',
        baseLng: pilot.profile?.base_lng || '',
        serviceRadius: pilot.profile?.service_radius || 25,
        equipment: pilot.equipment?.length > 0
          ? pilot.equipment.map(eq => ({
              droneModel: eq.drone_model || '',
              hasThermal: eq.has_thermal || false,
              hasSpotlight: eq.has_spotlight || false,
              hasSpeaker: eq.has_speaker || false,
              cameraType: eq.camera_type || '',
              notes: eq.notes || '',
            }))
          : [{ droneModel: '', hasThermal: false, hasSpotlight: false, hasSpeaker: false, cameraType: '', notes: '' }],
      });
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const updateEquipment = (index, field, value) => {
    setForm(prev => {
      const equipment = [...prev.equipment];
      equipment[index] = { ...equipment[index], [field]: value };
      return { ...prev, equipment };
    });
  };

  const addEquipment = () => {
    setForm(prev => ({
      ...prev,
      equipment: [...prev.equipment, { droneModel: '', hasThermal: false, hasSpotlight: false, hasSpeaker: false, cameraType: '', notes: '' }],
    }));
  };

  const removeEquipment = (index) => {
    setForm(prev => ({
      ...prev,
      equipment: prev.equipment.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await pilotApi.updateProfile({
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        bio: form.bio,
        baseLat: form.baseLat ? parseFloat(form.baseLat) : undefined,
        baseLng: form.baseLng ? parseFloat(form.baseLng) : undefined,
        serviceRadius: parseInt(form.serviceRadius),
        equipment: form.equipment,
      });
      await refreshUser();
      toast.success('Profile updated!');
      navigate('/pilot/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading profile..." />;

  return (
    <div>
      {/* Header */}
      <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)', padding: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={() => navigate('/pilot/dashboard')} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '0.25rem' }}>
            <FiArrowLeft size={20} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FiEdit3 size={16} style={{ color: 'var(--primary)' }} />
            <span style={{ fontWeight: 700, fontSize: '1rem' }}>Edit Profile</span>
          </div>
        </div>
      </div>

      <div style={{ padding: '1rem' }}>
        {/* Personal Info */}
        <div className="section-title">
          <FiUser size={14} />
          Personal Info
        </div>
        <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input className="form-input" value={form.firstName} onChange={e => updateField('firstName', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input className="form-input" value={form.lastName} onChange={e => updateField('lastName', e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label"><FiMail size={11} style={{ verticalAlign: 'middle', marginRight: '0.3rem' }} />Email</label>
            <input className="form-input" value={user.email} disabled style={{ opacity: 0.6 }} />
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Email cannot be changed</div>
          </div>

          <div className="form-group">
            <label className="form-label"><FiPhone size={11} style={{ verticalAlign: 'middle', marginRight: '0.3rem' }} />Phone</label>
            <input className="form-input" type="tel" value={form.phone} onChange={e => updateField('phone', e.target.value)} placeholder="(555) 123-4567" />
          </div>
        </div>

        {/* Pilot Info */}
        <div className="section-title">
          <FiShield size={14} />
          Pilot Details
        </div>
        <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Bio</label>
            <textarea
              className="form-textarea"
              value={form.bio}
              onChange={e => updateField('bio', e.target.value)}
              placeholder="Tell pet owners about yourself, your experience, your equipment..."
              rows={4}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">Base Latitude</label>
              <input className="form-input" type="number" step="any" value={form.baseLat} onChange={e => updateField('baseLat', e.target.value)} placeholder="42.4527" />
            </div>
            <div className="form-group">
              <label className="form-label">Base Longitude</label>
              <input className="form-input" type="number" step="any" value={form.baseLng} onChange={e => updateField('baseLng', e.target.value)} placeholder="-75.0636" />
            </div>
            <div className="form-group">
              <label className="form-label">Service Radius (mi)</label>
              <input className="form-input" type="number" value={form.serviceRadius} onChange={e => updateField('serviceRadius', e.target.value)} min="1" max="500" />
            </div>
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '-0.25rem' }}>
            Your base location and how far you're willing to travel for a search
          </div>
        </div>

        {/* Verification Status */}
        <div style={{ background: 'var(--primary-bg)', border: '1px solid rgba(4,107,210,0.2)', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
              <FiShield size={12} style={{ verticalAlign: 'middle', marginRight: '0.3rem' }} />
              FAA Verification
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
              Required to appear on the pilot map
            </div>
          </div>
          <Link to="/pilot/verification" style={{ textDecoration: 'none' }}>
            <button className="btn btn-primary btn-sm">
              Submit / View
            </button>
          </Link>
        </div>

        {/* Equipment */}
        <div className="section-title">
          🛸 Equipment
        </div>
        {form.equipment.map((eq, i) => (
          <div key={i} className="card" style={{ padding: '1rem', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Drone {form.equipment.length > 1 ? `#${i + 1}` : ''}</span>
              {form.equipment.length > 1 && (
                <button onClick={() => removeEquipment(i)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.8rem' }}>Remove</button>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Drone Model</label>
              <input className="form-input" value={eq.droneModel} onChange={e => updateEquipment(i, 'droneModel', e.target.value)} placeholder="DJI Mavic 3 Thermal" />
            </div>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
              {[
                { key: 'hasThermal', label: '🔬 Thermal' },
                { key: 'hasSpotlight', label: '🔦 Spotlight' },
                { key: 'hasSpeaker', label: '🔊 Speaker' },
              ].map(cap => (
                <label key={cap.key} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <input type="checkbox" checked={eq[cap.key]} onChange={e => updateEquipment(i, cap.key, e.target.checked)} style={{ accentColor: 'var(--primary)' }} />
                  {cap.label}
                </label>
              ))}
            </div>
            <div className="form-group" style={{ marginTop: '0.5rem' }}>
              <label className="form-label">Camera Type</label>
              <input className="form-input" value={eq.cameraType} onChange={e => updateEquipment(i, 'cameraType', e.target.value)} placeholder="Thermal + RGB" />
            </div>
          </div>
        ))}
        <button onClick={addEquipment} style={{ background: 'none', border: '1px dashed var(--border-default)', color: 'var(--primary)', width: '100%', padding: '0.6rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'var(--font-body)', marginBottom: '1.5rem' }}>
          + Add Another Drone
        </button>

        {/* Save Button */}
        <button onClick={handleSave} className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={saving}>
          <FiSave size={16} /> {saving ? 'Saving...' : 'Save Profile'}
        </button>

        {/* Sign Out */}
        <button
          onClick={() => { logout(); navigate('/'); }}
          style={{
            width: '100%', marginTop: '1rem', padding: '0.75rem', borderRadius: '8px',
            background: 'none', border: '1px solid var(--border-default)', color: 'var(--text-muted)',
            cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '0.85rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
          }}
        >
          <FiLogOut size={16} /> Sign Out
        </button>
      </div>
    </div>
  );
}

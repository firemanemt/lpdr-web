import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { pilotApi, mapApi } from '../services/api';
import { connectSocket, getSocket } from '../services/socket';
import LoadingSpinner from '../components/LoadingSpinner';
import { FiSearch, FiFilter, FiNavigation, FiStar, FiMapPin, FiX, FiCrosshair } from 'react-icons/fi';

export default function PilotMapPage() {
  const { isAuthenticated, isPetOwner } = useAuth();
  const [pilots, setPilots] = useState([]);
  const [selectedPilot, setSelectedPilot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchRadius, setSearchRadius] = useState(50);
  const [filterThermal, setFilterThermal] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const navigate = useNavigate();

  const demoPilots = [
    { id: 'p1', name: 'Mike Rivers', lat: 42.45, lng: -75.06, city: 'Oneonta, NY', available: true, rating: 5.0, thermal: true, price: 150 },
    { id: 'p2', name: 'Jessica Chen', lat: 40.71, lng: -74.01, city: 'New York, NY', available: true, rating: 4.5, thermal: true, price: 200 },
    { id: 'p3', name: 'David Martinez', lat: 41.88, lng: -87.63, city: 'Chicago, IL', available: true, rating: 5.0, thermal: true, price: 250 },
    { id: 'p4', name: 'Amanda Lee', lat: 34.05, lng: -118.24, city: 'Los Angeles, CA', available: false, rating: 4.0, thermal: true, price: 100 },
    { id: 'p5', name: 'Tom Bradley', lat: 29.76, lng: -95.37, city: 'Houston, TX', available: true, rating: 4.5, thermal: true, price: 175 },
    { id: 'p6', name: 'Sarah Williams', lat: 39.74, lng: -104.99, city: 'Denver, CO', available: true, rating: 4.0, thermal: false, price: 125 },
    { id: 'p7', name: 'James Wilson', lat: 47.61, lng: -122.33, city: 'Seattle, WA', available: false, rating: 4.5, thermal: true, price: 200 },
    { id: 'p8', name: 'Emily Davis', lat: 33.45, lng: -112.07, city: 'Phoenix, AZ', available: true, rating: 5.0, thermal: true, price: 150 },
  ];

  useEffect(() => {
    loadPilots();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setUserLocation({ lat: 40.7128, lng: -74.0060 })
      );
    }
    const socket = connectSocket();
    socket.on('map:update', () => {});
  }, []);

  const loadPilots = async () => {
    try {
      const res = await pilotApi.list();
      setPilots(res.data.pilots || []);
    } catch (err) {
      setPilots([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredPilots = demoPilots.filter(p => {
    if (filterThermal && !p.thermal) return false;
    return true;
  });

  const getInitials = (name) => name.split(' ').map(n => n[0]).join('').toUpperCase();

  const mapBounds = { minLat: 25, maxLat: 50, minLng: -125, maxLng: -65 };
  const toMapX = (lng) => ((lng - mapBounds.minLng) / (mapBounds.maxLng - mapBounds.minLng)) * 100;
  const toMapY = (lat) => ((mapBounds.maxLat - lat) / (mapBounds.maxLat - mapBounds.minLat)) * 100;

  if (loading) return <LoadingSpinner text="Loading tactical map..." />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      {/* Map Area */}
      <div style={{ flex: 1, position: 'relative', background: 'var(--bg-primary)', overflow: 'hidden' }}>
        {/* Grid overlay */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.08 }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={`h${i}`} style={{ position: 'absolute', left: 0, right: 0, top: `${i * 8.33}%`, height: '1px', background: 'var(--primary)' }} />
          ))}
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={`v${i}`} style={{ position: 'absolute', top: 0, bottom: 0, left: `${i * 8.33}%`, width: '1px', background: 'var(--primary)' }} />
          ))}
        </div>

        {/* Radial glow center */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '60%', height: '60%', background: 'radial-gradient(circle, rgba(4,107,210,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* User Location */}
        {userLocation && (
          <div style={{ position: 'absolute', left: `${toMapX(userLocation.lng)}%`, top: `${toMapY(userLocation.lat)}%`, transform: 'translate(-50%, -50%)', zIndex: 10 }}>
            <div style={{ width: '14px', height: '14px', background: 'var(--info)', borderRadius: '50%', border: '2px solid white', boxShadow: '0 0 12px rgba(6,182,212,0.5)' }} />
            <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', fontSize: '0.6rem', color: 'var(--info)', fontWeight: 700, whiteSpace: 'nowrap', marginTop: '3px', fontFamily: 'var(--font-mono)' }}>
              YOU
            </div>
          </div>
        )}

        {/* Pilot Pins */}
        {filteredPilots.map(pilot => {
          const x = toMapX(pilot.lng);
          const y = toMapY(pilot.lat);
          return (
            <div key={pilot.id} onClick={() => setSelectedPilot(pilot)} style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)', zIndex: selectedPilot?.id === pilot.id ? 20 : 5, cursor: 'pointer', transition: 'all 0.2s' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '8px',
                background: pilot.available ? 'var(--primary)' : 'var(--bg-elevated)',
                border: `2px solid ${pilot.available ? 'var(--primary-light)' : 'var(--border-default)'}`,
                boxShadow: pilot.available ? '0 0 16px var(--primary-glow)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 700, fontSize: '0.7rem',
                fontFamily: 'var(--font-mono)',
              }}>
                {getInitials(pilot.name)}
              </div>
              <div style={{
                position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
                marginTop: '3px', background: 'var(--bg-card)', padding: '1px 6px',
                borderRadius: '3px', fontSize: '0.6rem', fontWeight: 600,
                whiteSpace: 'nowrap', border: '1px solid var(--border-subtle)',
                color: pilot.available ? 'var(--text-secondary)' : 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
              }}>
                {pilot.city.split(',')[0]}
              </div>
            </div>
          );
        })}

        {/* State Labels */}
        {[
          { label: 'NY', left: '78%', top: '32%' }, { label: 'CA', left: '15%', top: '55%' },
          { label: 'TX', left: '40%', top: '62%' }, { label: 'IL', left: '55%', top: '40%' },
          { label: 'CO', left: '32%', top: '45%' }, { label: 'WA', left: '10%', top: '20%' },
          { label: 'AZ', left: '22%', top: '55%' },
        ].map((s, i) => (
          <div key={i} style={{ position: 'absolute', left: `${s.left}%`, top: `${s.top}%`, fontSize: '0.55rem', color: 'rgba(4,107,210,0.15)', fontWeight: 700, letterSpacing: '0.12em', fontFamily: 'var(--font-mono)', pointerEvents: 'none' }}>
            {s.label}
          </div>
        ))}

        {/* Legend */}
        <div style={{ position: 'absolute', bottom: '0.75rem', left: '0.75rem', background: 'var(--bg-card)', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '0.7rem', zIndex: 30, fontFamily: 'var(--font-mono)' }}>
          <div style={{ fontWeight: 600, marginBottom: '0.3rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.6rem' }}>Legend</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className="status-dot online" /> <span style={{ color: 'var(--text-secondary)' }}>Available</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className="status-dot offline" /> <span style={{ color: 'var(--text-muted)' }}>Offline</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--info)', border: '1px solid white' }} /> <span style={{ color: 'var(--text-muted)' }}>You</span>
            </div>
          </div>
        </div>

        {/* Filter Control */}
        <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', background: 'var(--bg-card)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', zIndex: 30, minWidth: '160px' }}>
          <div style={{ fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <FiFilter size={12} /> Filters
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.15rem', fontFamily: 'var(--font-mono)' }}>
              Radius: {searchRadius} mi
            </label>
            <input type="range" min="10" max="200" value={searchRadius} onChange={e => setSearchRadius(e.target.value)} style={{ width: '100%', accentColor: 'var(--primary)' }} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <input type="checkbox" checked={filterThermal} onChange={e => setFilterThermal(e.target.checked)} style={{ accentColor: 'var(--primary)' }} />
            Thermal only
          </label>
        </div>

        {/* Pilot Detail Popup */}
        {selectedPilot && (
          <>
            <div onClick={() => setSelectedPilot(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }} />
            <div style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              background: 'var(--bg-card)', borderRadius: '12px', padding: '1.5rem',
              border: '1px solid var(--border-default)', boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
              zIndex: 50, width: '340px', maxWidth: '90vw',
            }}>
              <button onClick={() => setSelectedPilot(null)} style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                <FiX />
              </button>
              
              <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '8px', background: selectedPilot.available ? 'var(--primary-bg)' : 'var(--bg-elevated)', border: `1px solid ${selectedPilot.available ? 'rgba(4,107,210,0.2)' : 'var(--border-default)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem', color: selectedPilot.available ? 'var(--primary)' : 'var(--text-muted)', margin: '0 auto 0.75rem', fontFamily: 'var(--font-display)' }}>
                  {getInitials(selectedPilot.name)}
                </div>
                <h3 style={{ marginBottom: '0.15rem', fontSize: '1.05rem' }}>{selectedPilot.name}</h3>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                  <FiMapPin size={12} style={{ verticalAlign: 'middle' }} /> {selectedPilot.city}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
                <div style={{ textAlign: 'center', padding: '0.5rem', background: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent)' }}>{'⭐'.repeat(Math.round(selectedPilot.rating))}</div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{selectedPilot.rating}</div>
                </div>
                <div style={{ textAlign: 'center', padding: '0.5rem', background: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>${selectedPilot.price}</div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Per search</div>
                </div>
                <div style={{ textAlign: 'center', padding: '0.5rem', background: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: selectedPilot.available ? 'var(--success)' : 'var(--text-muted)' }}>
                    {selectedPilot.available ? '🟢' : '🔴'}
                  </div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{selectedPilot.available ? 'Online' : 'Offline'}</div>
                </div>
              </div>

              {selectedPilot.thermal && (
                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                  <span className="badge badge-green">🔥 Thermal Equipped</span>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {isAuthenticated ? (
                  <button className="btn btn-primary" style={{ flex: 1 }}>
                    <FiNavigation size={14} /> Contact Pilot
                  </button>
                ) : (
                  <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => navigate('/register')}>
                    Sign Up to Contact
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Pilot List Bar */}
      <div style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-subtle)', padding: '0.6rem 1rem', overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: '0.5rem', minWidth: 'max-content', alignItems: 'center' }}>
          <div style={{ fontWeight: 600, fontSize: '0.7rem', color: 'var(--text-muted)', paddingRight: '0.75rem', borderRight: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-mono)' }}>
            <FiSearch size={12} /> {filteredPilots.length}
          </div>
          {filteredPilots.map(pilot => (
            <div key={pilot.id} onClick={() => setSelectedPilot(pilot)} style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.4rem 0.75rem', borderRadius: '6px', cursor: 'pointer',
              background: selectedPilot?.id === pilot.id ? 'var(--primary-bg)' : 'transparent',
              border: '1px solid', borderColor: selectedPilot?.id === pilot.id ? 'var(--primary)' : 'var(--border-subtle)',
              transition: 'all 0.2s',
            }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: pilot.available ? 'var(--primary-bg)' : 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.6rem', color: pilot.available ? 'var(--primary)' : 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {getInitials(pilot.name)}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.75rem' }}>{pilot.name}</div>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{pilot.city}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

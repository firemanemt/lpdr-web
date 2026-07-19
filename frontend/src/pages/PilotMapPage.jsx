import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { pilotApi, mapApi } from '../services/api';
import { connectSocket, getSocket } from '../services/socket';
import LoadingSpinner from '../components/LoadingSpinner';
import { FiSearch, FiFilter, FiNavigation, FiStar, FiMapPin, FiX } from 'react-icons/fi';

export default function PilotMapPage() {
  const { isAuthenticated, isPetOwner } = useAuth();
  const [pilots, setPilots] = useState([]);
  const [selectedPilot, setSelectedPilot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchRadius, setSearchRadius] = useState(50);
  const [filterThermal, setFilterThermal] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const navigate = useNavigate();

  // Demo pilot positions for the visual map
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
    
    // Try to get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setUserLocation({ lat: 40.7128, lng: -74.0060 }) // Default to NYC
      );
    }

    const socket = connectSocket();
    socket.on('map:update', (data) => {
      // In production, update pilot positions in real-time
    });
  }, []);

  const loadPilots = async () => {
    try {
      const res = await pilotApi.list();
      setPilots(res.data.pilots || []);
    } catch (err) {
      // Use demo data if API fails
      setPilots([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredPilots = demoPilots.filter(p => {
    if (filterThermal && !p.thermal) return false;
    return true;
  });

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Visual map with positioned "pins"
  const mapBounds = { minLat: 25, maxLat: 50, minLng: -125, maxLng: -65 };
  
  const toMapX = (lng) => ((lng - mapBounds.minLng) / (mapBounds.maxLng - mapBounds.minLng)) * 100;
  const toMapY = (lat) => ((mapBounds.maxLat - lat) / (mapBounds.maxLat - mapBounds.minLat)) * 100;

  if (loading) return <LoadingSpinner text="Loading map..." />;

  return (
    <div style={{ minHeight: 'calc(100vh - 70px)', display: 'flex', flexDirection: 'column' }}>
      {/* Map Area */}
      <div style={{ flex: 1, position: 'relative', background: 'linear-gradient(180deg, #dbeafe 0%, #bfdbfe 50%, #93c5fd 100%)', minHeight: '500px' }}>
        {/* Map Grid */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.15 }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={`h${i}`} style={{ position: 'absolute', left: 0, right: 0, top: `${i * 10}%`, height: '1px', background: '#046bd2' }} />
          ))}
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={`v${i}`} style={{ position: 'absolute', top: 0, bottom: 0, left: `${i * 10}%`, width: '1px', background: '#046bd2' }} />
          ))}
        </div>

        {/* User Location */}
        {userLocation && (
          <div style={{
            position: 'absolute',
            left: `${toMapX(userLocation.lng)}%`,
            top: `${toMapY(userLocation.lat)}%`,
            transform: 'translate(-50%, -50%)',
            zIndex: 10,
          }}>
            <div style={{
              width: '16px', height: '16px',
              background: '#3b82f6',
              borderRadius: '50%',
              border: '3px solid white',
              boxShadow: '0 0 0 3px rgba(59,130,246,0.3)',
            }} />
            <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', fontSize: '0.7rem', color: '#3b82f6', fontWeight: 700, whiteSpace: 'nowrap', marginTop: '4px' }}>
              Your Location
            </div>
          </div>
        )}

        {/* Pilot Pins */}
        {filteredPilots.map(pilot => {
          const x = toMapX(pilot.lng);
          const y = toMapY(pilot.lat);
          return (
            <div
              key={pilot.id}
              onClick={() => setSelectedPilot(pilot)}
              style={{
                position: 'absolute',
                left: `${x}%`,
                top: `${y}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: selectedPilot?.id === pilot.id ? 20 : 5,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <div style={{
                width: '40px', height: '40px',
                borderRadius: '50%',
                background: pilot.available ? '#046bd2' : '#9ca3af',
                border: '3px solid white',
                boxShadow: `0 2px 8px rgba(0,0,0,0.2)${pilot.available ? ', 0 0 0 4px rgba(4,107,210,0.2)' : ''}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.85rem',
                animation: pilot.available ? 'pulse 2s ease-in-out infinite' : 'none',
              }}>
                {getInitials(pilot.name)}
              </div>
              <div style={{
                position: 'absolute',
                top: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                marginTop: '4px',
                background: 'white',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '0.7rem',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                color: pilot.available ? 'var(--gray-800)' : 'var(--gray-400)',
              }}>
                {pilot.city.split(',')[0]}
              </div>
            </div>
          );
        })}

        {/* State Labels */}
        {[
          { label: 'NY', left: '78%', top: '32%' },
          { label: 'CA', left: '15%', top: '55%' },
          { label: 'TX', left: '40%', top: '62%' },
          { label: 'IL', left: '55%', top: '40%' },
          { label: 'CO', left: '32%', top: '45%' },
          { label: 'WA', left: '10%', top: '20%' },
          { label: 'AZ', left: '22%', top: '55%' },
        ].map((s, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${s.left}%`,
            top: `${s.top}%`,
            fontSize: '0.6rem',
            color: 'rgba(4,107,210,0.3)',
            fontWeight: 700,
            letterSpacing: '0.1em',
            pointerEvents: 'none',
          }}>
            {s.label}
          </div>
        ))}

        {/* Legend */}
        <div style={{
          position: 'absolute',
          bottom: '1.5rem',
          left: '1.5rem',
          background: 'white',
          padding: '1rem',
          borderRadius: '12px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
          zIndex: 30,
          fontSize: '0.85rem',
        }}>
          <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Legend</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#046bd2' }} />
              <span>Available Pilot</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#9ca3af' }} />
              <span>Offline / Unavailable</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#3b82f6', border: '2px solid white' }} />
              <span>Your Location</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div style={{
          position: 'absolute',
          top: '1.5rem',
          right: '1.5rem',
          background: 'white',
          padding: '1rem',
          borderRadius: '12px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
          zIndex: 30,
          minWidth: '200px',
        }}>
          <div style={{ fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FiFilter size={14} /> Filters
          </div>
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--gray-500)', display: 'block', marginBottom: '0.25rem' }}>
              Search Radius: {searchRadius} mi
            </label>
            <input
              type="range"
              min="10"
              max="200"
              value={searchRadius}
              onChange={e => setSearchRadius(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={filterThermal} onChange={e => setFilterThermal(e.target.checked)} />
            Thermal drones only
          </label>
        </div>

        {/* Pilot Detail Popup */}
        {selectedPilot && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'white',
            borderRadius: '16px',
            padding: '2rem',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            zIndex: 50,
            width: '380px',
            maxWidth: '90vw',
          }}>
            <button
              onClick={() => setSelectedPilot(null)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--gray-400)' }}
            >
              <FiX />
            </button>
            
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{
                width: '72px', height: '72px', borderRadius: '50%',
                background: selectedPilot.available ? 'var(--primary-bg)' : 'var(--gray-100)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '1.5rem', color: selectedPilot.available ? 'var(--primary)' : 'var(--gray-400)',
                margin: '0 auto 1rem',
              }}>
                {getInitials(selectedPilot.name)}
              </div>
              <h3 style={{ marginBottom: '0.25rem' }}>{selectedPilot.name}</h3>
              <div style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>
                <FiMapPin size={14} style={{ verticalAlign: 'middle' }} /> {selectedPilot.city}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--primary)' }}>{'⭐'.repeat(Math.round(selectedPilot.rating))}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{selectedPilot.rating}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--primary)' }}>${selectedPilot.price}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Per search</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: '1.3rem',
                  fontWeight: 700,
                  color: selectedPilot.available ? 'var(--primary)' : 'var(--gray-400)',
                }}>
                  {selectedPilot.available ? '🟢' : '🔴'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                  {selectedPilot.available ? 'Available' : 'Offline'}
                </div>
              </div>
            </div>

            {selectedPilot.thermal && (
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <span className="badge badge-green">🔥 Thermal</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {isAuthenticated ? (
                <button className="btn btn-primary" style={{ flex: 1 }}>
                  <FiNavigation size={16} /> Contact Pilot
                </button>
              ) : (
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => navigate('/register')}>
                  Sign Up to Contact
                </button>
              )}
            </div>
          </div>
        )}

        {/* Backdrop when popup is open */}
        {selectedPilot && (
          <div
            onClick={() => setSelectedPilot(null)}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 40 }}
          />
        )}
      </div>

      {/* Pilot List Bar */}
      <div style={{
        background: 'white',
        borderTop: '1px solid var(--gray-200)',
        padding: '1rem 2rem',
        overflowX: 'auto',
      }}>
        <div style={{ display: 'flex', gap: '1rem', minWidth: 'max-content' }}>
          <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', paddingRight: '1rem', borderRight: '1px solid var(--gray-200)' }}>
            <FiSearch size={16} />
            {filteredPilots.length} pilots found
          </div>
          {filteredPilots.map(pilot => (
            <div
              key={pilot.id}
              onClick={() => setSelectedPilot(pilot)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                cursor: 'pointer',
                background: selectedPilot?.id === pilot.id ? 'var(--primary-bg)' : 'transparent',
                border: '1px solid',
                borderColor: selectedPilot?.id === pilot.id ? 'var(--primary)' : 'var(--gray-200)',
                transition: 'all 0.2s',
              }}
            >
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: pilot.available ? 'var(--primary-bg)' : 'var(--gray-100)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '0.75rem',
                color: pilot.available ? 'var(--primary)' : 'var(--gray-400)',
              }}>
                {getInitials(pilot.name)}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{pilot.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{pilot.city}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

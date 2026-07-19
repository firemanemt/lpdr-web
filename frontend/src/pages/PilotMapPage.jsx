import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { pilotApi, mapApi } from '../services/api';
import { connectSocket, getSocket } from '../services/socket';
import LoadingSpinner from '../components/LoadingSpinner';
import { FiSearch, FiFilter, FiNavigation, FiStar, FiMapPin, FiX, FiCrosshair, FiPhone } from 'react-icons/fi';

// Fix default marker icons for Leaflet + bundlers
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Custom pilot icon
function pilotIcon(available) {
  return L.divIcon({
    className: 'custom-pilot-icon',
    html: `<div style="
      width: 36px; height: 36px; border-radius: 8px;
      background: ${available ? '#046bd2' : '#374151'};
      border: 2px solid ${available ? '#3b8de0' : '#4b5563'};
      box-shadow: ${available ? '0 0 16px rgba(4,107,210,0.4)' : 'none'};
      display: flex; align-items: center; justify-content: center;
      color: white; font-weight: 700; font-size: 0.7rem;
      font-family: 'JetBrains Mono', monospace;
    ">🛸</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
}

// User location icon
const userIcon = L.divIcon({
  className: 'custom-user-icon',
  html: `<div style="
    width: 18px; height: 18px; border-radius: 50%;
    background: #06b6d4; border: 3px solid white;
    box-shadow: 0 0 12px rgba(6,182,212,0.5);
  "></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

// Component to recenter map
function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 8, { duration: 1 });
  }, [center, map]);
  return null;
}

export default function PilotMapPage() {
  const { isAuthenticated, isPetOwner } = useAuth();
  const [selectedPilot, setSelectedPilot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterThermal, setFilterThermal] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([40.7128, -74.0060]); // Default NYC
  const navigate = useNavigate();

  const demoPilots = [
    { id: 'p1', name: 'Mike Rivers', lat: 42.4527, lng: -75.0636, city: 'Oneonta, NY', available: true, rating: 5.0, thermal: true, price: 150, bio: 'FAA Part 107 certified. Thermal drone specialist with 5+ years SAR experience.' },
    { id: 'p2', name: 'Jessica Chen', lat: 40.7128, lng: -74.0060, city: 'New York, NY', available: true, rating: 4.5, thermal: true, price: 200, bio: 'Experienced drone pilot and animal lover. Let me help bring them home.' },
    { id: 'p3', name: 'David Martinez', lat: 41.8781, lng: -87.6298, city: 'Chicago, IL', available: true, rating: 5.0, thermal: true, price: 250, bio: 'Former firefighter turned drone pilot. Thermal imaging expert.' },
    { id: 'p4', name: 'Amanda Lee', lat: 34.0522, lng: -118.2437, city: 'Los Angeles, CA', available: false, rating: 4.0, thermal: true, price: 100, bio: 'Animal rescue volunteer and certified drone pilot.' },
    { id: 'p5', name: 'Tom Bradley', lat: 29.7604, lng: -95.3698, city: 'Houston, TX', available: true, rating: 4.5, thermal: true, price: 175, bio: 'Full-time drone search specialist. 50+ families reunited.' },
    { id: 'p6', name: 'Sarah Williams', lat: 39.7392, lng: -104.9903, city: 'Denver, CO', available: true, rating: 4.0, thermal: false, price: 125, bio: 'Colorado-based drone pilot. Experienced in mountain terrain searches.' },
    { id: 'p7', name: 'James Wilson', lat: 47.6062, lng: -122.3321, city: 'Seattle, WA', available: false, rating: 4.5, thermal: true, price: 200, bio: 'Pacific Northwest drone pilot. Rain or shine.' },
    { id: 'p8', name: 'Emily Davis', lat: 33.4484, lng: -112.0740, city: 'Phoenix, AZ', available: true, rating: 5.0, thermal: true, price: 150, bio: 'Desert search specialist. Thermal imaging in extreme conditions.' },
  ];

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
          setMapCenter([loc.lat, loc.lng]);
        },
        () => {
          setUserLocation({ lat: 40.7128, lng: -74.0060 });
        }
      );
    }
    // Simulate loading
    setTimeout(() => setLoading(false), 500);
  }, []);

  const filteredPilots = demoPilots.filter(p => {
    if (filterThermal && !p.thermal) return false;
    return true;
  });

  if (loading) return <LoadingSpinner text="Loading tactical map..." />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      {/* Map Controls */}
      <div style={{
        position: 'absolute', top: '0.75rem', right: '0.75rem', zIndex: 1000,
        background: 'var(--bg-card)', padding: '0.75rem', borderRadius: '8px',
        border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-lg)',
      }}>
        <div style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <FiFilter size={12} /> Filters
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
          <input type="checkbox" checked={filterThermal} onChange={e => setFilterThermal(e.target.checked)} style={{ accentColor: 'var(--primary)' }} />
          Thermal drones only
        </label>
        {userLocation && (
          <button onClick={() => setMapCenter([userLocation.lat, userLocation.lng])} style={{
            marginTop: '0.5rem', width: '100%', padding: '0.4rem', borderRadius: '6px',
            background: 'var(--primary-bg)', border: '1px solid rgba(4,107,210,0.2)',
            color: 'var(--primary)', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer',
            fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
          }}>
            <FiCrosshair size={12} /> My Location
          </button>
        )}
      </div>

      {/* Legend */}
      <div style={{
        position: 'absolute', bottom: '3.5rem', left: '0.75rem', zIndex: 1000,
        background: 'var(--bg-card)', padding: '0.6rem 0.75rem', borderRadius: '8px',
        border: '1px solid var(--border-subtle)', fontSize: '0.7rem', fontFamily: 'var(--font-body)',
      }}>
        <div style={{ fontWeight: 600, marginBottom: '0.3rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.6rem' }}>Legend</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#046bd2', boxShadow: '0 0 6px rgba(4,107,210,0.4)' }} />
            <span style={{ color: 'var(--text-secondary)' }}>Available Pilot</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#374151' }} />
            <span style={{ color: 'var(--text-muted)' }}>Offline</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#06b6d4', border: '1.5px solid white' }} />
            <span style={{ color: 'var(--text-muted)' }}>You</span>
          </div>
        </div>
      </div>

      {/* Leaflet Map */}
      <MapContainer
        center={mapCenter}
        zoom={5}
        style={{ flex: 1, width: '100%' }}
        zoomControl={false}
        attributionControl={true}
      >
        <RecenterMap center={mapCenter} />
        
        {/* Dark map tiles */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* User location */}
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
            <Popup>
              <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}>📍 Your Location</div>
            </Popup>
          </Marker>
        )}

        {/* Pilot markers */}
        {filteredPilots.map(pilot => (
          <Marker key={pilot.id} position={[pilot.lat, pilot.lng]} icon={pilotIcon(pilot.available)}>
            <Popup maxWidth={280} minWidth={240}>
              <div style={{ fontFamily: "'Cabin Condensed', sans-serif", padding: '0.25rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>🛸</div>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#111827' }}>{pilot.name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                    <FiMapPin size={12} style={{ verticalAlign: 'middle' }} /> {pilot.city}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '0.75rem', fontSize: '0.85rem' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, color: '#046bd2' }}>{'⭐'.repeat(Math.round(pilot.rating))}</div>
                    <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>{pilot.rating}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, color: '#046bd2' }}>${pilot.price}</div>
                    <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>Per search</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, color: pilot.available ? '#10b981' : '#6b7280' }}>
                      {pilot.available ? '🟢' : '🔴'}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>{pilot.available ? 'Online' : 'Offline'}</div>
                  </div>
                </div>

                {pilot.bio && (
                  <p style={{ fontSize: '0.8rem', color: '#4b5563', lineHeight: 1.4, marginBottom: '0.75rem', textAlign: 'center' }}>
                    {pilot.bio}
                  </p>
                )}

                {pilot.thermal && (
                  <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ background: '#dbeafe', color: '#1e40af', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700 }}>🔥 THERMAL</span>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {isAuthenticated ? (
                    <button style={{
                      flex: 1, padding: '0.5rem', borderRadius: '6px',
                      background: '#046bd2', color: 'white', border: 'none',
                      fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer',
                      fontFamily: "'Cabin Condensed', sans-serif",
                    }}>
                      <FiNavigation size={12} style={{ verticalAlign: 'middle' }} /> Contact Pilot
                    </button>
                  ) : (
                    <button onClick={() => navigate('/register')} style={{
                      flex: 1, padding: '0.5rem', borderRadius: '6px',
                      background: '#046bd2', color: 'white', border: 'none',
                      fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer',
                      fontFamily: "'Cabin Condensed', sans-serif",
                    }}>
                      Sign Up to Contact
                    </button>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Service radius circles for available pilots */}
        {filteredPilots.filter(p => p.available).map(pilot => (
          <Circle
            key={`circle-${pilot.id}`}
            center={[pilot.lat, pilot.lng]}
            radius={pilot.radius ? pilot.radius * 1609.34 : 30000}
            pathOptions={{
              color: '#046bd2',
              fillColor: '#046bd2',
              fillOpacity: 0.05,
              weight: 1,
              dashArray: '4 8',
            }}
          />
        ))}
      </MapContainer>

      {/* Pilot List Bar */}
      <div style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-subtle)', padding: '0.6rem 1rem', overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: '0.5rem', minWidth: 'max-content', alignItems: 'center' }}>
          <div style={{ fontWeight: 600, fontSize: '0.7rem', color: 'var(--text-muted)', paddingRight: '0.75rem', borderRight: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-mono)' }}>
            <FiSearch size={12} /> {filteredPilots.length}
          </div>
          {filteredPilots.map(pilot => (
            <button key={pilot.id} onClick={() => setMapCenter([pilot.lat, pilot.lng])} style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.4rem 0.75rem', borderRadius: '6px', cursor: 'pointer',
              background: 'transparent', border: '1px solid var(--border-subtle)',
              transition: 'all 0.2s', color: 'var(--text-secondary)',
              fontFamily: 'var(--font-body)', fontSize: '0.8rem',
            }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: pilot.available ? '#046bd2' : '#6b7280', boxShadow: pilot.available ? '0 0 6px rgba(4,107,210,0.4)' : 'none' }} />
              <span style={{ fontWeight: 600 }}>{pilot.name}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontFamily: 'var(--font-mono)' }}>{pilot.city.split(',')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Leaflet CSS override for dark theme */}
      <style>{`
        .leaflet-container { background: #060a13 !important; }
        .leaflet-control-attribution { background: rgba(17,26,46,0.9) !important; color: #64748b !important; font-size: 0.6rem !important; border-radius: 4px 0 0 0 !important; }
        .leaflet-control-attribution a { color: #046bd2 !important; }
        .leaflet-popup-content-wrapper { background: #111a2e !important; color: #f1f5f9 !important; border-radius: 12px !important; border: 1px solid #253352 !important; box-shadow: 0 8px 24px rgba(0,0,0,0.5) !important; }
        .leaflet-popup-tip { background: #111a2e !important; border: 1px solid #253352 !important; }
        .leaflet-popup-close-button { color: #94a3b8 !important; }
        .leaflet-popup-close-button:hover { color: #f1f5f9 !important; }
        .custom-pilot-icon, .custom-user-icon { background: none !important; border: none !important; }
      `}</style>
    </div>
  );
}

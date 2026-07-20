import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { pilotApi, contentApi } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { FiSearch, FiFilter, FiNavigation, FiMapPin, FiCrosshair, FiGlobe } from 'react-icons/fi';

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

// Custom pilot icon (app pilots - blue square)
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

// WP website pilot icon (orange circle)
const wpPilotIcon = L.divIcon({
  className: 'custom-wp-pilot-icon',
  html: `<div style="
    width: 32px; height: 32px; border-radius: 50%;
    background: #fa9118; border: 2px solid #d97a0a;
    box-shadow: 0 0 12px rgba(250,145,24,0.4);
    display: flex; align-items: center; justify-content: center;
    color: white; font-weight: 700; font-size: 0.65rem;
    font-family: 'JetBrains Mono', monospace;
  ">🐾</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -18],
});

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
  const [loading, setLoading] = useState(true);
  const [filterThermal, setFilterThermal] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([39.8283, -98.5795]); // Center of USA
  const [appPilots, setAppPilots] = useState([]);
  const [wpPilots, setWpPilots] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadPilots();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
          setMapCenter([loc.lat, loc.lng]);
        },
        () => { setUserLocation(null); }
      );
    }
  }, []);

  const loadPilots = async () => {
    try {
      const [appRes, wpRes] = await Promise.all([
        pilotApi.list().catch(() => ({ data: { pilots: [] } })),
        contentApi.getWPPilots().catch(() => ({ data: { pilots: [] } })),
      ]);
      setAppPilots(appRes.data.pilots || []);
      setWpPilots(wpRes.data.pilots || []);
    } catch (err) {
      console.error('Failed to load pilots:', err);
    } finally {
      setLoading(false);
    }
  };

  // Map app pilots to display format
  const allAppPilots = appPilots.map(p => ({
    id: p.id,
    name: `${p.firstName} ${p.lastName}`,
    lat: p.profile?.base_lat,
    lng: p.profile?.base_lng,
    city: '',
    available: p.profile?.available || false,
    rating: p.profile?.average_rating || 0,
    thermal: p.equipment?.some(e => e.has_thermal) || false,
    price: p.pricing?.[0]?.amount || null,
    bio: p.profile?.bio || '',
    verified: p.profile?.verified || false,
    source: 'app',
  })).filter(p => p.lat && p.lng);

  // Map WP website pilots to display format
  const allWpPilots = wpPilots.map(p => ({
    id: p.id,
    name: p.name,
    lat: p.lat,
    lng: p.lng,
    city: p.city && p.state ? `${p.city}, ${p.state}` : (p.address || '').split(',').slice(-3).join(',').trim(),
    available: true,
    rating: null,
    thermal: true,
    price: null,
    bio: p.email ? `Contact: ${p.email}` : '',
    verified: true,
    source: 'website',
    email: p.email,
  })).filter(p => p.lat && p.lng);

  const allPilots = [...allAppPilots, ...allWpPilots];

  const filteredPilots = allPilots.filter(p => {
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
            <span style={{ color: 'var(--text-secondary)' }}>App Pilot</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fa9118', boxShadow: '0 0 6px rgba(250,145,24,0.4)' }} />
            <span style={{ color: 'var(--text-secondary)' }}>Website Pilot</span>
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
        zoom={4}
        style={{ flex: 1, width: '100%' }}
        zoomControl={false}
        attributionControl={true}
      >
        <RecenterMap center={mapCenter} />
        
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

        {/* App pilot markers (blue squares) */}
        {filteredPilots.filter(p => p.source === 'app').map(pilot => (
          <Marker key={pilot.id} position={[parseFloat(pilot.lat), parseFloat(pilot.lng)]} icon={pilotIcon(pilot.available)}>
            <Popup maxWidth={280} minWidth={240}>
              <div style={{ fontFamily: "'Cabin Condensed', sans-serif", padding: '0.25rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>🛸</div>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#111827' }}>{pilot.name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                    <FiMapPin size={12} style={{ verticalAlign: 'middle' }} /> {pilot.city}
                  </div>
                  {pilot.verified && <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 700, marginTop: '0.15rem' }}>✓ VERIFIED</div>}
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '0.75rem', fontSize: '0.85rem' }}>
                  {pilot.rating > 0 && (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 700, color: '#046bd2' }}>{'⭐'.repeat(Math.round(pilot.rating))}</div>
                      <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>{pilot.rating}</div>
                    </div>
                  )}
                  {pilot.price && (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 700, color: '#046bd2' }}>${pilot.price}</div>
                      <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>Per search</div>
                    </div>
                  )}
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

                {isAuthenticated ? (
                  <button style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: '#046bd2', color: 'white', border: 'none', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', fontFamily: "'Cabin Condensed', sans-serif" }}>
                    Contact Pilot
                  </button>
                ) : (
                  <button onClick={() => navigate('/register')} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: '#046bd2', color: 'white', border: 'none', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', fontFamily: "'Cabin Condensed', sans-serif" }}>
                    Sign Up to Contact
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* WP website pilot markers (orange circles) */}
        {filteredPilots.filter(p => p.source === 'website').map(pilot => (
          <Marker key={pilot.id} position={[parseFloat(pilot.lat), parseFloat(pilot.lng)]} icon={wpPilotIcon}>
            <Popup maxWidth={280} minWidth={240}>
              <div style={{ fontFamily: "'Cabin Condensed', sans-serif", padding: '0.25rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>🐾</div>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#111827' }}>{pilot.name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                    <FiMapPin size={12} style={{ verticalAlign: 'middle' }} /> {pilot.city}
                  </div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', color: '#fa9118', fontWeight: 700, marginTop: '0.15rem', background: '#fff7ed', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                    <FiGlobe size={10} /> From lostpetdronerecovery.com
                  </div>
                </div>

                {pilot.bio && (
                  <p style={{ fontSize: '0.8rem', color: '#4b5563', lineHeight: 1.4, marginBottom: '0.75rem', textAlign: 'center' }}>
                    {pilot.bio}
                  </p>
                )}

                <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ background: '#fef3c7', color: '#92400e', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700 }}>🔥 THERMAL</span>
                </div>

                {isAuthenticated ? (
                  <a href={`mailto:${pilot.email}`} style={{ display: 'block', width: '100%', padding: '0.5rem', borderRadius: '6px', background: '#fa9118', color: 'white', border: 'none', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', fontFamily: "'Cabin Condensed', sans-serif", textAlign: 'center', textDecoration: 'none' }}>
                    Contact Pilot
                  </a>
                ) : (
                  <button onClick={() => navigate('/register')} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: '#fa9118', color: 'white', border: 'none', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', fontFamily: "'Cabin Condensed', sans-serif" }}>
                    Sign Up to Contact
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Service radius circles */}
        {filteredPilots.filter(p => p.available).map(pilot => (
          <Circle
            key={`circle-${pilot.id}`}
            center={[parseFloat(pilot.lat), parseFloat(pilot.lng)]}
            radius={30000}
            pathOptions={{
              color: pilot.source === 'website' ? '#fa9118' : '#046bd2',
              fillColor: pilot.source === 'website' ? '#fa9118' : '#046bd2',
              fillOpacity: 0.04,
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
          {filteredPilots.slice(0, 15).map(pilot => (
            <button key={pilot.id} onClick={() => setMapCenter([parseFloat(pilot.lat), parseFloat(pilot.lng)])} style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.4rem 0.75rem', borderRadius: '6px', cursor: 'pointer',
              background: 'transparent', border: `1px solid ${pilot.source === 'website' ? 'rgba(250,145,24,0.3)' : 'var(--border-subtle)'}`,
              transition: 'all 0.2s', color: pilot.source === 'website' ? 'var(--accent)' : 'var(--text-secondary)',
              fontFamily: 'var(--font-body)', fontSize: '0.8rem',
            }}>
              <div style={{ width: '8px', height: '8px', borderRadius: pilot.source === 'website' ? '50%' : '3px', background: pilot.source === 'website' ? '#fa9118' : (pilot.available ? '#046bd2' : '#6b7280'), boxShadow: pilot.available ? (pilot.source === 'website' ? '0 0 6px rgba(250,145,24,0.4)' : '0 0 6px rgba(4,107,210,0.4)') : 'none' }} />
              <span style={{ fontWeight: 600 }}>{pilot.name}</span>
              {pilot.city && <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontFamily: 'var(--font-mono)' }}>{pilot.city.split(',')[0]}</span>}
            </button>
          ))}
          {filteredPilots.length > 15 && (
            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>+{filteredPilots.length - 15} more</span>
          )}
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
        .custom-pilot-icon, .custom-user-icon, .custom-wp-pilot-icon { background: none !important; border: none !important; }
      `}</style>
    </div>
  );
}

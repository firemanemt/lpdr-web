import { useState } from 'react';
import { Link, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiMenu, FiX, FiUser, FiLogOut, FiMapPin, FiClipboard, FiHome, FiMessageSquare } from 'react-icons/fi';

export default function Layout() {
  const { user, isAuthenticated, logout, isPetOwner, isDronePilot } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getDashboardLink = () => {
    if (isPetOwner) return '/owner/dashboard';
    if (isDronePilot) return '/pilot/dashboard';
    return '/';
  };

  const getInitials = () => {
    if (!user) return '?';
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="app-header">
        <div className="container">
          <Link to="/" className="app-logo">
            <img src="/lpdr-logo.png" alt="LPDR" style={{ height: '44px' }} />
            <span>LPDR</span>
          </Link>

          <button className="mobile-menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>

          <nav className={`nav-links ${menuOpen ? 'open' : ''}`}>
            {isAuthenticated ? (
              <>
                <Link to="/map">Find Pilots</Link>
                <Link to={getDashboardLink()}>Dashboard</Link>
                {isPetOwner && <Link to="/cases/new">Report Lost Pet</Link>}
                
                <div className="user-menu">
                  <Link to={getDashboardLink()} className="user-avatar" title={`${user?.firstName} ${user?.lastName}`}>
                    {getInitials()}
                  </Link>
                  <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
                    <FiLogOut size={14} />
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/">Home</Link>
                <Link to="/map">Find Pilots</Link>
                <Link to="/about">About</Link>
                <Link to="/faqs">FAQs</Link>
                <Link to="/login" className="btn btn-primary btn-sm">Sign In</Link>
                <Link to="/register" className="btn btn-secondary btn-sm">Get Started</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer style={{
        background: '#111827',
        color: '#9ca3af',
        padding: '2rem 0',
        marginTop: 'auto',
      }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '2rem',
            marginBottom: '2rem',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <img src="/lpdr-logo.png" alt="LPDR" style={{ height: '36px' }} />
                <span style={{ color: 'white', fontWeight: 800, fontSize: '1.1rem', fontFamily: 'var(--font-display)' }}>LPDR</span>
              </div>
              <p style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>
                Connecting pet owners with drone pilots to find lost pets. 
                Lost pets. Found faster.
              </p>
            </div>
            <div>
              <h4 style={{ color: 'white', marginBottom: '0.75rem' }}>Quick Links</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
                <Link to="/" style={{ color: '#9ca3af', textDecoration: 'none' }}>Home</Link>
                <Link to="/map" style={{ color: '#9ca3af', textDecoration: 'none' }}>Find a Pilot</Link>
                <Link to="/about" style={{ color: '#9ca3af', textDecoration: 'none' }}>About Us</Link>
                <Link to="/faqs" style={{ color: '#9ca3af', textDecoration: 'none' }}>FAQs</Link>
              </div>
            </div>
            <div>
              <h4 style={{ color: 'white', marginBottom: '0.75rem' }}>Contact</h4>
              <p style={{ fontSize: '0.9rem' }}>
                Based in Oneonta, NY<br />
                <a href="mailto:support@lostpetdronerecovery.com" style={{ color: '#046bd2', textDecoration: 'none' }}>
                  support@lostpetdronerecovery.com
                </a>
              </p>
            </div>
          </div>
          <div style={{
            borderTop: '1px solid #374151',
            paddingTop: '1.5rem',
            textAlign: 'center',
            fontSize: '0.85rem',
          }}>
            &copy; {new Date().getFullYear()} Lost Pet Drone Recovery. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

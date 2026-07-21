import { useState } from 'react';
import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiHome, FiMapPin, FiPlusCircle, FiUser, FiLogOut, FiMenu, FiX, FiMessageSquare, FiSearch, FiBell, FiRadio, FiUserCheck } from 'react-icons/fi';

export default function Layout() {
  const { user, isAuthenticated, logout, isPetOwner, isDronePilot } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

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

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname === path) return true;
    return false;
  };

  return (
    <div className="app-shell">
      {/* Top Bar */}
      <header className="top-bar">
        <Link to="/" className="top-bar-logo">
          <img src="/lpdr-logo.png" alt="LPDR" />
          <span>LPDR</span>
        </Link>
        
        <div className="top-bar-actions">
          {isAuthenticated ? (
            <>
              <button className="top-bar-btn" onClick={handleLogout} title="Sign Out">
                <FiLogOut size={16} />
              </button>
              <Link to={getDashboardLink()} className="top-bar-avatar" title={`${user?.firstName} ${user?.lastName}`}>
                {getInitials()}
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" className="top-bar-btn" title="Sign In">
                <FiUser size={16} />
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="app-content">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      {isAuthenticated ? (
        <nav className="bottom-nav">
          <Link to="/" className={`bottom-nav-item ${location.pathname === '/' ? 'active' : ''}`}>
            <FiHome size={20} />
            Home
          </Link>
          <Link to="/live" className={`bottom-nav-item ${isActive('/live') ? 'active' : ''}`}>
            <FiRadio size={20} />
            Live
          </Link>
          {isPetOwner && (
            <Link to="/cases/new" className={`bottom-nav-item ${isActive('/cases/new') ? 'active' : ''}`}>
              <FiPlusCircle size={20} />
              Report
            </Link>
          )}
          <Link to="/map" className={`bottom-nav-item ${isActive('/map') ? 'active' : ''}`}>
            <FiMapPin size={20} />
            Map
          </Link>
          <Link to={isDronePilot ? '/pilot/profile' : isPetOwner ? '/owner/dashboard' : '/admin'} className={`bottom-nav-item ${location.pathname === '/pilot/profile' || location.pathname === '/owner/dashboard' ? 'active' : ''}`}>
            <FiUser size={20} />
            Profile
          </Link>
        </nav>
      ) : (
        <nav className="bottom-nav">
          <Link to="/" className={`bottom-nav-item ${isActive('/') && location.pathname === '/' ? 'active' : ''}`}>
            <FiHome size={20} />
            Home
          </Link>
          <Link to="/live" className={`bottom-nav-item ${isActive('/live') ? 'active' : ''}`}>
            <FiRadio size={20} />
            Live
          </Link>
          <Link to="/map" className={`bottom-nav-item ${isActive('/map') ? 'active' : ''}`}>
            <FiMapPin size={20} />
            Map
          </Link>
          <Link to="/about" className={`bottom-nav-item ${isActive('/about') ? 'active' : ''}`}>
            <FiSearch size={20} />
            About
          </Link>
          <Link to="/login" className={`bottom-nav-item ${isActive('/login') ? 'active' : ''}`}>
            <FiUser size={20} />
            Sign In
          </Link>
        </nav>
      )}
    </div>
  );
}

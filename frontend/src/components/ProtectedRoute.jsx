import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

export default function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <LoadingSpinner text="Checking authentication..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole && user?.role !== 'admin') {
    // Redirect to appropriate dashboard
    if (user?.role === 'pet_owner') return <Navigate to="/owner/dashboard" replace />;
    if (user?.role === 'drone_pilot') return <Navigate to="/pilot/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
}

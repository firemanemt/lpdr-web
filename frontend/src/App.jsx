import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OwnerDashboard from './pages/OwnerDashboard';
import PilotDashboard from './pages/PilotDashboard';
import SubmitCasePage from './pages/SubmitCasePage';
import CaseDetailPage from './pages/CaseDetailPage';
import PilotMapPage from './pages/PilotMapPage';
import FAQsPage from './pages/FAQsPage';
import AboutPage from './pages/AboutPage';
import LiveCasesPage from './pages/LiveCasesPage';
import LiveCaseDetailPage from './pages/LiveCaseDetailPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '12px',
              background: '#1f2937',
              color: '#fff',
              fontSize: '0.9rem',
            },
            success: {
              iconTheme: { primary: '#046bd2', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#fff' },
            },
          }}
        />
        <Routes>
          <Route element={<Layout />}>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/map" element={<PilotMapPage />} />
            <Route path="/faqs" element={<FAQsPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/live" element={<LiveCasesPage />} />
            <Route path="/live/:id" element={<LiveCaseDetailPage />} />

            {/* Pet Owner Routes */}
            <Route path="/owner/dashboard" element={
              <ProtectedRoute requiredRole="pet_owner">
                <OwnerDashboard />
              </ProtectedRoute>
            } />
            <Route path="/cases/new" element={
              <ProtectedRoute requiredRole="pet_owner">
                <SubmitCasePage />
              </ProtectedRoute>
            } />
            <Route path="/cases/:id" element={
              <ProtectedRoute>
                <CaseDetailPage />
              </ProtectedRoute>
            } />

            {/* Pilot Routes */}
            <Route path="/pilot/dashboard" element={
              <ProtectedRoute requiredRole="drone_pilot">
                <PilotDashboard />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

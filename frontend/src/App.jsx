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
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import PilotVerificationPage from './pages/PilotVerificationPage';
import PilotProfilePage from './pages/PilotProfilePage';
import PilotToolsPage from './pages/PilotToolsPage';
import AdminDashboard from './pages/AdminDashboard';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: '8px',
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              border: '1px solid var(--border-default)',
              fontFamily: 'var(--font-body)',
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
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

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
            <Route path="/pilot/verification" element={
              <ProtectedRoute requiredRole="drone_pilot">
                <PilotVerificationPage />
              </ProtectedRoute>
            } />
            <Route path="/pilot/profile" element={
              <ProtectedRoute requiredRole="drone_pilot">
                <PilotProfilePage />
              </ProtectedRoute>
            } />
            <Route path="/pilot/tools" element={
              <ProtectedRoute requiredRole="drone_pilot">
                <PilotToolsPage />
              </ProtectedRoute>
            } />
            <Route path="/pilot/tools/:caseId" element={
              <ProtectedRoute requiredRole="drone_pilot">
                <PilotToolsPage />
              </ProtectedRoute>
            } />

            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } />

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

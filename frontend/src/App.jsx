import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import HomePage      from './pages/HomePage';
import LoginPage     from './pages/LoginPage';
import RegisterPage  from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AnalyticsPage from './pages/Analytics';
import AccessPage    from './pages/AccessPage';
import SettingsPage  from './pages/SettingsPage';

// Only routes with real backend support:
// /api/auth  → login, register, profile
// /api/subscriptions → dashboard, analytics, access/overload

const protect = (El) => <ProtectedRoute><El /></ProtectedRoute>;

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/"         element={<HomePage />} />
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected — subscription-backed pages */}
          <Route path="/dashboard" element={protect(DashboardPage)} />
          <Route path="/analytics" element={protect(AnalyticsPage)} />
          <Route path="/access"    element={protect(AccessPage)} />
          <Route path="/settings"  element={protect(SettingsPage)} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <ToastContainer
          position="top-right" autoClose={3500}
          hideProgressBar={false} newestOnTop closeOnClick pauseOnHover draggable theme="light"
          toastStyle={{
            background: '#FFFFFF', border: '1px solid #E5E3F5',
            borderRadius: '12px', fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: '0.88rem', color: '#111827',
            boxShadow: '0 4px 16px rgba(99,102,241,.12)',
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

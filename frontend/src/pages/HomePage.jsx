import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const HomePage = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return null;

  // Redirect authenticated users to dashboard, others to login
  return isAuthenticated ? (
    <Navigate to="/dashboard" replace />
  ) : (
    <Navigate to="/login" replace />
  );
};

export default HomePage;

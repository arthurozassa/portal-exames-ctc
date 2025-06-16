import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function LGPDProtectedRoute({ children }) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user && !user.hasAcceptedLGPD) {
    return <Navigate to="/lgpd-consent" replace />;
  }

  return children;
}
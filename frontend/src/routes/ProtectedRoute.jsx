import { Navigate, Outlet } from 'react-router-dom';
import FullPageSpinner from '../components/FullPageSpinner.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute() {
  const { user, isCheckingSession } = useAuth();

  if (isCheckingSession) return <FullPageSpinner />;
  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
}

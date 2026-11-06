import { Navigate, Outlet } from 'react-router-dom';
import FullPageSpinner from '../components/FullPageSpinner.jsx';
import { useAuth } from '../context/AuthContext.jsx';

/** Pages such as login and register that a logged-in user should not see. */
export default function PublicOnlyRoute() {
  const { user, isCheckingSession } = useAuth();

  if (isCheckingSession) return <FullPageSpinner />;
  if (user) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}

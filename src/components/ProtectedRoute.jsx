import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router';

function ProtectedRoute({ children }) {
  const currentUser = useSelector((state) => state.auth.currentUser);
  const location = useLocation();
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return children;
}

export default ProtectedRoute;

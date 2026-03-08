import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import LoadingScreen from '../components/ui/LoadingScreen';

export const RequireAuth = () => {
  const location = useLocation();
  const { user, isBootstrapping } = useAuthStore((state) => ({
    user: state.user,
    isBootstrapping: state.isBootstrapping
  }));

  if (isBootstrapping) {
    return <LoadingScreen label="Iniciando sesión..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export const RequireRole = ({ allowedRoles }) => {
  const role = useAuthStore((state) => state.role);

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/no-autorizado" replace />;
  }

  return <Outlet />;
};

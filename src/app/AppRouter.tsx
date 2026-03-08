import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import LoadingScreen from '../components/ui/LoadingScreen';
import { useAuthStore } from '../store/authStore';
import { RequireAuth, RequireRole } from './guards';

const LoginPage = lazy(() => import('../pages/LoginPage'));
const UserDashboardPage = lazy(() => import('../pages/UserDashboardPage'));
const AdminDashboardPage = lazy(() => import('../pages/AdminDashboardPage'));
const UnauthorizedPage = lazy(() => import('../pages/UnauthorizedPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

const HomeRedirect = () => {
  const { user, role, isBootstrapping } = useAuthStore((state) => ({
    user: state.user,
    role: state.role,
    isBootstrapping: state.isBootstrapping
  }));

  if (isBootstrapping) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return role === 'admin' ? <Navigate to="/admin" replace /> : <Navigate to="/usuario" replace />;
};

const AppRouter = () => {
  const fallback = <LoadingScreen label="Cargando módulo..." />;

  return (
    <Suspense fallback={fallback}>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/no-autorizado" element={<UnauthorizedPage />} />

        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route element={<RequireRole allowedRoles={['user', 'admin']} />}>
              <Route path="/usuario" element={<UserDashboardPage />} />
            </Route>

            <Route element={<RequireRole allowedRoles={['admin']} />}>
              <Route path="/admin" element={<AdminDashboardPage />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};

export default AppRouter;

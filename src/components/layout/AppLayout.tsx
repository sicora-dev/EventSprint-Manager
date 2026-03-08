import { LayoutDashboard, LogOut, ShieldCheck, UserCircle2 } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import RoleBadge from '../ui/RoleBadge';
import { useAuthStore } from '../../store/authStore';

const navClass = ({ isActive }) => `btn btn-sm nav-btn ${isActive ? 'active' : ''}`;

const AppLayout = () => {
  const navigate = useNavigate();
  const { user, role, logout } = useAuthStore((state) => ({
    user: state.user,
    role: state.role,
    logout: state.logout
  }));

  const appName = import.meta.env.VITE_APP_NAME || 'EventSprint Manager';

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Sesion cerrada correctamente');
      navigate('/login', { replace: true });
    } catch (error) {
      toast.error(error.message || 'No se pudo cerrar sesion');
    }
  };

  return (
    <div className="app-shell">
      <header className="top-header">
        <div className="container-fluid app-container py-3">
          <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap">
            <div>
              <p className="eyebrow mb-1">Proyecto EVA2</p>
              <h1 className="h4 mb-0 app-title">{appName}</h1>
            </div>

            <div className="d-flex align-items-center gap-2 flex-wrap">
              <RoleBadge role={role} />
              <span className="user-pill d-inline-flex align-items-center gap-2">
                <UserCircle2 size={16} strokeWidth={1.9} />
                {user?.email}
              </span>
              <button className="btn btn-outline-light btn-sm d-inline-flex align-items-center gap-2" onClick={handleLogout}>
                <LogOut size={15} strokeWidth={2} />
                Cerrar sesion
              </button>
            </div>
          </div>
        </div>
      </header>

      <nav className="main-nav border-bottom border-light-subtle">
        <div className="container-fluid app-container py-2 d-flex gap-2 flex-wrap">
          <NavLink className={navClass} to="/usuario">
            <span className="d-inline-flex align-items-center gap-2">
              <LayoutDashboard size={15} strokeWidth={2} />
              Panel usuario
            </span>
          </NavLink>
          {role === 'admin' && (
            <>
              <NavLink className={navClass} to="/admin">
                <span className="d-inline-flex align-items-center gap-2">
                  <ShieldCheck size={15} strokeWidth={2} />
                  Panel admin
                </span>
              </NavLink>
            </>
          )}
        </div>
      </nav>

      <main className="container-fluid app-container py-4">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;

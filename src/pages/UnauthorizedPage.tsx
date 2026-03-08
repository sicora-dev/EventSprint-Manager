import { ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

const UnauthorizedPage = () => (
  <main className="auth-page">
    <div className="container-fluid app-container py-5 text-center">
      <section className="auth-card section-enter p-4 p-md-5">
        <p className="eyebrow dark mb-1">Error 403</p>
        <h1 className="h4 d-inline-flex align-items-center gap-2">
          <ShieldAlert size={18} strokeWidth={2} />
          Sin permisos
        </h1>
        <p className="text-secondary">No tienes permisos para acceder a esta seccion.</p>
        <Link className="btn btn-dark" to="/usuario">
          Ir al panel de usuario
        </Link>
      </section>
    </div>
  </main>
);

export default UnauthorizedPage;

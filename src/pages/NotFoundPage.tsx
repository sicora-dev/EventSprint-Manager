import { RouteOff } from 'lucide-react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => (
  <main className="auth-page">
    <div className="container-fluid app-container py-5 text-center">
      <section className="auth-card section-enter p-4 p-md-5">
        <p className="eyebrow dark mb-1">Error 404</p>
        <h1 className="h4 d-inline-flex align-items-center gap-2">
          <RouteOff size={18} strokeWidth={2} />
          Ruta no encontrada
        </h1>
        <p className="text-secondary">La pagina solicitada no existe en esta aplicacion.</p>
        <Link className="btn btn-dark" to="/">
          Volver al inicio
        </Link>
      </section>
    </div>
  </main>
);

export default NotFoundPage;

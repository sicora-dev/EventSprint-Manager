const LoadingScreen = ({ label = 'Cargando...' }) => (
  <main className="loading-screen">
    <div className="spinner-border text-dark" role="status" aria-hidden="true" />
    <p className="mt-3 mb-0">{label}</p>
  </main>
);

export default LoadingScreen;

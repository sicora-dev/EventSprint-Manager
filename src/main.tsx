import { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import AppRouter from './app/AppRouter';
import { useAuthStore } from './store/authStore';
import './styles/global.css';

const AppInitializer = () => {
  const bootstrap = useAuthStore((state) => state.bootstrap);
  const prepareAuthListener = useAuthStore((state) => state.prepareAuthListener);

  useEffect(() => {
    bootstrap();

    const unsubscribe = prepareAuthListener();

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [bootstrap, prepareAuthListener]);

  return (
    <>
      <AppRouter />
      <ToastContainer
        position="bottom-right"
        autoClose={2600}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
      />
    </>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AppInitializer />
  </BrowserRouter>
);

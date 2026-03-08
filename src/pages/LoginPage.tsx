import { KeyRound, LogIn, UserPlus2, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuthStore } from '../store/authStore';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState('login');

  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);
  const currentUser = useAuthStore((state) => state.user);
  const currentRole = useAuthStore((state) => state.role);

  const {
    register: registerField,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    reset
  } = useForm({
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
  });

  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    if (currentRole === 'admin') {
      navigate('/admin', { replace: true });
      return;
    }

    navigate('/usuario', { replace: true });
  }, [currentRole, currentUser, navigate]);

  const redirectByRole = (role) => {
    if (role === 'admin') {
      navigate('/admin', { replace: true });
      return;
    }

    if (from !== '/login' && from !== '/') {
      navigate(from, { replace: true });
      return;
    }

    navigate('/usuario', { replace: true });
  };

  const onSubmit = async (values) => {
    try {
      if (mode === 'login') {
        const role = await login({ email: values.email, password: values.password });
        toast.success('Bienvenido');
        redirectByRole(role);
        return;
      }

      const role = await register({
        displayName: values.displayName,
        email: values.email,
        password: values.password
      });

      if (role === 'pending_confirmation') {
        toast.info('Cuenta creada. Revisa tu email para confirmar la sesion.');
      } else {
        toast.success('Cuenta creada correctamente');
        redirectByRole(role);
      }
    } catch (error) {
      toast.error(error.message || 'No se pudo completar la operacion');
    }
  };

  return (
    <main className="auth-page">
      <div className="container-fluid app-container py-4 py-md-5">
        <div className="row justify-content-center">
          <div className="col-12 col-lg-8 col-xl-6">
            <section className="auth-card section-enter">
              <header className="d-flex justify-content-between align-items-start gap-3 mb-4 flex-wrap">
                <div>
                  <p className="eyebrow dark mb-1">Acceso seguro</p>
                  <h2 className="h4 mb-1 d-inline-flex align-items-center gap-2">
                    <KeyRound size={18} strokeWidth={2} />
                    Acceso de cuenta
                  </h2>
                  <p className="text-secondary small mb-0">Ingresa con tu cuenta para continuar.</p>
                </div>
                <div className="btn-group" role="group" aria-label="Modo de autenticacion">
                  <button
                    type="button"
                    className={`btn btn-sm mode-btn ${mode === 'login' ? 'active' : ''}`}
                    onClick={() => {
                      setMode('login');
                      reset();
                    }}
                  >
                    <LogIn size={14} strokeWidth={2} />
                    Login
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm mode-btn ${mode === 'register' ? 'active' : ''}`}
                    onClick={() => {
                      setMode('register');
                      reset();
                    }}
                  >
                    <UserPlus2 size={14} strokeWidth={2} />
                    Registro
                  </button>
                </div>
              </header>

              <form className="row g-3" onSubmit={handleSubmit(onSubmit)} noValidate>
                {mode === 'register' && (
                  <div className="col-12">
                    <label htmlFor="displayName" className="form-label">
                      Nombre visible
                    </label>
                    <input
                      id="displayName"
                      className={`form-control ${errors.displayName ? 'is-invalid' : ''}`}
                      placeholder="Tu nombre"
                      {...registerField('displayName', {
                        required: 'Este campo es obligatorio',
                        minLength: {
                          value: 2,
                          message: 'Minimo 2 caracteres'
                        }
                      })}
                    />
                    {errors.displayName && <div className="invalid-feedback">{errors.displayName.message}</div>}
                  </div>
                )}

                <div className="col-12 col-md-6">
                  <label htmlFor="email" className="form-label">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                    placeholder="nombre@dominio.com"
                    {...registerField('email', {
                      required: 'El email es obligatorio',
                      pattern: {
                        value: /^\S+@\S+\.\S+$/,
                        message: 'Formato de email no valido'
                      }
                    })}
                  />
                  {errors.email && <div className="invalid-feedback">{errors.email.message}</div>}
                </div>

                <div className="col-12 col-md-6">
                  <label htmlFor="password" className="form-label">
                    Contrasena
                  </label>
                  <input
                    id="password"
                    type="password"
                    className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                    placeholder="********"
                    {...registerField('password', {
                      required: 'La contrasena es obligatoria',
                      minLength: {
                        value: 6,
                        message: 'Minimo 6 caracteres'
                      }
                    })}
                  />
                  {errors.password && <div className="invalid-feedback">{errors.password.message}</div>}
                </div>

                {mode === 'register' && (
                  <div className="col-12 col-md-6">
                    <label htmlFor="confirmPassword" className="form-label">
                      Repite contrasena
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                      {...registerField('confirmPassword', {
                        required: 'Confirma tu contrasena',
                        validate: (value) => value === watch('password') || 'Las contrasenas no coinciden'
                      })}
                    />
                    {errors.confirmPassword && <div className="invalid-feedback">{errors.confirmPassword.message}</div>}
                  </div>
                )}

                <div className="col-12 d-flex align-items-center justify-content-between gap-3 flex-wrap mt-2">
                  <button className="btn btn-dark d-inline-flex align-items-center gap-2" type="submit" disabled={isSubmitting}>
                    {mode === 'login' ? <LogIn size={15} strokeWidth={2} /> : <UserRound size={15} strokeWidth={2} />}
                    {isSubmitting ? 'Procesando...' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
                  </button>
                </div>
              </form>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
};

export default LoginPage;

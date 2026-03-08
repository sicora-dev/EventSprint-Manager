import { CalendarClock, CalendarPlus2, MapPin, RefreshCw, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import AssistantDock from '../components/ai/AssistantDock';
import StatusBadge from '../components/ui/StatusBadge';
import { createEvent, deleteEvent, getEvents, patchEvent } from '../services/eventsService';
import { useAuthStore } from '../store/authStore';
import { formatDateTime } from '../utils/formatters';

const UserDashboardPage = () => {
  const user = useAuthStore((state) => state.user);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const {
    register,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: {
      title: '',
      description: '',
      location: '',
      eventDate: '',
      priority: 'medium'
    }
  });

  const refreshEvents = useCallback(async () => {
    setLoading(true);
    try {
      const records = await getEvents({ isAdmin: false, userId: user.id });
      setEvents(records);
    } catch (error) {
      toast.error(error.message || 'No se pudieron cargar los eventos');
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    refreshEvents();
  }, [refreshEvents]);

  const onSubmit = async (values) => {
    try {
      const newEvent = await createEvent({
        owner_id: user.id,
        title: values.title,
        description: values.description,
        location: values.location,
        event_date: values.eventDate,
        priority: values.priority,
        status: 'planned'
      });

      setEvents((prev) => [...prev, newEvent]);
      reset();
      toast.success('Evento creado');
    } catch (error) {
      toast.error(error.message || 'No se pudo crear el evento');
    }
  };

  const handleStatusChange = async (eventId, status) => {
    setBusyId(eventId);
    try {
      const updated = await patchEvent(eventId, { status });
      setEvents((prev) => prev.map((item) => (item.id === eventId ? updated : item)));
      toast.success('Estado actualizado');
    } catch (error) {
      toast.error(error.message || 'No se pudo actualizar el estado');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (eventId) => {
    setBusyId(eventId);
    try {
      await deleteEvent(eventId);
      setEvents((prev) => prev.filter((item) => item.id !== eventId));
      toast.success('Evento eliminado');
    } catch (error) {
      toast.error(error.message || 'No se pudo eliminar');
    } finally {
      setBusyId(null);
    }
  };

  const upcomingCount = useMemo(() => events.filter((item) => item.status !== 'done').length, [events]);

  return (
    <section className="page-stack section-enter">
      <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap">
        <div>
          <p className="eyebrow dark mb-1">Panel de usuario</p>
          <h2 className="h4 mb-0 d-inline-flex align-items-center gap-2">
            <CalendarClock size={18} strokeWidth={2} />
            Mis eventos
          </h2>
        </div>
        <div className="card-kpi">
          <span>Pendientes</span>
          <strong>{upcomingCount}</strong>
        </div>
      </div>

      <article className="card surface p-3 p-md-4">
        <h3 className="h6 mb-3 d-inline-flex align-items-center gap-2">
          <CalendarPlus2 size={16} strokeWidth={2} />
          Crear evento
        </h3>

        <form className="row g-3" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="col-12 col-md-6">
            <label className="form-label">Titulo</label>
            <input
              className={`form-control ${errors.title ? 'is-invalid' : ''}`}
              placeholder="Concierto, feria, meetup"
              {...register('title', { required: 'Campo obligatorio' })}
            />
            {errors.title && <div className="invalid-feedback">{errors.title.message}</div>}
          </div>

          <div className="col-12 col-md-6">
            <label className="form-label">Ubicacion</label>
            <input
              className={`form-control ${errors.location ? 'is-invalid' : ''}`}
              placeholder="Madrid, sala principal"
              {...register('location', { required: 'Campo obligatorio' })}
            />
            {errors.location && <div className="invalid-feedback">{errors.location.message}</div>}
          </div>

          <div className="col-12 col-md-6">
            <label className="form-label">Fecha y hora</label>
            <input
              type="datetime-local"
              className={`form-control ${errors.eventDate ? 'is-invalid' : ''}`}
              {...register('eventDate', { required: 'Campo obligatorio' })}
            />
            {errors.eventDate && <div className="invalid-feedback">{errors.eventDate.message}</div>}
          </div>

          <div className="col-12 col-md-6">
            <label className="form-label">Prioridad</label>
            <select className="form-select" {...register('priority')}>
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
            </select>
          </div>

          <div className="col-12">
            <label className="form-label">Descripcion</label>
            <textarea
              className={`form-control ${errors.description ? 'is-invalid' : ''}`}
              rows={3}
              {...register('description', {
                required: 'Campo obligatorio',
                minLength: {
                  value: 10,
                  message: 'Minimo 10 caracteres'
                }
              })}
            />
            {errors.description && <div className="invalid-feedback">{errors.description.message}</div>}
          </div>

          <div className="col-12">
            <button type="submit" className="btn btn-dark d-inline-flex align-items-center gap-2" disabled={isSubmitting}>
              <CalendarPlus2 size={15} strokeWidth={2} />
              {isSubmitting ? 'Guardando...' : 'Crear evento'}
            </button>
          </div>
        </form>
      </article>

      <article className="card surface p-3 p-md-4">
        <div className="d-flex align-items-center justify-content-between gap-2 mb-3 flex-wrap">
          <h3 className="h6 mb-0">Listado de eventos</h3>
          <button className="btn btn-sm btn-outline-dark d-inline-flex align-items-center gap-2" onClick={refreshEvents}>
            <RefreshCw size={14} strokeWidth={2} />
            Actualizar
          </button>
        </div>

        {loading ? (
          <p className="mb-0">Cargando eventos...</p>
        ) : events.length === 0 ? (
          <p className="mb-0">Todavia no tienes eventos creados.</p>
        ) : (
          <div className="events-grid">
            {events.map((event, index) => (
              <article key={event.id} className="event-card" style={{ animationDelay: `${index * 60}ms` }}>
                <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                  <h4 className="h6 mb-0 text-truncate">{event.title}</h4>
                  <StatusBadge status={event.status} />
                </div>

                <p className="small mb-2">{event.description}</p>

                <p className="small mb-1 d-inline-flex align-items-center gap-1">
                  <MapPin size={14} strokeWidth={2} />
                  {event.location}
                </p>

                <p className="small mb-3 d-inline-flex align-items-center gap-1">
                  <CalendarClock size={14} strokeWidth={2} />
                  {formatDateTime(event.event_date)}
                </p>

                <div className="d-flex gap-2 flex-wrap">
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => handleStatusChange(event.id, 'planned')}
                    disabled={busyId === event.id}
                  >
                    Planificado
                  </button>
                  <button
                    className="btn btn-sm btn-outline-warning"
                    onClick={() => handleStatusChange(event.id, 'in_progress')}
                    disabled={busyId === event.id}
                  >
                    En progreso
                  </button>
                  <button
                    className="btn btn-sm btn-outline-success"
                    onClick={() => handleStatusChange(event.id, 'done')}
                    disabled={busyId === event.id}
                  >
                    Completado
                  </button>
                  <button
                    className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1"
                    onClick={() => handleDelete(event.id)}
                    disabled={busyId === event.id}
                  >
                    <Trash2 size={13} strokeWidth={2} />
                    Eliminar
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </article>

      <AssistantDock onDataChanged={refreshEvents} />
    </section>
  );
};

export default UserDashboardPage;

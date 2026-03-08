import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import {
  BarChart3,
  CalendarCheck2,
  Plus,
  RefreshCw,
  Save,
  Shield,
  ToggleRight,
  Trash2
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import AssistantDock from '../components/ai/AssistantDock';
import StatusBadge from '../components/ui/StatusBadge';
import { createEvent, deleteEvent, getEvents, patchEvent, replaceEvent } from '../services/eventsService';
import { useAuthStore } from '../store/authStore';
import { formatDateTime, toDateInputValue } from '../utils/formatters';

const CHART_COLORS = ['#0f172a', '#1d4ed8', '#22c55e'];

const AdminDashboardPage = () => {
  const user = useAuthStore((state) => state.user);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState({});
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
      priority: 'high'
    }
  });

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const records = await getEvents({ isAdmin: true, userId: user.id });
      setEvents(records);
      setDrafts(
        records.reduce((acc, item) => {
          acc[item.id] = {
            title: item.title,
            description: item.description,
            location: item.location,
            event_date: toDateInputValue(item.event_date),
            priority: item.priority,
            status: item.status
          };
          return acc;
        }, {})
      );
    } catch (error) {
      toast.error(error.message || 'No se pudo cargar el panel admin');
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const onCreate = async (values) => {
    try {
      const created = await createEvent({
        owner_id: user.id,
        title: values.title,
        description: values.description,
        location: values.location,
        event_date: values.eventDate,
        priority: values.priority,
        status: 'planned'
      });

      setEvents((prev) => [...prev, created]);
      setDrafts((prev) => ({
        ...prev,
        [created.id]: {
          title: created.title,
          description: created.description,
          location: created.location,
          event_date: toDateInputValue(created.event_date),
          priority: created.priority,
          status: created.status
        }
      }));
      reset();
      toast.success('Evento creado');
    } catch (error) {
      toast.error(error.message || 'No se pudo crear el evento');
    }
  };

  const updateDraft = (eventId, field, value) => {
    setDrafts((prev) => ({
      ...prev,
      [eventId]: {
        ...prev[eventId],
        [field]: value
      }
    }));
  };

  const handlePut = async (eventId) => {
    setBusyId(eventId);
    try {
      const payload = drafts[eventId];
      const updated = await replaceEvent(eventId, {
        title: payload.title,
        description: payload.description,
        location: payload.location,
        event_date: payload.event_date,
        priority: payload.priority,
        status: payload.status
      });

      setEvents((prev) => prev.map((item) => (item.id === eventId ? updated : item)));
      toast.success('Evento guardado');
    } catch (error) {
      toast.error(error.message || 'No se pudo guardar el evento');
    } finally {
      setBusyId(null);
    }
  };

  const handlePatch = async (eventId) => {
    setBusyId(eventId);
    try {
      const source = drafts[eventId]?.status;
      const nextStatus = source === 'done' ? 'in_progress' : 'done';
      const updated = await patchEvent(eventId, { status: nextStatus });

      setEvents((prev) => prev.map((item) => (item.id === eventId ? updated : item)));
      setDrafts((prev) => ({
        ...prev,
        [eventId]: {
          ...prev[eventId],
          status: nextStatus
        }
      }));
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
      setDrafts((prev) => {
        const clone = { ...prev };
        delete clone[eventId];
        return clone;
      });
      toast.success('Evento eliminado');
    } catch (error) {
      toast.error(error.message || 'No se pudo eliminar');
    } finally {
      setBusyId(null);
    }
  };

  const stats = useMemo(() => {
    const byStatus = { planned: 0, in_progress: 0, done: 0 };
    const byPriority = { low: 0, medium: 0, high: 0 };

    events.forEach((event) => {
      byStatus[event.status] += 1;
      byPriority[event.priority] += 1;
    });

    return {
      statusData: [
        { name: 'Planificado', value: byStatus.planned },
        { name: 'En progreso', value: byStatus.in_progress },
        { name: 'Completado', value: byStatus.done }
      ],
      priorityData: [
        { name: 'Baja', total: byPriority.low },
        { name: 'Media', total: byPriority.medium },
        { name: 'Alta', total: byPriority.high }
      ],
      total: events.length
    };
  }, [events]);

  return (
    <section className="page-stack section-enter">
      <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap">
        <div>
          <p className="eyebrow dark mb-1">Zona administrativa</p>
          <h2 className="h4 mb-0 d-inline-flex align-items-center gap-2">
            <Shield size={18} strokeWidth={2} />
            Control global de eventos
          </h2>
        </div>
        <div className="card-kpi dark">
          <span>Total eventos</span>
          <strong>{stats.total}</strong>
        </div>
      </div>

      <article className="card surface p-3 p-md-4">
        <h3 className="h6 mb-3 d-inline-flex align-items-center gap-2">
          <Plus size={16} strokeWidth={2} />
          Crear evento rapido
        </h3>
        <form className="row g-3" onSubmit={handleSubmit(onCreate)}>
          <div className="col-12 col-md-6">
            <input
              className={`form-control ${errors.title ? 'is-invalid' : ''}`}
              placeholder="Titulo"
              {...register('title', { required: 'Campo obligatorio' })}
            />
            {errors.title && <div className="invalid-feedback">{errors.title.message}</div>}
          </div>
          <div className="col-12 col-md-6">
            <input
              className={`form-control ${errors.location ? 'is-invalid' : ''}`}
              placeholder="Ubicacion"
              {...register('location', { required: 'Campo obligatorio' })}
            />
            {errors.location && <div className="invalid-feedback">{errors.location.message}</div>}
          </div>
          <div className="col-12 col-md-6">
            <input
              type="datetime-local"
              className={`form-control ${errors.eventDate ? 'is-invalid' : ''}`}
              {...register('eventDate', { required: 'Campo obligatorio' })}
            />
            {errors.eventDate && <div className="invalid-feedback">{errors.eventDate.message}</div>}
          </div>
          <div className="col-12 col-md-6">
            <select className="form-select" {...register('priority')}>
              <option value="low">Prioridad baja</option>
              <option value="medium">Prioridad media</option>
              <option value="high">Prioridad alta</option>
            </select>
          </div>
          <div className="col-12">
            <textarea
              className={`form-control ${errors.description ? 'is-invalid' : ''}`}
              rows={2}
              placeholder="Descripcion"
              {...register('description', { required: 'Campo obligatorio' })}
            />
            {errors.description && <div className="invalid-feedback">{errors.description.message}</div>}
          </div>
          <div className="col-12">
            <button className="btn btn-dark d-inline-flex align-items-center gap-2" type="submit" disabled={isSubmitting}>
              <Plus size={15} strokeWidth={2} />
              {isSubmitting ? 'Creando...' : 'Crear'}
            </button>
          </div>
        </form>
      </article>

      <section className="row g-3">
        <div className="col-12 col-lg-6">
          <article className="card surface p-3 p-md-4 chart-card">
            <h3 className="h6 mb-3 d-inline-flex align-items-center gap-2">
              <BarChart3 size={16} strokeWidth={2} />
              Estado de eventos
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={stats.statusData} dataKey="value" nameKey="name" outerRadius={90}>
                  {stats.statusData.map((entry, index) => (
                    <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </article>
        </div>

        <div className="col-12 col-lg-6">
          <article className="card surface p-3 p-md-4 chart-card">
            <h3 className="h6 mb-3 d-inline-flex align-items-center gap-2">
              <CalendarCheck2 size={16} strokeWidth={2} />
              Prioridad asignada
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.priorityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" fill="#1d4ed8" />
              </BarChart>
            </ResponsiveContainer>
          </article>
        </div>
      </section>

      <article className="card surface p-3 p-md-4">
        <div className="d-flex align-items-center justify-content-between gap-2 mb-3 flex-wrap">
          <h3 className="h6 mb-0">Tabla de administracion</h3>
          <button className="btn btn-outline-dark btn-sm d-inline-flex align-items-center gap-2" onClick={loadEvents}>
            <RefreshCw size={14} strokeWidth={2} />
            Actualizar
          </button>
        </div>

        {loading ? (
          <p className="mb-0">Cargando datos...</p>
        ) : events.length === 0 ? (
          <p className="mb-0">No hay eventos todavia.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped align-middle admin-table">
              <thead>
                <tr>
                  <th>Titulo</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th>Prioridad</th>
                  <th>Owner</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event, index) => (
                  <tr key={event.id} className="table-row-enter" style={{ animationDelay: `${index * 35}ms` }}>
                    <td data-label="Titulo">
                      <input
                        className="form-control form-control-sm"
                        value={drafts[event.id]?.title || ''}
                        onChange={(e) => updateDraft(event.id, 'title', e.target.value)}
                      />
                    </td>
                    <td data-label="Fecha">
                      <input
                        type="datetime-local"
                        className="form-control form-control-sm"
                        value={drafts[event.id]?.event_date || ''}
                        onChange={(e) => updateDraft(event.id, 'event_date', e.target.value)}
                      />
                      <small className="text-muted d-block mt-1">{formatDateTime(event.event_date)}</small>
                    </td>
                    <td data-label="Estado">
                      <select
                        className="form-select form-select-sm"
                        value={drafts[event.id]?.status || 'planned'}
                        onChange={(e) => updateDraft(event.id, 'status', e.target.value)}
                      >
                        <option value="planned">Planificado</option>
                        <option value="in_progress">En progreso</option>
                        <option value="done">Completado</option>
                      </select>
                      <div className="mt-1">
                        <StatusBadge status={event.status} />
                      </div>
                    </td>
                    <td data-label="Prioridad">
                      <select
                        className="form-select form-select-sm"
                        value={drafts[event.id]?.priority || 'medium'}
                        onChange={(e) => updateDraft(event.id, 'priority', e.target.value)}
                      >
                        <option value="low">Baja</option>
                        <option value="medium">Media</option>
                        <option value="high">Alta</option>
                      </select>
                    </td>
                    <td data-label="Owner">
                      <small>{event.profiles?.display_name || event.profiles?.email || 'Sin owner'}</small>
                    </td>
                    <td className="admin-actions-cell" data-label="Acciones">
                      <div className="d-grid gap-1">
                        <button
                          className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
                          onClick={() => handlePut(event.id)}
                          disabled={busyId === event.id}
                        >
                          <Save size={13} strokeWidth={2} />
                          Guardar
                        </button>
                        <button
                          className="btn btn-sm btn-outline-warning d-inline-flex align-items-center gap-1"
                          onClick={() => handlePatch(event.id)}
                          disabled={busyId === event.id}
                        >
                          <ToggleRight size={13} strokeWidth={2} />
                          Cambiar estado
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>

      <AssistantDock onDataChanged={loadEvents} />
    </section>
  );
};

export default AdminDashboardPage;

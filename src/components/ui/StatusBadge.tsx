const statusLabels = {
  planned: 'Planificado',
  in_progress: 'En progreso',
  done: 'Completado'
};

const statusClasses = {
  planned: 'status-badge status-planned',
  in_progress: 'status-badge status-progress',
  done: 'status-badge status-done'
};

const StatusBadge = ({ status }) => (
  <span className={statusClasses[status] || statusClasses.planned}>{statusLabels[status] || status}</span>
);

export default StatusBadge;

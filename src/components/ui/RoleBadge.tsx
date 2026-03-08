const roleLabels = {
  admin: 'Administrador',
  user: 'Usuario',
  guest: 'Invitado'
};

const roleClasses = {
  admin: 'role-badge role-badge-admin',
  user: 'role-badge role-badge-user',
  guest: 'role-badge role-badge-guest'
};

const RoleBadge = ({ role }) => <span className={roleClasses[role] || roleClasses.guest}>{roleLabels[role] || role}</span>;

export default RoleBadge;

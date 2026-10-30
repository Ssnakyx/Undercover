import type { Role } from '../types';
import { roleLabel } from '../lib/roleInfo';

export function RoleBadge({ role }: { role: Role }) {
  return <span className={`badge badge--${role}`}>{roleLabel(role)}</span>;
}

export function RoleEmblem({ role, className }: { role: Role; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <use href={`#role-${role}`} />
    </svg>
  );
}

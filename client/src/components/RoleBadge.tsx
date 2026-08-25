import type { Role } from '../types';

const ROLE_LABEL: Record<Role, string> = {
  civil: 'Civil',
  undercover: 'Undercover',
  mrwhite: 'Mr White',
  spy: 'Espion',
  protector: 'Protecteur',
  ghost: 'Revenant',
  jester: 'Bouffon',
  hunter: 'Chasseur',
};

export function roleLabel(role: Role): string {
  return ROLE_LABEL[role];
}

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

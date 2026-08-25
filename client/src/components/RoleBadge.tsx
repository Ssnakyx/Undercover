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

// Description courte pour l'écran d'accueil (voir MainMenu.tsx "Les rôles") — même sens que
// les hints des toggles du Lobby, formulé pour un lecteur qui n'a pas encore de partie en cours.
const ROLE_DESCRIPTION: Record<Role, string> = {
  civil: "Camp majoritaire. Connaît le vrai champion et doit démasquer les undercover.",
  undercover: 'Camp minoritaire. Reçoit un champion proche mais différent — doit se fondre dans la masse.',
  mrwhite: "Ne connaît aucun champion. S'il est démasqué, il peut deviner celui des civils pour gagner quand même.",
  spy: "Camp civils. Apprend en privé le camp d'un autre joueur dès la révélation.",
  protector: "Camp civils. Une fois par partie, peut annuler l'élimination d'un joueur.",
  ghost: 'Camp civils. Une fois éliminé, garde un dernier vote pour le round suivant.',
  jester: 'Camp solo. Gagne seul, immédiatement, s\'il est éliminé par un vote.',
  hunter: 'Camp civils. Une fois éliminé, peut tirer sur un autre joueur pour l\'éliminer aussi.',
};

export function roleDescription(role: Role): string {
  return ROLE_DESCRIPTION[role];
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

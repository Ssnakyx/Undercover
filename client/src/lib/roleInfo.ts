import type { Role } from '../types';

// Libellés et descriptions des rôles — séparés des composants (components/RoleBadge.tsx) pour
// que le fast refresh de Vite fonctionne.

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

const ROLE_DESCRIPTION: Record<Role, string> = {
  civil: 'Camp majoritaire. Connaît le vrai mot et doit démasquer les intrus.',
  undercover: 'Reçoit un mot proche mais différent — doit se fondre dans la masse.',
  mrwhite: "N'a aucun mot. S'il est démasqué, il peut deviner celui des civils pour gagner quand même.",
  spy: "Camp civils. Découvre en secret le camp d'un autre joueur au début de la partie.",
  protector: "Camp civils. Une fois par partie, peut sauver un joueur d'une élimination.",
  ghost: 'Camp civils. Une fois éliminé, garde un dernier vote au round suivant.',
  jester: "Camp solo. Gagne seul, immédiatement, s'il se fait éliminer par un vote.",
  hunter: "Camp civils. Une fois éliminé par un vote, emporte un autre joueur avec lui.",
};

export function roleDescription(role: Role): string {
  return ROLE_DESCRIPTION[role];
}

/** true si le rôle reçoit un mot (personnage / jeu) à décrire. */
export function roleHasWord(role: Role): boolean {
  return role !== 'mrwhite' && role !== 'jester';
}

/** Classe CSS qui pose la teinte du rôle (--tone, voir styles/grimoire.css). */
export function roleToneClass(role: Role | null | undefined): string {
  // Undercover et Mr White ont la teinte de Civil : la couleur de la carte ne trahit pas le camp.
  return `tone-${!role || role === 'undercover' || role === 'mrwhite' ? 'civil' : role}`;
}

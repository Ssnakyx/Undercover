// Distribution des rôles — fonction pure, testable indépendamment de l'état des rooms.
// Table exacte, voir docs/CONTRACT.md section 2.

import type { PlayerRole, Role } from '../types.js';

export interface RoleDistributionCounts {
  undercover: number;
  mrWhite: number; // 0 ou 1
  civils: number;
}

export class InvalidRoleDistributionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidRoleDistributionError';
  }
}

/**
 * Table de répartition (section 2 du contrat) :
 *   N=3      -> undercover=1, mrWhite indisponible
 *   N=4      -> undercover=1, mrWhite indisponible
 *   N=5..8   -> undercover=1, mrWhite disponible (toggle host, défaut désactivé)
 *   N=9..12  -> undercover=2, mrWhite disponible (toggle host, défaut désactivé)
 *
 * mrWhiteRequested : valeur du toggle host (settings.mrWhiteEnabled). Ignoré (forcé à false)
 * si N < 5, car le contrat interdit explicitement ce réglage — l'UI doit déjà griser le
 * toggle, mais le serveur doit être la source de vérité et ne jamais faire confiance au
 * client : on ignore silencieusement une demande incohérente plutôt que de planter, tout en
 * exposant l'info via `mrWhiteGranted` pour que l'appelant puisse le journaliser si besoin.
 */
export function computeRoleCounts(n: number, mrWhiteRequested: boolean): RoleDistributionCounts {
  if (!Number.isInteger(n) || n < 3) {
    throw new InvalidRoleDistributionError(
      `Nombre de joueurs invalide pour la distribution des rôles : ${n} (minimum 3)`
    );
  }

  let undercover: number;
  let mrWhiteAvailable: boolean;

  if (n <= 4) {
    undercover = 1;
    mrWhiteAvailable = false;
  } else if (n <= 8) {
    undercover = 1;
    mrWhiteAvailable = true;
  } else {
    // n >= 9 (max 12 imposé par la room, mais la fonction reste correcte au-delà)
    undercover = 2;
    mrWhiteAvailable = true;
  }

  const mrWhite = mrWhiteAvailable && mrWhiteRequested ? 1 : 0;
  const civils = n - undercover - mrWhite;

  if (civils < undercover + mrWhite + 1) {
    // Ne devrait jamais arriver avec la table ci-dessus, mais on garde l'invariant explicite
    // du contrat (section 2) comme filet de sécurité.
    throw new InvalidRoleDistributionError(
      `Distribution invalide pour N=${n}: civils=${civils} doit être >= undercover+mrWhite+1`
    );
  }

  return { undercover, mrWhite, civils };
}

export interface AssignRolesOptions {
  playerIds: string[];
  mrWhiteRequested: boolean;
  championA: string;
  championB: string;
  /** Injectable pour les tests : doit renvoyer un float dans [0,1). Défaut: Math.random. */
  rng?: () => number;
}

/**
 * Mélange un tableau (Fisher-Yates) en utilisant le rng fourni, sans muter l'original.
 */
export function shuffle<T>(items: readonly T[], rng: () => number = Math.random): T[] {
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Attribue rôle + champion à chaque joueur, aléatoirement, selon la table de répartition.
 * champA (majoritaire) -> civils, champB (proche) -> undercover, aucun champion -> mrwhite.
 */
export function assignRoles(options: AssignRolesOptions): PlayerRole[] {
  const { playerIds, mrWhiteRequested, championA, championB } = options;
  const rng = options.rng ?? Math.random;

  const n = playerIds.length;
  const { undercover, mrWhite } = computeRoleCounts(n, mrWhiteRequested);

  const shuffled = shuffle(playerIds, rng);

  const roles: PlayerRole[] = [];
  let cursor = 0;

  for (let i = 0; i < undercover; i++) {
    roles.push({ playerId: shuffled[cursor], role: 'undercover', champion: championB });
    cursor++;
  }

  for (let i = 0; i < mrWhite; i++) {
    roles.push({ playerId: shuffled[cursor], role: 'mrwhite' as Role, champion: null });
    cursor++;
  }

  for (; cursor < shuffled.length; cursor++) {
    roles.push({ playerId: shuffled[cursor], role: 'civil', champion: championA });
  }

  return roles;
}

// Distribution des rôles — fonction pure, testable indépendamment de l'état des rooms.
// Table exacte, voir docs/CONTRACT.md section 2.

import type { PlayerRole, Role } from '../types.js';

export interface RoleDistributionCounts {
  undercover: number;
  mrWhite: number; // 0 ou 1
  spy: number; // 0 ou 1
  protector: number; // 0 ou 1
  ghost: number; // 0 ou 1
  jester: number; // 0 ou 1
  hunter: number; // 0 ou 1
  civils: number;
  lovers: boolean; // true si un duo Amoureux sera effectivement tiré
}

/** Demande brute du host (settings de la room) pour les rôles optionnels. */
export interface RoleRequest {
  mrWhite: boolean;
  spy: boolean;
  protector: boolean;
  ghost: boolean;
  jester: boolean;
  hunter: boolean;
  lovers: boolean;
  /** 0/absent = table automatique, sinon nombre d'Undercover voulu (borné, voir maxUndercoverFor). */
  undercoverCount?: number;
}

export class InvalidRoleDistributionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidRoleDistributionError';
  }
}

// Seuils minimum de joueurs par rôle optionnel (en-dessous, la demande est ignorée
// silencieusement plutôt que de planter — même philosophie que Mr White historiquement : le
// serveur est la source de vérité et ne fait jamais confiance à une demande client incohérente,
// l'UI doit déjà griser le toggle correspondant).
export const MR_WHITE_MIN_PLAYERS = 5;
export const SPY_MIN_PLAYERS = 4;
export const PROTECTOR_MIN_PLAYERS = 5;
export const GHOST_MIN_PLAYERS = 5;
export const JESTER_MIN_PLAYERS = 6;
export const HUNTER_MIN_PLAYERS = 4;
export const LOVERS_MIN_PLAYERS = 4;

/**
 * Table de répartition (section 2 du contrat), étendue aux rôles optionnels :
 *   N=3      -> undercover=1, aucun rôle optionnel disponible
 *   N=4      -> undercover=1, spy/hunter/lovers disponibles
 *   N=5..8   -> undercover=1, + mrWhite/protector/ghost disponibles
 *   N=9..12  -> undercover=2, + jester disponible (N>=6)
 *
 * spy/protector/ghost/hunter sont des variantes du camp civils : ils sont prélevés sur le
 * réservoir de civils SANS changer le total "civils vs undercover+mrWhite" utilisé par
 * l'invariant de sécurité ci-dessous (ce ne sont pas des factions séparées, voir
 * types.ts#Role). jester, en revanche, EST une faction séparée (solo) et réduit bien le
 * réservoir de civils avant l'invariant — mais n'est volontairement PAS ajoutée au membre de
 * droite de l'invariant (elle ne "grandit" jamais par attrition comme undercover/mrWhite, donc
 * n'a pas besoin d'être dominée par les civils de la même façon).
 */
/** Nombre d'Undercover par défaut (table §2). */
export function autoUndercoverCount(n: number): number {
  return n <= 8 ? 1 : 2;
}

/**
 * Plus grand nombre d'Undercover qui respecte l'invariant de sécurité ci-dessous (réservoir
 * civils >= undercover + mrWhite + 1) pour N joueurs, Mr White et Bouffon compris. Toujours >= 1.
 */
export function maxUndercoverFor(n: number, mrWhite: number, jester: number): number {
  return Math.max(1, Math.floor((n - 2 * mrWhite - jester - 1) / 2));
}

export function computeRoleCounts(n: number, requested: RoleRequest): RoleDistributionCounts {
  if (!Number.isInteger(n) || n < 3) {
    throw new InvalidRoleDistributionError(
      `Nombre de joueurs invalide pour la distribution des rôles : ${n} (minimum 3)`
    );
  }

  const mrWhite = requested.mrWhite && n >= MR_WHITE_MIN_PLAYERS ? 1 : 0;
  const jester = requested.jester && n >= JESTER_MIN_PLAYERS ? 1 : 0;
  // Nombre imposé par l'hôte : borné silencieusement plutôt que refusé (même philosophie que
  // les rôles optionnels sous leur seuil).
  const wanted = requested.undercoverCount && requested.undercoverCount > 0 ? Math.floor(requested.undercoverCount) : 0;
  const undercover = wanted > 0 ? Math.min(wanted, maxUndercoverFor(n, mrWhite, jester)) : autoUndercoverCount(n);

  const civilsPoolTotal = n - undercover - mrWhite - jester;
  if (civilsPoolTotal < undercover + mrWhite + 1) {
    // Filet de sécurité : ne devrait jamais se déclencher vu les seuils ci-dessus (vérifié à la
    // main pour toutes les combinaisons N=6..12), gardé comme invariant explicite du contrat.
    throw new InvalidRoleDistributionError(
      `Distribution invalide pour N=${n}: réservoir civils=${civilsPoolTotal} doit être >= undercover+mrWhite+1`
    );
  }

  let remaining = civilsPoolTotal;
  const takeSubRole = (want: boolean, minPlayers: number): number => {
    if (want && n >= minPlayers && remaining > 0) {
      remaining--;
      return 1;
    }
    return 0;
  };
  // Ordre de priorité fixe si plusieurs sous-rôles civils sont demandés mais que le réservoir
  // ne peut pas tous les satisfaire (cas limite à petit N) — demandes non satisfaites ignorées
  // silencieusement, jamais d'erreur.
  const spy = takeSubRole(requested.spy, SPY_MIN_PLAYERS);
  const protector = takeSubRole(requested.protector, PROTECTOR_MIN_PLAYERS);
  const ghost = takeSubRole(requested.ghost, GHOST_MIN_PLAYERS);
  const hunter = takeSubRole(requested.hunter, HUNTER_MIN_PLAYERS);

  const lovers = requested.lovers && n >= LOVERS_MIN_PLAYERS;

  return { undercover, mrWhite, spy, protector, ghost, jester, hunter, civils: remaining, lovers };
}

export interface AssignRolesOptions {
  playerIds: string[];
  requested: RoleRequest;
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
 * champA (majoritaire) -> civils/spy/protector/ghost/hunter, champB (proche) -> undercover,
 * aucun champion -> mrwhite/jester (le Bouffon n'a pas de champion à décrire, il ne fait que
 * viser l'élimination).
 *
 * loverPlayerId/spyInsightPlayerId utilisent le même `rng` injecté (tirages supplémentaires),
 * le résultat reste donc déterministe en test.
 */
export function assignRoles(options: AssignRolesOptions): PlayerRole[] {
  const { playerIds, requested, championA, championB } = options;
  const rng = options.rng ?? Math.random;

  const n = playerIds.length;
  const counts = computeRoleCounts(n, requested);

  const shuffled = shuffle(playerIds, rng);

  const roles: PlayerRole[] = [];
  let cursor = 0;

  const pushRole = (count: number, role: Role, champion: string | null) => {
    for (let i = 0; i < count; i++) {
      roles.push({ playerId: shuffled[cursor], role, champion });
      cursor++;
    }
  };

  pushRole(counts.undercover, 'undercover', championB);
  pushRole(counts.mrWhite, 'mrwhite' as Role, null);
  pushRole(counts.jester, 'jester' as Role, null);
  pushRole(counts.spy, 'spy' as Role, championA);
  pushRole(counts.protector, 'protector' as Role, championA);
  pushRole(counts.ghost, 'ghost' as Role, championA);
  pushRole(counts.hunter, 'hunter' as Role, championA);
  pushRole(counts.civils, 'civil', championA);

  // Amoureux et cible de l'Espion : tirés par un SECOND mélange indépendant. Les prendre dans
  // `shuffled` (comme avant) revenait à toujours lier le 1er Undercover (shuffled[0]) et à
  // toujours montrer un civil à l'Espion, puisque les rôles sont distribués dans l'ordre fixe
  // undercover -> mrwhite -> jester -> spy -> ... -> civil.
  if (counts.lovers && n >= 2) {
    const [aId, bId] = shuffle(playerIds, rng);
    const aEntry = roles.find((r) => r.playerId === aId);
    const bEntry = roles.find((r) => r.playerId === bId);
    if (aEntry) aEntry.loverPlayerId = bId;
    if (bEntry) bEntry.loverPlayerId = aId;
  }

  const spyEntry = roles.find((r) => r.role === 'spy');
  if (spyEntry) {
    const others = playerIds.filter((id) => id !== spyEntry.playerId);
    spyEntry.spyInsightPlayerId = others[Math.floor(rng() * others.length)] ?? null;
  }

  return roles;
}

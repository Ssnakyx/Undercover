// Aperçu client de la répartition des rôles — CONTRACT.md §2, dupliqué depuis
// server/src/game/roles.ts (computeRoleCounts) pour l'affichage en lobby avant
// le lancement. Le serveur reste l'unique source de vérité pour l'assignation
// réelle ; ce calcul ne sert qu'à prévisualiser les badges "N Civils / ...".

export interface RoleRequest {
  mrWhite: boolean;
  spy: boolean;
  protector: boolean;
  ghost: boolean;
  jester: boolean;
  hunter: boolean;
  lovers: boolean;
}

export interface RoleDistributionCounts {
  undercover: number;
  mrWhite: number;
  spy: number;
  protector: number;
  ghost: number;
  jester: number;
  hunter: number;
  civils: number;
  lovers: boolean;
}

export const MR_WHITE_MIN_PLAYERS = 5;
export const SPY_MIN_PLAYERS = 4;
export const PROTECTOR_MIN_PLAYERS = 5;
export const GHOST_MIN_PLAYERS = 5;
export const JESTER_MIN_PLAYERS = 6;
export const HUNTER_MIN_PLAYERS = 4;
export const LOVERS_MIN_PLAYERS = 4;

export function isMrWhiteAvailable(n: number): boolean {
  return n >= MR_WHITE_MIN_PLAYERS;
}
export function isSpyAvailable(n: number): boolean {
  return n >= SPY_MIN_PLAYERS;
}
export function isProtectorAvailable(n: number): boolean {
  return n >= PROTECTOR_MIN_PLAYERS;
}
export function isGhostAvailable(n: number): boolean {
  return n >= GHOST_MIN_PLAYERS;
}
export function isJesterAvailable(n: number): boolean {
  return n >= JESTER_MIN_PLAYERS;
}
export function isHunterAvailable(n: number): boolean {
  return n >= HUNTER_MIN_PLAYERS;
}
export function isLoversAvailable(n: number): boolean {
  return n >= LOVERS_MIN_PLAYERS;
}

export function computeRoleCounts(n: number, requested: RoleRequest): RoleDistributionCounts {
  if (!Number.isInteger(n) || n < 3) {
    return {
      undercover: 0,
      mrWhite: 0,
      spy: 0,
      protector: 0,
      ghost: 0,
      jester: 0,
      hunter: 0,
      civils: Math.max(n, 0),
      lovers: false,
    };
  }

  const undercover = n <= 8 ? 1 : 2;
  const mrWhite = requested.mrWhite && isMrWhiteAvailable(n) ? 1 : 0;
  const jester = requested.jester && isJesterAvailable(n) ? 1 : 0;

  let remaining = Math.max(n - undercover - mrWhite - jester, 0);
  const takeSubRole = (want: boolean, available: boolean): number => {
    if (want && available && remaining > 0) {
      remaining--;
      return 1;
    }
    return 0;
  };
  const spy = takeSubRole(requested.spy, isSpyAvailable(n));
  const protector = takeSubRole(requested.protector, isProtectorAvailable(n));
  const ghost = takeSubRole(requested.ghost, isGhostAvailable(n));
  const hunter = takeSubRole(requested.hunter, isHunterAvailable(n));

  const lovers = requested.lovers && isLoversAvailable(n);

  return { undercover, mrWhite, spy, protector, ghost, jester, hunter, civils: remaining, lovers };
}

import { describe, expect, it } from 'vitest';
import {
  computeRoleCounts,
  GHOST_MIN_PLAYERS,
  HUNTER_MIN_PLAYERS,
  isGhostAvailable,
  isHunterAvailable,
  isJesterAvailable,
  isLoversAvailable,
  isMrWhiteAvailable,
  isProtectorAvailable,
  isSpyAvailable,
  JESTER_MIN_PLAYERS,
  LOVERS_MIN_PLAYERS,
  MR_WHITE_MIN_PLAYERS,
  PROTECTOR_MIN_PLAYERS,
  SPY_MIN_PLAYERS,
  type RoleRequest,
} from '../src/lib/roles';

const NONE: RoleRequest = {
  mrWhite: false,
  spy: false,
  protector: false,
  ghost: false,
  jester: false,
  hunter: false,
  lovers: false,
};

const ALL: RoleRequest = {
  mrWhite: true,
  spy: true,
  protector: true,
  ghost: true,
  jester: true,
  hunter: true,
  lovers: true,
};

describe('seuils de disponibilité des rôles', () => {
  it('sont pile au seuil minimum (limite inclusive)', () => {
    expect(isMrWhiteAvailable(MR_WHITE_MIN_PLAYERS)).toBe(true);
    expect(isMrWhiteAvailable(MR_WHITE_MIN_PLAYERS - 1)).toBe(false);
    expect(isSpyAvailable(SPY_MIN_PLAYERS)).toBe(true);
    expect(isSpyAvailable(SPY_MIN_PLAYERS - 1)).toBe(false);
    expect(isProtectorAvailable(PROTECTOR_MIN_PLAYERS)).toBe(true);
    expect(isProtectorAvailable(PROTECTOR_MIN_PLAYERS - 1)).toBe(false);
    expect(isGhostAvailable(GHOST_MIN_PLAYERS)).toBe(true);
    expect(isGhostAvailable(GHOST_MIN_PLAYERS - 1)).toBe(false);
    expect(isJesterAvailable(JESTER_MIN_PLAYERS)).toBe(true);
    expect(isJesterAvailable(JESTER_MIN_PLAYERS - 1)).toBe(false);
    expect(isHunterAvailable(HUNTER_MIN_PLAYERS)).toBe(true);
    expect(isHunterAvailable(HUNTER_MIN_PLAYERS - 1)).toBe(false);
    expect(isLoversAvailable(LOVERS_MIN_PLAYERS)).toBe(true);
    expect(isLoversAvailable(LOVERS_MIN_PLAYERS - 1)).toBe(false);
  });
});

describe('computeRoleCounts', () => {
  it('en dessous de 3 joueurs, tout le monde est civil et aucun rôle spécial', () => {
    expect(computeRoleCounts(2, ALL)).toEqual({
      undercover: 0,
      mrWhite: 0,
      spy: 0,
      protector: 0,
      ghost: 0,
      jester: 0,
      hunter: 0,
      civils: 2,
      lovers: false,
    });
    expect(computeRoleCounts(0, ALL).civils).toBe(0);
  });

  it('1 seul undercover jusqu\'à 8 joueurs, 2 au-delà', () => {
    expect(computeRoleCounts(8, NONE).undercover).toBe(1);
    expect(computeRoleCounts(9, NONE).undercover).toBe(2);
  });

  it('sans rôles demandés, tous les autres joueurs sont civils', () => {
    const result = computeRoleCounts(6, NONE);
    expect(result).toEqual({
      undercover: 1,
      mrWhite: 0,
      spy: 0,
      protector: 0,
      ghost: 0,
      jester: 0,
      hunter: 0,
      civils: 5,
      lovers: false,
    });
  });

  it('ignore un rôle demandé si le seuil de joueurs n\'est pas atteint', () => {
    const result = computeRoleCounts(3, ALL); // sous tous les seuils sauf undercover de base
    expect(result.mrWhite).toBe(0);
    expect(result.spy).toBe(0);
    expect(result.protector).toBe(0);
    expect(result.ghost).toBe(0);
    expect(result.jester).toBe(0);
    expect(result.hunter).toBe(0);
    expect(result.lovers).toBe(false);
  });

  it('le total des rôles + civils est toujours égal à n (aucun joueur perdu)', () => {
    for (let n = 3; n <= 12; n++) {
      const result = computeRoleCounts(n, ALL);
      const total = result.undercover + result.mrWhite + result.spy + result.protector +
        result.ghost + result.jester + result.hunter + result.civils;
      expect(total).toBe(n);
    }
  });

  it('civils ne devient jamais négatif même avec tous les rôles demandés à l\'effectif minimal', () => {
    for (let n = 3; n <= 12; n++) {
      expect(computeRoleCounts(n, ALL).civils).toBeGreaterThanOrEqual(0);
    }
  });

  it('avec assez de joueurs, active tous les rôles demandés', () => {
    const result = computeRoleCounts(12, ALL);
    expect(result.mrWhite).toBe(1);
    expect(result.jester).toBe(1);
    expect(result.spy).toBe(1);
    expect(result.protector).toBe(1);
    expect(result.ghost).toBe(1);
    expect(result.hunter).toBe(1);
    expect(result.lovers).toBe(true);
  });

  it('lovers ne dépend pas de "remaining" (pas de joueur consommé) et respecte juste le seuil', () => {
    expect(computeRoleCounts(LOVERS_MIN_PLAYERS, { ...NONE, lovers: true }).lovers).toBe(true);
    expect(computeRoleCounts(LOVERS_MIN_PLAYERS - 1, { ...NONE, lovers: true }).lovers).toBe(false);
  });
});

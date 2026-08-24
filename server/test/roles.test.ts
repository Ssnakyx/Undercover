import { describe, expect, it } from 'vitest';
import {
  InvalidRoleDistributionError,
  assignRoles,
  computeRoleCounts,
} from '../src/game/roles.js';

describe('computeRoleCounts — table de répartition (CONTRACT.md section 2)', () => {
  it('N=3 -> 1 undercover, mr white indisponible même si demandé', () => {
    expect(computeRoleCounts(3, false)).toEqual({ undercover: 1, mrWhite: 0, civils: 2 });
    expect(computeRoleCounts(3, true)).toEqual({ undercover: 1, mrWhite: 0, civils: 2 });
  });

  it('N=4 -> 1 undercover, mr white indisponible même si demandé', () => {
    expect(computeRoleCounts(4, false)).toEqual({ undercover: 1, mrWhite: 0, civils: 3 });
    expect(computeRoleCounts(4, true)).toEqual({ undercover: 1, mrWhite: 0, civils: 3 });
  });

  it.each([5, 6, 7, 8])('N=%i -> 1 undercover, mr white disponible (défaut désactivé)', (n) => {
    expect(computeRoleCounts(n, false)).toEqual({ undercover: 1, mrWhite: 0, civils: n - 1 });
    expect(computeRoleCounts(n, true)).toEqual({ undercover: 1, mrWhite: 1, civils: n - 2 });
  });

  it.each([9, 10, 11, 12])('N=%i -> 2 undercover, mr white disponible (défaut désactivé)', (n) => {
    expect(computeRoleCounts(n, false)).toEqual({ undercover: 2, mrWhite: 0, civils: n - 2 });
    expect(computeRoleCounts(n, true)).toEqual({ undercover: 2, mrWhite: 1, civils: n - 3 });
  });

  it('civils >= undercover + mrWhite + 1 pour toute taille N=3..12, activé ou non', () => {
    for (let n = 3; n <= 12; n++) {
      for (const mrWhiteRequested of [false, true]) {
        const { undercover, mrWhite, civils } = computeRoleCounts(n, mrWhiteRequested);
        expect(civils).toBeGreaterThanOrEqual(undercover + mrWhite + 1);
        expect(undercover + mrWhite + civils).toBe(n);
        expect(mrWhite).toBeLessThanOrEqual(1);
      }
    }
  });

  it('rejette un nombre de joueurs invalide (< 3)', () => {
    expect(() => computeRoleCounts(2, false)).toThrow(InvalidRoleDistributionError);
    expect(() => computeRoleCounts(0, false)).toThrow(InvalidRoleDistributionError);
  });
});

function makePlayerIds(n: number): string[] {
  return Array.from({ length: n }, (_, i) => `p${i}`);
}

describe('assignRoles', () => {
  it.each([3, 4, 5, 6, 7, 8, 9, 10, 11, 12])(
    'N=%i sans Mr White : distribue champA aux civils, champB aux undercover, aucun mrwhite',
    (n) => {
      const playerIds = makePlayerIds(n);
      const roles = assignRoles({
        playerIds,
        mrWhiteRequested: false,
        championA: 'Garen',
        championB: 'Darius',
      });

      expect(roles).toHaveLength(n);
      expect(new Set(roles.map((r) => r.playerId))).toEqual(new Set(playerIds));

      const counts = computeRoleCounts(n, false);
      const undercover = roles.filter((r) => r.role === 'undercover');
      const civils = roles.filter((r) => r.role === 'civil');
      const mrwhite = roles.filter((r) => r.role === 'mrwhite');

      expect(undercover).toHaveLength(counts.undercover);
      expect(civils).toHaveLength(counts.civils);
      expect(mrwhite).toHaveLength(0);

      for (const r of civils) expect(r.champion).toBe('Garen');
      for (const r of undercover) expect(r.champion).toBe('Darius');
    }
  );

  it.each([5, 6, 7, 8, 9, 10, 11, 12])(
    'N=%i avec Mr White activé : exactement 1 mr white sans champion',
    (n) => {
      const playerIds = makePlayerIds(n);
      const roles = assignRoles({
        playerIds,
        mrWhiteRequested: true,
        championA: 'Garen',
        championB: 'Darius',
      });

      const counts = computeRoleCounts(n, true);
      const mrwhite = roles.filter((r) => r.role === 'mrwhite');
      const undercover = roles.filter((r) => r.role === 'undercover');
      const civils = roles.filter((r) => r.role === 'civil');

      expect(mrwhite).toHaveLength(1);
      expect(mrwhite[0].champion).toBeNull();
      expect(undercover).toHaveLength(counts.undercover);
      expect(civils).toHaveLength(counts.civils);
    }
  );

  it('N=3 ou 4 avec Mr White demandé : le toggle est ignoré (mr white jamais assigné)', () => {
    for (const n of [3, 4]) {
      const roles = assignRoles({
        playerIds: makePlayerIds(n),
        mrWhiteRequested: true,
        championA: 'Garen',
        championB: 'Darius',
      });
      expect(roles.some((r) => r.role === 'mrwhite')).toBe(false);
    }
  });

  it('utilise le rng injecté pour un résultat déterministe', () => {
    const rng = (() => {
      const seq = [0.9, 0.1, 0.5, 0.2, 0.8];
      let i = 0;
      return () => seq[i++ % seq.length];
    })();
    const roles = assignRoles({
      playerIds: makePlayerIds(5),
      mrWhiteRequested: true,
      championA: 'Garen',
      championB: 'Darius',
      rng,
    });
    // Même rng -> même résultat à chaque appel.
    const rng2 = (() => {
      const seq = [0.9, 0.1, 0.5, 0.2, 0.8];
      let i = 0;
      return () => seq[i++ % seq.length];
    })();
    const roles2 = assignRoles({
      playerIds: makePlayerIds(5),
      mrWhiteRequested: true,
      championA: 'Garen',
      championB: 'Darius',
      rng: rng2,
    });
    expect(roles).toEqual(roles2);
  });
});

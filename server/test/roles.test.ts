import { describe, expect, it } from 'vitest';
import {
  InvalidRoleDistributionError,
  assignRoles,
  computeRoleCounts,
  type RoleRequest,
} from '../src/game/roles.js';

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

describe('computeRoleCounts — table de répartition (CONTRACT.md section 2)', () => {
  it('N=3 -> 1 undercover, aucun rôle optionnel disponible même si tous demandés', () => {
    expect(computeRoleCounts(3, NONE)).toEqual({
      undercover: 1,
      mrWhite: 0,
      spy: 0,
      protector: 0,
      ghost: 0,
      jester: 0,
      hunter: 0,
      civils: 2,
      lovers: false,
    });
    expect(computeRoleCounts(3, ALL)).toEqual({
      undercover: 1,
      mrWhite: 0,
      spy: 0,
      protector: 0,
      ghost: 0,
      jester: 0,
      hunter: 0,
      civils: 2,
      lovers: false,
    });
  });

  it.each([5, 6, 7, 8])('N=%i -> 1 undercover, mr white disponible (défaut désactivé)', (n) => {
    expect(computeRoleCounts(n, NONE)).toMatchObject({ undercover: 1, mrWhite: 0, civils: n - 1 });
    expect(computeRoleCounts(n, { ...NONE, mrWhite: true })).toMatchObject({
      undercover: 1,
      mrWhite: 1,
      civils: n - 2,
    });
  });

  it.each([9, 10, 11, 12])('N=%i -> 2 undercover, mr white disponible (défaut désactivé)', (n) => {
    expect(computeRoleCounts(n, NONE)).toMatchObject({ undercover: 2, mrWhite: 0, civils: n - 2 });
    expect(computeRoleCounts(n, { ...NONE, mrWhite: true })).toMatchObject({
      undercover: 2,
      mrWhite: 1,
      civils: n - 3,
    });
  });

  it('N=4 : spy/hunter/lovers disponibles, protector/ghost/jester non (seuils 5/5/6)', () => {
    const counts = computeRoleCounts(4, ALL);
    expect(counts.spy).toBe(1);
    expect(counts.hunter).toBe(1);
    expect(counts.lovers).toBe(true);
    expect(counts.protector).toBe(0);
    expect(counts.ghost).toBe(0);
    expect(counts.jester).toBe(0);
  });

  it('seuils ignorés silencieusement en-dessous du minimum, jamais d\'erreur', () => {
    expect(computeRoleCounts(3, ALL).spy).toBe(0); // seuil 4
    expect(computeRoleCounts(4, ALL).protector).toBe(0); // seuil 5
    expect(computeRoleCounts(4, ALL).ghost).toBe(0); // seuil 5
    expect(computeRoleCounts(5, ALL).jester).toBe(0); // seuil 6
    expect(computeRoleCounts(3, ALL).lovers).toBe(false); // seuil 4
  });

  it('N=6 : garde-fou satisfait même avec mrWhite ET jester activés ensemble (cas limite exact)', () => {
    const counts = computeRoleCounts(6, { ...NONE, mrWhite: true, jester: true });
    expect(counts.undercover).toBe(1);
    expect(counts.mrWhite).toBe(1);
    expect(counts.jester).toBe(1);
    // réservoir civils restant = 6 - 1 - 1 - 1 = 3, exactement l'invariant (undercover+mrWhite+1=3)
    expect(counts.civils + counts.spy + counts.protector + counts.ghost + counts.hunter).toBe(3);
  });

  it('civils (agrégat, hors jester) >= undercover + mrWhite + 1 pour toute taille N=3..12, tout activé ou non', () => {
    for (let n = 3; n <= 12; n++) {
      for (const requested of [NONE, ALL]) {
        const counts = computeRoleCounts(n, requested);
        const civilsAggregate = counts.civils + counts.spy + counts.protector + counts.ghost + counts.hunter;
        expect(civilsAggregate).toBeGreaterThanOrEqual(counts.undercover + counts.mrWhite + 1);
        expect(counts.undercover + counts.mrWhite + counts.jester + civilsAggregate).toBe(n);
        expect(counts.mrWhite).toBeLessThanOrEqual(1);
      }
    }
  });

  it('à N élevé (12), un pool de sous-rôles civils demandé au complet est toujours satisfait', () => {
    const counts = computeRoleCounts(12, ALL);
    expect(counts.spy).toBe(1);
    expect(counts.protector).toBe(1);
    expect(counts.ghost).toBe(1);
    expect(counts.hunter).toBe(1);
  });

  it('rejette un nombre de joueurs invalide (< 3)', () => {
    expect(() => computeRoleCounts(2, NONE)).toThrow(InvalidRoleDistributionError);
    expect(() => computeRoleCounts(0, NONE)).toThrow(InvalidRoleDistributionError);
  });
});

function makePlayerIds(n: number): string[] {
  return Array.from({ length: n }, (_, i) => `p${i}`);
}

describe('assignRoles', () => {
  it.each([3, 4, 5, 6, 7, 8, 9, 10, 11, 12])(
    'N=%i sans rôle optionnel : distribue champA aux civils, champB aux undercover, aucun mrwhite',
    (n) => {
      const playerIds = makePlayerIds(n);
      const roles = assignRoles({
        playerIds,
        requested: NONE,
        championA: 'Garen',
        championB: 'Darius',
      });

      expect(roles).toHaveLength(n);
      expect(new Set(roles.map((r) => r.playerId))).toEqual(new Set(playerIds));

      const counts = computeRoleCounts(n, NONE);
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
        requested: { ...NONE, mrWhite: true },
        championA: 'Garen',
        championB: 'Darius',
      });

      const counts = computeRoleCounts(n, { ...NONE, mrWhite: true });
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
        requested: { ...NONE, mrWhite: true },
        championA: 'Garen',
        championB: 'Darius',
      });
      expect(roles.some((r) => r.role === 'mrwhite')).toBe(false);
    }
  });

  it('N=8 avec tous les rôles optionnels activés : jester + les 4 civils-variantes toutes présentes, aucun champion pour jester/mrwhite', () => {
    const roles = assignRoles({
      playerIds: makePlayerIds(8),
      requested: ALL,
      championA: 'Garen',
      championB: 'Darius',
    });
    expect(roles.filter((r) => r.role === 'jester')).toHaveLength(1);
    expect(roles.filter((r) => r.role === 'spy')).toHaveLength(1);
    expect(roles.filter((r) => r.role === 'protector')).toHaveLength(1);
    expect(roles.filter((r) => r.role === 'ghost')).toHaveLength(1);
    expect(roles.filter((r) => r.role === 'hunter')).toHaveLength(1);
    for (const r of roles.filter((r) => r.role === 'jester' || r.role === 'mrwhite')) {
      expect(r.champion).toBeNull();
    }
  });

  it('Amoureux : exactement 2 joueurs reçoivent un loverPlayerId réciproque quand activé et disponible', () => {
    const roles = assignRoles({
      playerIds: makePlayerIds(6),
      requested: { ...NONE, lovers: true },
      championA: 'Garen',
      championB: 'Darius',
    });
    const lovers = roles.filter((r) => r.loverPlayerId);
    expect(lovers).toHaveLength(2);
    expect(lovers[0].loverPlayerId).toBe(lovers[1].playerId);
    expect(lovers[1].loverPlayerId).toBe(lovers[0].playerId);
  });

  it('Amoureux : aucun loverPlayerId posé si désactivé', () => {
    const roles = assignRoles({
      playerIds: makePlayerIds(6),
      requested: NONE,
      championA: 'Garen',
      championB: 'Darius',
    });
    expect(roles.every((r) => !r.loverPlayerId)).toBe(true);
  });

  it('Espion : reçoit un spyInsightPlayerId pointant vers un autre joueur existant', () => {
    const roles = assignRoles({
      playerIds: makePlayerIds(6),
      requested: { ...NONE, spy: true },
      championA: 'Garen',
      championB: 'Darius',
    });
    const spy = roles.find((r) => r.role === 'spy');
    expect(spy).toBeDefined();
    expect(spy!.spyInsightPlayerId).toBeTruthy();
    expect(spy!.spyInsightPlayerId).not.toBe(spy!.playerId);
    expect(roles.some((r) => r.playerId === spy!.spyInsightPlayerId)).toBe(true);
  });

  it('utilise le rng injecté pour un résultat déterministe (y compris loverPlayerId/spyInsightPlayerId)', () => {
    const makeRng = () => {
      const seq = [0.9, 0.1, 0.5, 0.2, 0.8, 0.3];
      let i = 0;
      return () => seq[i++ % seq.length];
    };
    const requested: RoleRequest = { ...NONE, mrWhite: true, spy: true, lovers: true };
    const roles = assignRoles({
      playerIds: makePlayerIds(6),
      requested,
      championA: 'Garen',
      championB: 'Darius',
      rng: makeRng(),
    });
    const roles2 = assignRoles({
      playerIds: makePlayerIds(6),
      requested,
      championA: 'Garen',
      championB: 'Darius',
      rng: makeRng(),
    });
    expect(roles).toEqual(roles2);
  });
});

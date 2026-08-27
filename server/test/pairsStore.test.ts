import { describe, expect, it } from 'vitest';
import { getAllPairs } from '../src/content/pairsStore.js';
import type { Universe } from '../src/types.js';

const UNIVERSES: Universe[] = ['lol', 'smash', 'pokemon'];

describe('getAllPairs', () => {
  it.each(UNIVERSES)('retourne un pool non vide pour l\'univers "%s"', (universe) => {
    const pairs = getAllPairs(universe);
    expect(Array.isArray(pairs)).toBe(true);
    expect(pairs.length).toBeGreaterThan(0);
  });

  it.each(UNIVERSES)('chaque paire de "%s" a un id, champA et champB non vides', (universe) => {
    for (const pair of getAllPairs(universe)) {
      expect(pair.id).toBeTruthy();
      expect(pair.champA).toBeTruthy();
      expect(pair.champB).toBeTruthy();
      expect(pair.champA).not.toBe(pair.champB);
    }
  });

  it.each(UNIVERSES)('les ids de paires de "%s" sont uniques au sein du pool', (universe) => {
    const ids = getAllPairs(universe).map((pair) => pair.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('les pools des différents univers ne partagent aucun id (aucun mélange entre univers)', () => {
    const allIds = UNIVERSES.flatMap((universe) => getAllPairs(universe).map((pair) => pair.id));
    expect(new Set(allIds).size).toBe(allIds.length);
  });

  it('ne retourne pas une nouvelle référence de tableau à chaque appel (pool fixe partagé)', () => {
    expect(getAllPairs('lol')).toBe(getAllPairs('lol'));
  });
});

import { describe, expect, it } from 'vitest';
import { isUniverse, universeCopy } from '../src/lib/universe';
import type { Universe } from '../src/types';

const UNIVERSES: Universe[] = ['lol', 'smash', 'pokemon'];

describe('universeCopy', () => {
  it.each(UNIVERSES)('retourne une copy complète et cohérente pour "%s"', (universe) => {
    const copy = universeCopy(universe);
    expect(copy.universe).toBe(universe);
    expect(copy.name).toBeTruthy();
    expect(copy.tagline).toBeTruthy();
    expect(copy.unitLabel).toBeTruthy();
    expect(copy.nameLabel).toBeTruthy();
    expect(copy.namePlaceholder).toBeTruthy();
  });

  it('donne des noms différents pour chaque univers', () => {
    const names = UNIVERSES.map((u) => universeCopy(u).name);
    expect(new Set(names).size).toBe(UNIVERSES.length);
  });
});

describe('isUniverse', () => {
  it.each(UNIVERSES)('reconnaît "%s" comme univers valide', (universe) => {
    expect(isUniverse(universe)).toBe(true);
  });

  it('rejette une chaîne inconnue', () => {
    expect(isUniverse('valorant')).toBe(false);
  });

  it('rejette undefined', () => {
    expect(isUniverse(undefined)).toBe(false);
  });

  it('rejette une chaîne vide', () => {
    expect(isUniverse('')).toBe(false);
  });
});

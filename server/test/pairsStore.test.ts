import { describe, expect, it } from 'vitest';
import { getAllPairs, getPairs } from '../src/content/pairsStore.js';
import { characterImage } from '../src/content/characterImages.js';
import { GAME_INFO } from '../src/content/gameInfo.js';
import type { Universe } from '../src/types.js';

const UNIVERSES: Universe[] = ['lol', 'smash', 'pokemon', 'games'];

function norm(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

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

describe('qualité des paires', () => {
  it.each(UNIVERSES)('"%s" : aucun nom ne contient l’autre (sinon l’Undercover devine son rôle)', (universe) => {
    for (const { champA, champB } of getAllPairs(universe)) {
      expect(norm(champA).includes(norm(champB)) || norm(champB).includes(norm(champA)), `${champA} / ${champB}`).toBe(false);
    }
  });

  it.each(UNIVERSES)('"%s" : chaque paire a une difficulté et les quatre niveaux existent', (universe) => {
    const pairs = getAllPairs(universe);
    expect(pairs.every((p) => p.difficulty)).toBe(true);
    for (const d of ['easy', 'medium', 'hard', 'extreme'] as const) {
      expect(getPairs(universe, d).every((p) => p.difficulty === d)).toBe(true);
      expect(getPairs(universe, d).length).toBeGreaterThan(0);
    }
  });

  it.each(UNIVERSES)('"%s" : pas de doublon de paire (dans un sens ou dans l’autre)', (universe) => {
    const keys = getAllPairs(universe).map((p) => [p.champA, p.champB].sort().join('|'));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it.each(['smash', 'pokemon'] as const)('"%s" : chaque personnage a son image', (universe) => {
    for (const { champA, champB } of getAllPairs(universe)) {
      expect(characterImage(universe, champA), champA).toMatch(/^\/img\//);
      expect(characterImage(universe, champB), champB).toMatch(/^\/img\//);
    }
  });

  it('lol : image Data Dragon, identifiants spéciaux gérés', () => {
    expect(characterImage('lol', 'Wukong')).toContain('/MonkeyKing_0.jpg');
    expect(characterImage('lol', "Kai'Sa")).toContain('/Kaisa_0.jpg');
    expect(characterImage('lol', 'Miss Fortune')).toContain('/MissFortune_0.jpg');
    expect(characterImage('games', 'Minecraft')).toBeNull();
  });
});

describe('univers Jeux vidéo', () => {
  it('chaque jeu des paires a une description et un article Wikipédia pour sa jaquette', () => {
    for (const { champA, champB } of getAllPairs('games')) {
      for (const name of [champA, champB]) {
        expect(GAME_INFO[name]?.description, name).toBeTruthy();
        expect(GAME_INFO[name]?.wiki, name).toBeTruthy();
      }
    }
  });
});

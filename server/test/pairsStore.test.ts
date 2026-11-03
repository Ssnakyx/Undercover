import { describe, expect, it } from 'vitest';
import { getAllPairs, getPairs } from '../src/content/pairsStore.js';
import { characterAliases, characterDescription, characterImage } from '../src/content/characterImages.js';
import { CROSS_SEEDS } from '../src/content/mixPairs.js';
import { GAME_INFO } from '../src/content/gameInfo.js';
import { ANIME_INFO, animeDescription } from '../src/content/animeInfo.js';
import type { Universe } from '../src/types.js';

const UNIVERSES: Universe[] = ['lol', 'smash', 'pokemon', 'games', 'anime', 'smash-anime', 'lol-anime', 'brawl'];

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

  it.each(['smash', 'pokemon', 'brawl'] as const)('"%s" : chaque personnage a son image', (universe) => {
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

describe('univers Manga & Anime', () => {
  it('chaque personnage des paires a sa série (affichée sur sa carte)', () => {
    for (const { champA, champB } of getAllPairs('anime')) {
      for (const name of [champA, champB]) {
        expect(ANIME_INFO[name]?.series, name).toBeTruthy();
        expect(animeDescription(name), name).toBeTruthy();
      }
    }
  });

  it('image AniList versionnée, et les alias servent à la devinette de Mr White', () => {
    expect(characterImage('anime', 'Luffy')).toMatch(/^https:\/\/s4\.anilist\.co\//);
    expect(characterAliases('anime', 'Goku')).toContain('Sangoku');
    expect(animeDescription('Luffy')).toBe('Personnage de « One Piece »');
  });

  it('aucune fiche orpheline (chaque personnage décrit sert dans au moins une paire)', () => {
    const used = new Set(getAllPairs('anime').flatMap((p) => [p.champA, p.champB]));
    for (const name of Object.keys(ANIME_INFO)) expect(used.has(name), name).toBe(true);
  });
});

describe('univers mixtes Smash × Anime et LoL × Anime', () => {
  it.each(['smash-anime', 'lol-anime'] as const)('"%s" : chaque nom des paires croisées vient bien de son univers', (universe) => {
    const source = universe === 'smash-anime' ? 'smash' : 'lol';
    const sourceNames = new Set(getAllPairs(source).flatMap((p) => [p.champA, p.champB]));
    const animeNames = new Set(getAllPairs('anime').flatMap((p) => [p.champA, p.champB]));
    for (const [a, b] of CROSS_SEEDS[universe]) {
      expect(sourceNames.has(a), a).toBe(true);
      expect(animeNames.has(b), b).toBe(true);
    }
  });

  it.each(['smash-anime', 'lol-anime'] as const)('"%s" : uniquement des paires croisées', (universe) => {
    expect(getAllPairs(universe).length).toBe(CROSS_SEEDS[universe].length);
  });

  it('les images et descriptions suivent l’univers d’origine du personnage', () => {
    expect(characterImage('smash-anime', 'Link')).toMatch(/^\/img\/smash\//);
    expect(characterImage('smash-anime', 'Luffy')).toMatch(/^https:\/\/s4\.anilist\.co\//);
    expect(characterImage('lol-anime', 'Ahri')).toContain('/Ahri_0.jpg');
    expect(characterDescription('lol-anime', 'Ahri')).toContain('League of Legends');
    expect(characterDescription('smash-anime', 'Zoro')).toBe('Personnage de « One Piece »');
  });

  it('chaque personnage des mixes a une description', () => {
    for (const universe of ['smash-anime', 'lol-anime'] as const) {
      for (const { champA, champB } of getAllPairs(universe)) {
        expect(characterDescription(universe, champA), champA).toBeTruthy();
        expect(characterDescription(universe, champB), champB).toBeTruthy();
      }
    }
  });
});

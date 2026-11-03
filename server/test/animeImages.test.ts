import { describe, expect, it } from 'vitest';
import { ANIME_INFO } from '../src/content/animeInfo.js';
import { SERIES_KEYWORDS, animeSearchTerm, pickCharacterImage } from '../src/content/animeImages.js';

const result = (url: string, ...titles: string[]) => ({
  image: { large: url },
  media: { nodes: titles.map((romaji) => ({ title: { romaji, english: null } })) },
});

describe('images des personnages d’anime (AniList)', () => {
  it('chaque série a ses mots-clés de titre AniList', () => {
    const series = new Set(Object.values(ANIME_INFO).map((c) => c.series));
    expect([...series].filter((s) => !SERIES_KEYWORDS[s])).toEqual([]);
  });

  it('garde le premier résultat de la bonne série, pas un homonyme', () => {
    const results = [result('https://img/law-other.png', 'Code Geass'), result('https://img/law.png', 'ONE PIECE')];
    expect(pickCharacterImage('One Piece', results)).toBe('https://img/law.png');
    expect(pickCharacterImage('Yu-Gi-Oh!', [result('https://img/yugi.png', 'Yu☆Gi☆Oh! Duel Monsters')])).toBe('https://img/yugi.png');
  });

  it('rien plutôt qu’une mauvaise image ou l’image par défaut', () => {
    expect(pickCharacterImage('Naruto', [result('https://img/x.png', 'Bleach')])).toBeNull();
    expect(pickCharacterImage('Naruto', [result('https://s4.anilist.co/file/anilistcdn/character/large/default.jpg', 'NARUTO')])).toBeNull();
  });

  it('cherche le nom complet en alphabet latin', () => {
    expect(animeSearchTerm('Luffy')).toBe('Monkey D. Luffy');
    expect(animeSearchTerm('Sakura Kinomoto')).toBe('Sakura Kinomoto');
    expect(animeSearchTerm('Végéta')).toBe('Vegeta');
    expect(animeSearchTerm('Gaara')).toBe('Gaara');
  });
});

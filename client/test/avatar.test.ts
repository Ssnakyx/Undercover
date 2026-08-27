import { describe, expect, it } from 'vitest';
import { avatarColors, avatarInitial } from '../src/lib/avatar';

describe('avatarColors', () => {
  it('est déterministe pour un même seed', () => {
    expect(avatarColors('abc123')).toEqual(avatarColors('abc123'));
  });

  it('retourne toujours c1, c2 et text sous forme de couleurs hexadécimales', () => {
    const { c1, c2, text } = avatarColors('some-seed');
    for (const color of [c1, c2, text]) {
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('gère une seed vide sans erreur', () => {
    expect(() => avatarColors('')).not.toThrow();
  });

  it('boucle correctement dans la palette (wrap-around) pour des seeds variées', () => {
    for (const seed of ['a', 'bb', 'ccc', 'dddd', 'eeeee', 'ffffff', 'g']) {
      const { c1, c2, text } = avatarColors(seed);
      expect(c1).toBeTruthy();
      expect(c2).toBeTruthy();
      expect(text).toBeTruthy();
    }
  });
});

describe('avatarInitial', () => {
  it('retourne la première lettre en majuscule', () => {
    expect(avatarInitial('noctajungle')).toBe('N');
    expect(avatarInitial('Zed')).toBe('Z');
  });

  it('ignore les espaces en début de chaîne', () => {
    expect(avatarInitial('  yasuo')).toBe('Y');
  });

  it('retourne "?" pour une chaîne vide ou uniquement des espaces', () => {
    expect(avatarInitial('')).toBe('?');
    expect(avatarInitial('   ')).toBe('?');
  });

  it('gère les caractères accentués', () => {
    expect(avatarInitial('émilie')).toBe('É');
  });
});

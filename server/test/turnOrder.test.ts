import { describe, expect, it } from 'vitest';
import {
  computeInitialTurnOrder,
  ensureAllowedFirst,
  recomputeTurnOrderAfterElimination,
} from '../src/game/turnOrder.js';

describe('computeInitialTurnOrder', () => {
  it('contient exactement les mêmes joueurs que la liste passée en entrée', () => {
    const playerIds = ['a', 'b', 'c', 'd', 'e'];
    const order = computeInitialTurnOrder(playerIds);
    expect(order).toHaveLength(playerIds.length);
    expect(new Set(order)).toEqual(new Set(playerIds));
  });

  it('ne mute pas le tableau passé en entrée', () => {
    const playerIds = ['a', 'b', 'c'];
    const copy = [...playerIds];
    computeInitialTurnOrder(playerIds, () => 0.99);
    expect(playerIds).toEqual(copy);
  });

  it('avec un rng constant, produit un ordre déterministe et reproductible', () => {
    const playerIds = ['a', 'b', 'c', 'd'];
    const order1 = computeInitialTurnOrder(playerIds, () => 0.5);
    const order2 = computeInitialTurnOrder(playerIds, () => 0.5);
    expect(order1).toEqual(order2);
  });

  it('gère une liste vide sans erreur', () => {
    expect(computeInitialTurnOrder([])).toEqual([]);
  });

  it('gère un seul joueur', () => {
    expect(computeInitialTurnOrder(['solo'])).toEqual(['solo']);
  });
});

describe('recomputeTurnOrderAfterElimination', () => {
  it('retire les joueurs éliminés en conservant l\'ordre relatif des survivants', () => {
    const previous = ['a', 'b', 'c', 'd', 'e'];
    const alive = ['e', 'b', 'd']; // ordre différent, ne doit pas influencer le résultat
    expect(recomputeTurnOrderAfterElimination(previous, alive)).toEqual(['b', 'd', 'e']);
  });

  it('ne rajoute jamais un joueur absent de previousTurnOrder', () => {
    const previous = ['a', 'b', 'c'];
    const alive = ['a', 'b', 'c', 'zzz'];
    expect(recomputeTurnOrderAfterElimination(previous, alive)).toEqual(['a', 'b', 'c']);
  });

  it('retourne un tableau vide si personne n\'est vivant', () => {
    expect(recomputeTurnOrderAfterElimination(['a', 'b', 'c'], [])).toEqual([]);
  });

  it('retourne l\'ordre inchangé si tout le monde est vivant', () => {
    const previous = ['a', 'b', 'c'];
    expect(recomputeTurnOrderAfterElimination(previous, previous)).toEqual(previous);
  });

  it('ne mute pas previousTurnOrder', () => {
    const previous = ['a', 'b', 'c'];
    const copy = [...previous];
    recomputeTurnOrderAfterElimination(previous, ['a']);
    expect(previous).toEqual(copy);
  });
});

describe('Mr White ne commence jamais', () => {
  it('round 1 : jamais en tête, quel que soit le tirage', () => {
    const ids = ['a', 'b', 'white', 'c', 'd'];
    for (let i = 0; i < 500; i++) {
      const order = computeInitialTurnOrder(ids, Math.random, ['white']);
      expect(order[0]).not.toBe('white');
      expect(new Set(order)).toEqual(new Set(ids));
    }
  });

  it('rounds suivants : si le premier est éliminé et que Mr White se retrouve en tête, il est décalé', () => {
    const previous = ['a', 'white', 'b', 'c'];
    expect(recomputeTurnOrderAfterElimination(previous, ['white', 'b', 'c'], ['white'])).toEqual([
      'b',
      'white',
      'c',
    ]);
  });

  it('plusieurs Mr White en tête : le premier joueur autorisé passe devant', () => {
    expect(ensureAllowedFirst(['w1', 'w2', 'a', 'b'], ['w1', 'w2'])).toEqual(['a', 'w1', 'w2', 'b']);
  });

  it('ordre inchangé si personne d\'autre ne peut commencer', () => {
    expect(ensureAllowedFirst(['w1', 'w2'], ['w1', 'w2'])).toEqual(['w1', 'w2']);
  });

  it('ne mute pas l\'ordre passé', () => {
    const order = ['white', 'a'];
    ensureAllowedFirst(order, ['white']);
    expect(order).toEqual(['white', 'a']);
  });
});

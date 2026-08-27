import { describe, expect, it } from 'vitest';
import {
  computeInitialTurnOrder,
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

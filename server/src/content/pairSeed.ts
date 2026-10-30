// Format compact des listes de paires par univers (voir content/pairsStore.ts) :
// [civils, undercover, thème, difficulté]. L'ordre civils/undercover n'est qu'indicatif :
// le moteur inverse la paire une fois sur deux au tirage (engine.ts#selectPair), pour que le
// même personnage ne soit pas toujours celui de la majorité.
//
// Règle de qualité appliquée à toutes les listes : aucun des deux noms ne contient l'autre
// (pas de "Raichu / Raichu d'Alola", "Pit / Pit Maléfique"...). Sinon l'Undercover devine son
// rôle à la simple lecture de son mot, ce qui casse le jeu.
//
// Difficulté = proximité des deux personnages :
//   hard   : quasi-jumeaux (même rôle, même look ou même lore), très dur à démasquer
//   medium : clairement liés, mais des indices précis les distinguent
//   easy   : lien plus lâche, idéal pour découvrir le jeu

import type { ChampionPair, PairDifficulty, Universe } from '../types.js';

export type PairSeed = readonly [string, string, string, PairDifficulty];

function slug(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function buildPairs(universe: Universe, seeds: readonly PairSeed[]): ChampionPair[] {
  return seeds.map(([champA, champB, theme, difficulty]) => ({
    id: `${universe}:${slug(champA)}--${slug(champB)}`,
    champA,
    champB,
    theme,
    difficulty,
  }));
}

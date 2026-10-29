// Accès aux pools de paires — voir docs/CONTRACT.md section 7. Un pool indépendant par
// univers (`Universe`, voir types.ts) : les paires ne se mélangent jamais entre univers.
// Chaque pool est une liste fixe définie en code (aucune édition en cours de partie) — ça
// garantit que deux rooms lancées en même temps tirent chacune leur paire indépendamment,
// sans jamais partager ni polluer l'état de l'autre.

import type { ChampionPair, PairDifficultyFilter, Universe } from '../types.js';
import { lolPairs } from './lolPairs.js';
import { smashPairs } from './smashPairs.js';
import { pokemonPairs } from './pokemonPairs.js';
import { gamesPairs } from './gamesPairs.js';

const pools: Record<Universe, ChampionPair[]> = {
  lol: lolPairs,
  smash: smashPairs,
  pokemon: pokemonPairs,
  games: gamesPairs,
};

export function getAllPairs(universe: Universe): ChampionPair[] {
  return pools[universe];
}

/** Pool filtré par difficulté ('all' = tout le pool). Retombe sur le pool complet si le
 * filtre ne laisse rien (ne devrait pas arriver : chaque univers a les trois niveaux). */
export function getPairs(universe: Universe, difficulty: PairDifficultyFilter): ChampionPair[] {
  const all = pools[universe];
  if (difficulty === 'all') return all;
  const filtered = all.filter((p) => p.difficulty === difficulty);
  return filtered.length > 0 ? filtered : all;
}

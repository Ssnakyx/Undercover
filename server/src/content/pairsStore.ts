// Accès aux pools de paires — voir docs/CONTRACT.md section 7. Un pool indépendant par
// univers (`Universe`, voir types.ts) : les paires League of Legends et Smash Bros Ultimate
// ne se mélangent jamais. Chaque pool est une liste fixe définie en code (aucune édition en
// cours de partie) — ça garantit que deux rooms lancées en même temps tirent chacune leur
// paire indépendamment, sans jamais partager ni polluer l'état de l'autre.

import type { ChampionPair, Universe } from '../types.js';
import { championPairs as lolPairs } from './championPairs.js';
import { smashPairs } from './smashPairs.js';
import { pokemonPairs } from './pokemonPairs.js';

const pools: Record<Universe, ChampionPair[]> = {
  lol: lolPairs,
  smash: smashPairs,
  pokemon: pokemonPairs,
};

export function getAllPairs(universe: Universe): ChampionPair[] {
  return pools[universe];
}

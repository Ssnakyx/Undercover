// État mutable global des paires — voir docs/CONTRACT.md section 7. Un pool indépendant par
// univers (`Universe`, voir types.ts) : les paires League of Legends et Smash Bros Ultimate
// ne se mélangent jamais, chacune éditable par les hosts de son propre univers.
// "L'host peut, depuis le lobby (pairs:add / pairs:toggle / pairs:remove), éditer la liste
// pour la durée de vie du process serveur (persistée en mémoire globale, pas par room, pour
// que les ajouts profitent à toutes les rooms suivantes [du même univers])."

import { randomUUID } from 'node:crypto';
import type { ChampionPair, Universe } from '../types.js';
import { championPairs as baseLolPairs } from './championPairs.js';
import { smashPairs as baseSmashPairs } from './smashPairs.js';

function basePairsFor(universe: Universe): ChampionPair[] {
  return universe === 'lol' ? baseLolPairs : baseSmashPairs;
}

const pools: Record<Universe, ChampionPair[]> = {
  lol: baseLolPairs.map((p) => ({ ...p })),
  smash: baseSmashPairs.map((p) => ({ ...p })),
};

export function getAllPairs(universe: Universe): ChampionPair[] {
  return pools[universe].map((p) => ({ ...p }));
}

export function getEnabledPairs(universe: Universe): ChampionPair[] {
  return pools[universe].filter((p) => p.enabled);
}

export function getPairById(universe: Universe, pairId: string): ChampionPair | undefined {
  return pools[universe].find((p) => p.id === pairId);
}

export interface AddPairInput {
  champA: string;
  champB: string;
  theme: string;
}

export function addPair(universe: Universe, input: AddPairInput): ChampionPair {
  const pair: ChampionPair = {
    id: randomUUID(),
    champA: input.champA.trim(),
    champB: input.champB.trim(),
    theme: input.theme.trim(),
    enabled: true,
    isCustom: true,
  };
  pools[universe] = [...pools[universe], pair];
  return pair;
}

export function togglePair(universe: Universe, pairId: string, enabled: boolean): ChampionPair | null {
  const idx = pools[universe].findIndex((p) => p.id === pairId);
  if (idx === -1) return null;
  const updated: ChampionPair = { ...pools[universe][idx], enabled };
  pools[universe] = [...pools[universe].slice(0, idx), updated, ...pools[universe].slice(idx + 1)];
  return updated;
}

/** Retrait autorisé uniquement pour les paires custom (isCustom === true), voir contrat. */
export function removePair(
  universe: Universe,
  pairId: string
): { ok: true } | { ok: false; reason: 'NOT_FOUND' | 'NOT_CUSTOM' } {
  const pair = pools[universe].find((p) => p.id === pairId);
  if (!pair) return { ok: false, reason: 'NOT_FOUND' };
  if (!pair.isCustom) return { ok: false, reason: 'NOT_CUSTOM' };
  pools[universe] = pools[universe].filter((p) => p.id !== pairId);
  return { ok: true };
}

/** Utilitaire de test uniquement : réinitialise les deux pools à leur liste de base. */
export function _resetPairsStoreForTests(): void {
  pools.lol = basePairsFor('lol').map((p) => ({ ...p }));
  pools.smash = basePairsFor('smash').map((p) => ({ ...p }));
}

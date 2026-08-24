// État mutable global des paires de champions — voir docs/CONTRACT.md section 7.
// "L'host peut, depuis le lobby (pairs:add / pairs:toggle / pairs:remove), éditer la liste
// pour la durée de vie du process serveur (persistée en mémoire globale, pas par room, pour
// que les ajouts profitent à toutes les rooms suivantes)."
//
// Ce module détient donc UNE seule liste partagée par tout le process, initialisée à partir
// de la liste de base fournie par l'agent Contenu (championPairs.ts, non modifié).

import { randomUUID } from 'node:crypto';
import { championPairs as basePairs, type ChampionPair } from './championPairs.js';

// Copie défensive : on ne mute jamais le tableau exporté par championPairs.ts.
let pairs: ChampionPair[] = basePairs.map((p) => ({ ...p }));

export function getAllPairs(): ChampionPair[] {
  return pairs.map((p) => ({ ...p }));
}

export function getEnabledPairs(): ChampionPair[] {
  return pairs.filter((p) => p.enabled);
}

export function getPairById(pairId: string): ChampionPair | undefined {
  return pairs.find((p) => p.id === pairId);
}

export interface AddPairInput {
  champA: string;
  champB: string;
  theme: string;
}

export function addPair(input: AddPairInput): ChampionPair {
  const pair: ChampionPair = {
    id: randomUUID(),
    champA: input.champA.trim(),
    champB: input.champB.trim(),
    theme: input.theme.trim(),
    enabled: true,
    isCustom: true,
  };
  pairs = [...pairs, pair];
  return pair;
}

export function togglePair(pairId: string, enabled: boolean): ChampionPair | null {
  const idx = pairs.findIndex((p) => p.id === pairId);
  if (idx === -1) return null;
  const updated: ChampionPair = { ...pairs[idx], enabled };
  pairs = [...pairs.slice(0, idx), updated, ...pairs.slice(idx + 1)];
  return updated;
}

/** Retrait autorisé uniquement pour les paires custom (isCustom === true), voir contrat. */
export function removePair(pairId: string): { ok: true } | { ok: false; reason: 'NOT_FOUND' | 'NOT_CUSTOM' } {
  const pair = pairs.find((p) => p.id === pairId);
  if (!pair) return { ok: false, reason: 'NOT_FOUND' };
  if (!pair.isCustom) return { ok: false, reason: 'NOT_CUSTOM' };
  pairs = pairs.filter((p) => p.id !== pairId);
  return { ok: true };
}

/** Utilitaire de test uniquement : réinitialise le store à la liste de base. */
export function _resetPairsStoreForTests(): void {
  pairs = basePairs.map((p) => ({ ...p }));
}

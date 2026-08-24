// Calcul de l'ordre de passage (fonction pure) — voir docs/CONTRACT.md section 3, phase "clues".
// Round 1 : ordre mélangé aléatoirement.
// Rounds suivants : on recalcule en retirant les joueurs éliminés, en conservant l'ordre
// relatif des joueurs restants (pas de nouveau mélange).

import { shuffle } from './roles.js';

/**
 * Ordre initial (round 1) : mélange aléatoire de tous les playerIds vivants au lancement.
 */
export function computeInitialTurnOrder(playerIds: string[], rng: () => number = Math.random): string[] {
  return shuffle(playerIds, rng);
}

/**
 * Ordre pour un round suivant : filtre l'ordre précédent pour ne garder que les joueurs
 * encore vivants (alivePlayerIds), en conservant l'ordre relatif d'origine.
 */
export function recomputeTurnOrderAfterElimination(
  previousTurnOrder: string[],
  alivePlayerIds: readonly string[]
): string[] {
  const aliveSet = new Set(alivePlayerIds);
  return previousTurnOrder.filter((id) => aliveSet.has(id));
}

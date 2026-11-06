// Calcul de l'ordre de passage (fonction pure) — voir docs/CONTRACT.md section 3, phase "clues".
// Round 1 : ordre mélangé aléatoirement.
// Rounds suivants : on recalcule en retirant les joueurs éliminés, en conservant l'ordre
// relatif des joueurs restants (pas de nouveau mélange).
// Règle : un Mr White ne parle jamais en premier (il n'a pas de mot et serait démasqué
// d'office). Les ids passés dans `cannotStart` ne sont jamais placés en tête d'ordre.

import { shuffle } from './roles.js';

/**
 * Ordre initial (round 1) : mélange aléatoire de tous les playerIds vivants au lancement.
 */
export function computeInitialTurnOrder(
  playerIds: string[],
  rng: () => number = Math.random,
  cannotStart: readonly string[] = []
): string[] {
  return ensureAllowedFirst(shuffle(playerIds, rng), cannotStart);
}

/**
 * Si le premier joueur de `order` ne peut pas commencer, on avance en tête le premier joueur
 * autorisé (les autres gardent leur ordre relatif). Si personne n'est autorisé, ordre inchangé.
 * Ne mute pas `order`.
 */
export function ensureAllowedFirst(order: readonly string[], cannotStart: readonly string[]): string[] {
  const result = [...order];
  if (result.length === 0 || cannotStart.length === 0) return result;
  const blocked = new Set(cannotStart);
  if (!blocked.has(result[0]!)) return result;
  const idx = result.findIndex((id) => !blocked.has(id));
  if (idx === -1) return result;
  const [first] = result.splice(idx, 1);
  result.unshift(first!);
  return result;
}

/**
 * Ordre pour un round suivant : filtre l'ordre précédent pour ne garder que les joueurs
 * encore vivants (alivePlayerIds), en conservant l'ordre relatif d'origine (sauf si le
 * premier restant est interdit de commencer : voir ensureAllowedFirst).
 */
export function recomputeTurnOrderAfterElimination(
  previousTurnOrder: string[],
  alivePlayerIds: readonly string[],
  cannotStart: readonly string[] = []
): string[] {
  const aliveSet = new Set(alivePlayerIds);
  return ensureAllowedFirst(
    previousTurnOrder.filter((id) => aliveSet.has(id)),
    cannotStart
  );
}

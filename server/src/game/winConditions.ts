// Évaluation des conditions de victoire — fonction pure, voir docs/CONTRACT.md section 4.
//
// Rappel de l'ordre d'évaluation (le cas 1, victoire immédiate sur bonne devinette de Mr
// White, est géré séparément par l'appelant au moment de traiter `mrwhite:guess` — cette
// fonction couvre les cas 2 à 5, évalués après chaque élimination / non-élimination) :
//
//   2. Civils gagnent      si undercoverAlive === 0 && mrWhiteAlive === 0
//   3. Undercover gagnent  si undercoverAlive > 0 && undercoverAlive >= civilsAlive
//   4. Mr White gagne      si undercoverAlive === 0 && mrWhiteAlive > 0 && mrWhiteAlive >= civilsAlive
//      (extension documentée au-delà du texte littéral de la spec, voir CONTRACT.md §4 et
//      server/README.md — évite toute partie infinie civils vs Mr White survivant seul)
//   5. Sinon la partie continue (retourne null)

import type { Winner } from '../types.js';

export interface AliveCounts {
  civilsAlive: number;
  undercoverAlive: number;
  mrWhiteAlive: number; // 0 ou 1 dans la pratique, mais on ne suppose rien ici
}

export function evaluateWinConditions(counts: AliveCounts): Winner | null {
  const { civilsAlive, undercoverAlive, mrWhiteAlive } = counts;

  if (undercoverAlive === 0 && mrWhiteAlive === 0) {
    return 'civils';
  }

  if (undercoverAlive > 0 && undercoverAlive >= civilsAlive) {
    return 'undercover';
  }

  if (undercoverAlive === 0 && mrWhiteAlive > 0 && mrWhiteAlive >= civilsAlive) {
    return 'mrwhite';
  }

  return null;
}

/**
 * Normalisation insensible à la casse et aux accents pour la comparaison de la devinette de
 * Mr White avec le champion A (celui des civils) — voir CONTRACT.md section 3, phase
 * mrwhite_guess.
 */
export function normalizeChampionGuess(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // retire les diacritiques (accents combinés post-NFD)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

export function isCorrectMrWhiteGuess(guess: string, championA: string): boolean {
  return normalizeChampionGuess(guess) === normalizeChampionGuess(championA);
}

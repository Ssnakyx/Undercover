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

/** Ponctuation ignorée en plus de la casse/des accents ("Kha'Zix" = "khazix", "Dr. Mario" = "dr mario"). */
function compactGuess(value: string): string {
  return normalizeChampionGuess(value).replace(/[^a-z0-9]/g, '');
}

function editDistance(a: string, b: string): number {
  const prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = tmp;
    }
  }
  return prev[b.length];
}

/**
 * Devinette de Mr White : insensible à la casse, aux accents et à la ponctuation, accepte les
 * alias (ex. nom anglais d'un Pokémon) et tolère une petite faute de frappe sur les noms longs
 * (1 lettre dès 5 caractères, 2 dès 9) — on veut récompenser la bonne réponse, pas l'orthographe.
 */
export function isCorrectMrWhiteGuess(guess: string, championA: string, aliases: readonly string[] = []): boolean {
  const g = compactGuess(guess);
  if (!g) return false;
  return [championA, ...aliases].some((candidate) => {
    const c = compactGuess(candidate);
    if (g === c) return true;
    const tolerance = c.length >= 9 ? 2 : c.length >= 5 ? 1 : 0;
    return tolerance > 0 && Math.abs(g.length - c.length) <= tolerance && editDistance(g, c) <= tolerance;
  });
}

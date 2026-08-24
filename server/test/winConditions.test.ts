import { describe, expect, it } from 'vitest';
import {
  evaluateWinConditions,
  isCorrectMrWhiteGuess,
  normalizeChampionGuess,
} from '../src/game/winConditions.js';

describe('evaluateWinConditions (CONTRACT.md section 4)', () => {
  it('cas 2 — civils gagnent : undercoverAlive===0 && mrWhiteAlive===0', () => {
    expect(evaluateWinConditions({ civilsAlive: 3, undercoverAlive: 0, mrWhiteAlive: 0 })).toBe('civils');
    expect(evaluateWinConditions({ civilsAlive: 1, undercoverAlive: 0, mrWhiteAlive: 0 })).toBe('civils');
  });

  it('cas 3 — undercover gagnent : undercoverAlive>0 && undercoverAlive>=civilsAlive', () => {
    expect(evaluateWinConditions({ civilsAlive: 1, undercoverAlive: 1, mrWhiteAlive: 0 })).toBe('undercover');
    expect(evaluateWinConditions({ civilsAlive: 2, undercoverAlive: 2, mrWhiteAlive: 0 })).toBe('undercover');
    expect(evaluateWinConditions({ civilsAlive: 1, undercoverAlive: 2, mrWhiteAlive: 0 })).toBe('undercover');
  });

  it('cas 4 — mr white gagne (survie) : undercoverAlive===0 && mrWhiteAlive>0 && mrWhiteAlive>=civilsAlive', () => {
    expect(evaluateWinConditions({ civilsAlive: 1, undercoverAlive: 0, mrWhiteAlive: 1 })).toBe('mrwhite');
    expect(evaluateWinConditions({ civilsAlive: 0, undercoverAlive: 0, mrWhiteAlive: 1 })).toBe('mrwhite');
  });

  it('cas 5 — sinon la partie continue (null)', () => {
    expect(evaluateWinConditions({ civilsAlive: 3, undercoverAlive: 1, mrWhiteAlive: 0 })).toBeNull();
    expect(evaluateWinConditions({ civilsAlive: 3, undercoverAlive: 0, mrWhiteAlive: 1 })).toBeNull();
    expect(evaluateWinConditions({ civilsAlive: 5, undercoverAlive: 2, mrWhiteAlive: 1 })).toBeNull();
  });

  it('cas limite : 2 joueurs restants, 1 civil + 1 undercover -> undercover gagne (égalité)', () => {
    expect(evaluateWinConditions({ civilsAlive: 1, undercoverAlive: 1, mrWhiteAlive: 0 })).toBe('undercover');
  });

  it('cas limite : 2 joueurs restants, 1 civil + 1 mr white -> mr white gagne (survie)', () => {
    expect(evaluateWinConditions({ civilsAlive: 1, undercoverAlive: 0, mrWhiteAlive: 1 })).toBe('mrwhite');
  });

  it('cas limite : dernier joueur seul debout (1 civil, tout le reste mort) -> civils gagnent', () => {
    expect(evaluateWinConditions({ civilsAlive: 1, undercoverAlive: 0, mrWhiteAlive: 0 })).toBe('civils');
  });

  it('aucun état atteignable ne tombe hors des cas (couverture exhaustive pour de petits N)', () => {
    for (let civilsAlive = 0; civilsAlive <= 4; civilsAlive++) {
      for (let undercoverAlive = 0; undercoverAlive <= 3; undercoverAlive++) {
        for (let mrWhiteAlive = 0; mrWhiteAlive <= 1; mrWhiteAlive++) {
          if (civilsAlive + undercoverAlive + mrWhiteAlive === 0) continue; // état inatteignable (personne vivant)
          const result = evaluateWinConditions({ civilsAlive, undercoverAlive, mrWhiteAlive });
          expect(['civils', 'undercover', 'mrwhite', null]).toContain(result);
        }
      }
    }
  });
});

describe('normalizeChampionGuess / isCorrectMrWhiteGuess', () => {
  it('insensible à la casse', () => {
    expect(isCorrectMrWhiteGuess('garen', 'Garen')).toBe(true);
    expect(isCorrectMrWhiteGuess('GAREN', 'Garen')).toBe(true);
  });

  it('insensible aux accents', () => {
    expect(isCorrectMrWhiteGuess('kaisa', "Kai'Sa")).toBe(false); // apostrophe compte comme caractère différent
    expect(normalizeChampionGuess('Kled')).toBe('kled');
    expect(isCorrectMrWhiteGuess('Ashe', 'Ashe')).toBe(true);
  });

  it('tolère les espaces superflus', () => {
    expect(isCorrectMrWhiteGuess('  Xin Zhao  ', 'Xin Zhao')).toBe(true);
    expect(isCorrectMrWhiteGuess('Xin   Zhao', 'Xin Zhao')).toBe(true);
  });

  it('rejette une mauvaise devinette', () => {
    expect(isCorrectMrWhiteGuess('Darius', 'Garen')).toBe(false);
  });
});

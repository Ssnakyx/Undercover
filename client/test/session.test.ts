import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearSession,
  getLastRoomCode,
  loadPseudo,
  loadSession,
  saveSession,
  savePseudo,
} from '../src/lib/session';

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('saveSession / loadSession', () => {
  it('sauvegarde puis relit playerId et sessionToken pour une room', () => {
    saveSession('ABCDE', { playerId: 'p1', sessionToken: 'tok1' });
    const session = loadSession('ABCDE');
    expect(session?.playerId).toBe('p1');
    expect(session?.sessionToken).toBe('tok1');
    expect(typeof session?.savedAt).toBe('number');
  });

  it('retourne null si aucune session n\'existe pour ce code', () => {
    expect(loadSession('ZZZZZ')).toBeNull();
  });

  it('retourne null pour du JSON invalide en storage', () => {
    localStorage.setItem('lolcover:ABCDE', '{not valid json');
    expect(loadSession('ABCDE')).toBeNull();
  });

  it('retourne null si les champs requis sont absents', () => {
    localStorage.setItem('lolcover:ABCDE', JSON.stringify({ playerId: 'p1' }));
    expect(loadSession('ABCDE')).toBeNull();
  });

  it('ne garde qu\'une seule session de room à la fois (les anciennes sont effacées)', () => {
    saveSession('AAAAA', { playerId: 'p1', sessionToken: 't1' });
    saveSession('BBBBB', { playerId: 'p2', sessionToken: 't2' });
    expect(loadSession('AAAAA')).toBeNull();
    expect(loadSession('BBBBB')?.playerId).toBe('p2');
  });

  it('ne touche pas au pseudo mémorisé lors du nettoyage des anciennes sessions', () => {
    savePseudo('NoctaJungle');
    saveSession('AAAAA', { playerId: 'p1', sessionToken: 't1' });
    saveSession('BBBBB', { playerId: 'p2', sessionToken: 't2' });
    expect(loadPseudo()).toBe('NoctaJungle');
  });
});

describe('clearSession', () => {
  it('supprime la session de la room ciblée', () => {
    saveSession('ABCDE', { playerId: 'p1', sessionToken: 'tok1' });
    clearSession('ABCDE');
    expect(loadSession('ABCDE')).toBeNull();
  });

  it('ne lève pas d\'erreur si la room n\'a pas de session', () => {
    expect(() => clearSession('ZZZZZ')).not.toThrow();
  });
});

describe('getLastRoomCode', () => {
  it('retourne null si aucune session n\'est stockée', () => {
    expect(getLastRoomCode()).toBeNull();
  });

  it('retourne le code de la room la plus récemment sauvegardée', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1000);
    saveSession('AAAAA', { playerId: 'p1', sessionToken: 't1' });
    vi.spyOn(Date, 'now').mockReturnValue(2000);
    saveSession('BBBBB', { playerId: 'p2', sessionToken: 't2' });
    expect(getLastRoomCode()).toBe('BBBBB');
  });

  it('ignore la clé de pseudo mémorisé', () => {
    savePseudo('SoloJoueur');
    expect(getLastRoomCode()).toBeNull();
  });
});

describe('savePseudo / loadPseudo', () => {
  it('sauvegarde puis relit un pseudo', () => {
    savePseudo('  NoctaJungle  ');
    expect(loadPseudo()).toBe('NoctaJungle');
  });

  it('retourne une chaîne vide si aucun pseudo n\'est sauvegardé', () => {
    expect(loadPseudo()).toBe('');
  });

  it('un pseudo vide ou uniquement des espaces efface le pseudo mémorisé', () => {
    savePseudo('NoctaJungle');
    savePseudo('   ');
    expect(loadPseudo()).toBe('');
  });
});

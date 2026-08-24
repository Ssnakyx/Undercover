// Persistance de session — CONTRACT.md §5 : localStorage['lolcover:{roomCode}'] = { playerId, sessionToken }

export interface StoredSession {
  playerId: string;
  sessionToken: string;
}

const ROOM_KEY_PREFIX = 'lolcover:';
// Pseudo mémorisé indépendamment de toute room, pour ne pas avoir à le retaper à chaque partie.
const PSEUDO_KEY = 'lolcover:pseudo';

function storageKey(roomCode: string): string {
  return `${ROOM_KEY_PREFIX}${roomCode}`;
}

export function saveSession(roomCode: string, session: StoredSession): void {
  localStorage.setItem(storageKey(roomCode), JSON.stringify(session));
}

export function loadSession(roomCode: string): StoredSession | null {
  const raw = localStorage.getItem(storageKey(roomCode));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed?.playerId === 'string' && typeof parsed?.sessionToken === 'string') {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function clearSession(roomCode: string): void {
  localStorage.removeItem(storageKey(roomCode));
}

// Quitter une partie (bouton "Quitter", fermeture d'onglet, navigation ailleurs) ne doit pas
// être un cul-de-sac : tant qu'une session de room n'a pas été explicitement effacée (départ
// confirmé côté serveur, ou rejoin refusé — room expirée/session invalide), elle reste en
// localStorage et peut être proposée en reprise depuis le menu principal (voir MainMenu.tsx).
export function listStoredRoomCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || key === PSEUDO_KEY || !key.startsWith(ROOM_KEY_PREFIX)) continue;
    const code = key.slice(ROOM_KEY_PREFIX.length);
    if (loadSession(code)) codes.push(code);
  }
  return codes;
}

export function savePseudo(name: string): void {
  const trimmed = name.trim();
  if (trimmed) {
    localStorage.setItem(PSEUDO_KEY, trimmed);
  } else {
    localStorage.removeItem(PSEUDO_KEY);
  }
}

export function loadPseudo(): string {
  return localStorage.getItem(PSEUDO_KEY) ?? '';
}

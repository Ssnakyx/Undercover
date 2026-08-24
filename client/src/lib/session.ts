// Persistance de session — CONTRACT.md §5 : localStorage['lolcover:{roomCode}'] = { playerId, sessionToken }

export interface StoredSession {
  playerId: string;
  sessionToken: string;
}

function storageKey(roomCode: string): string {
  return `lolcover:${roomCode}`;
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

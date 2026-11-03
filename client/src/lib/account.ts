// Comptes joueurs (optionnels) : appels à l'API HTTP du serveur (server/src/accounts/routes.ts),
// jeton de session mémorisé sur l'appareil, recadrage de la photo de profil.
//
// La clé localStorage n'utilise PAS le préfixe 'lolcover:' : lib/session.ts considère toute clé
// 'lolcover:*' comme une session de room et les purge.

import { SERVER_URL } from '../socket/client';
import type { PublicAccountTag, Role } from '../types';

const TOKEN_KEY = 'undercover-account-token';

export interface Account {
  id: string;
  username: string;
  photoVersion: number;
  createdAt: number;
}

export interface StatLine {
  played: number;
  won: number;
  lost: number;
}

export interface AccountStats extends StatLine {
  byRole: ({ role: Role } & StatLine)[];
}

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

// ---------------------------------------------------------------------------
// Jeton : petite source observable, partagée par AccountProvider et RoomProvider (qui rattache
// le compte au siège de la room à chaque changement).
// ---------------------------------------------------------------------------

const listeners = new Set<(token: string | null) => void>();

export function getAccountToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAccountToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // stockage indisponible (navigation privée stricte) : session limitée à l'onglet
  }
  listeners.forEach((l) => l(token));
}

export function subscribeAccountToken(listener: (token: string | null) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

async function api<T>(method: string, path: string, body?: unknown, token?: string | null): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${SERVER_URL}/api${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('NETWORK', 'Serveur injoignable. Il se réveille peut-être, réessaie dans quelques secondes.', 0);
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(data?.error?.code ?? 'SERVER_ERROR', data?.error?.message ?? 'Erreur serveur, réessaie plus tard', res.status);
  }
  return data as T;
}

export function apiRegister(username: string, password: string) {
  return api<{ token: string; account: Account }>('POST', '/auth/register', { username, password });
}

export function apiLogin(username: string, password: string) {
  return api<{ token: string; account: Account }>('POST', '/auth/login', { username, password });
}

export function apiLogout(token: string) {
  return api<{ ok: true }>('POST', '/auth/logout', undefined, token);
}

export function apiMe(token: string) {
  return api<{ account: Account; stats: AccountStats }>('GET', '/me', undefined, token);
}

export function apiSetPhoto(token: string, dataUrl: string | null) {
  return dataUrl === null
    ? api<{ account: Account }>('DELETE', '/me/photo', undefined, token)
    : api<{ account: Account }>('PUT', '/me/photo', { dataUrl }, token);
}

export function apiPublicProfile(accountId: string) {
  return api<{ account: Account; stats: AccountStats }>('GET', `/accounts/${encodeURIComponent(accountId)}`);
}

/** URL de la photo d'un compte, null s'il n'en a pas. */
export function accountPhotoUrl(account: Pick<PublicAccountTag, 'id' | 'photoVersion'> | null | undefined): string | null {
  if (!account || account.photoVersion <= 0) return null;
  return `${SERVER_URL}/api/accounts/${encodeURIComponent(account.id)}/photo?v=${account.photoVersion}`;
}

export function winRate(line: StatLine): number | null {
  return line.played > 0 ? Math.round((line.won / line.played) * 100) : null;
}

// ---------------------------------------------------------------------------
// Photo : recadrage carré centré + compression JPEG, pour rester bien sous la limite serveur.
// ---------------------------------------------------------------------------

export const PHOTO_SIZE = 256;

export async function fileToProfilePhoto(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new ApiError('INVALID_PHOTO', 'Choisis une image.', 0);
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new ApiError('INVALID_PHOTO', "Impossible de lire cette image.", 0));
      el.src = url;
    });
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const canvas = document.createElement('canvas');
    canvas.width = PHOTO_SIZE;
    canvas.height = PHOTO_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new ApiError('INVALID_PHOTO', "Impossible de lire cette image.", 0);
    ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, PHOTO_SIZE, PHOTO_SIZE);
    return canvas.toDataURL('image/jpeg', 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}

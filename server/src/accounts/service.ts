// Logique des comptes joueurs : inscription, connexion, photo de profil, statistiques.
// Indépendant d'Express et de Socket.io (voir routes.ts et socket/handlers.ts) pour être
// testable directement.

import { createHash, randomBytes, randomUUID, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import type { Role } from '../types.js';
import { MemoryAccountStore, PgAccountStore, type AccountRecord, type AccountStore, type GameResultEntry, type StoredPhoto } from './store.js';

const scrypt = promisify(scryptCb) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>;

export const USERNAME_REGEX = /^[A-Za-z0-9_.-]{3,20}$/;
export const PASSWORD_MIN_LENGTH = 6;
export const PASSWORD_MAX_LENGTH = 128;
/** Taille max d'une photo décodée : le client la recadre en 256×256 JPEG (≈ 20-40 Ko). */
export const PHOTO_MAX_BYTES = 200 * 1024;

export const ALL_ROLES: Role[] = ['civil', 'undercover', 'mrwhite', 'spy', 'protector', 'ghost', 'hunter', 'jester'];

// ---------------------------------------------------------------------------
// Store courant (Postgres si DATABASE_URL, sinon mémoire)
// ---------------------------------------------------------------------------

let store: AccountStore = new MemoryAccountStore();

export function getAccountStore(): AccountStore {
  return store;
}

export function _setAccountStoreForTests(next: AccountStore): void {
  store = next;
}

export async function initAccountStore(databaseUrl: string | undefined): Promise<void> {
  if (databaseUrl) {
    const pgStore = new PgAccountStore(databaseUrl);
    store = pgStore;
    // Base injoignable au démarrage (Neon qui se réveille, réseau...) : on réessaie en fond
    // plutôt que de basculer en mémoire, ce qui ferait perdre les comptes créés entre-temps.
    for (let attempt = 1; ; attempt++) {
      try {
        await pgStore.init();
        // eslint-disable-next-line no-console
        console.log('[accounts] comptes joueurs : base Postgres connectée');
        return;
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(`[accounts] connexion Postgres impossible (essai ${attempt})`, (err as Error).message);
        await new Promise((r) => setTimeout(r, Math.min(60_000, 5_000 * attempt)));
      }
    }
  } else {
    store = new MemoryAccountStore();
    // eslint-disable-next-line no-console
    console.warn('[accounts] DATABASE_URL absent : comptes en mémoire, perdus à chaque redémarrage');
  }
}

// ---------------------------------------------------------------------------
// Types publics (renvoyés au client)
// ---------------------------------------------------------------------------

export interface AccountPublic {
  id: string;
  username: string;
  /** 0 = pas de photo ; sinon sert à casser le cache de GET /api/accounts/:id/photo?v=... */
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

export function toAccountPublic(a: AccountRecord): AccountPublic {
  return { id: a.id, username: a.username, photoVersion: a.photoVersion, createdAt: a.createdAt };
}

export class AccountError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 400
  ) {
    super(message);
  }
}

// ---------------------------------------------------------------------------
// Mots de passe et jetons de session
// ---------------------------------------------------------------------------

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString('base64')}$${key.toString('base64')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algo, saltB64, keyB64] = stored.split('$');
  if (algo !== 'scrypt' || !saltB64 || !keyB64) return false;
  const expected = Buffer.from(keyB64, 'base64');
  const actual = await scrypt(password, Buffer.from(saltB64, 'base64'), expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** Seul le hash du jeton est stocké : une fuite de la base ne donne accès à aucun compte. */
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

async function openSession(accountId: string): Promise<string> {
  const token = randomBytes(32).toString('base64url');
  await store.createSession(hashToken(token), accountId);
  return token;
}

// ---------------------------------------------------------------------------
// Inscription / connexion
// ---------------------------------------------------------------------------

function validateCredentials(username: unknown, password: unknown): { username: string; password: string } {
  if (typeof username !== 'string' || !USERNAME_REGEX.test(username.trim())) {
    throw new AccountError('INVALID_USERNAME', 'Pseudo de compte : 3 à 20 caractères (lettres, chiffres, _ . -)');
  }
  if (typeof password !== 'string' || password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
    throw new AccountError('INVALID_PASSWORD', `Mot de passe : ${PASSWORD_MIN_LENGTH} caractères minimum`);
  }
  return { username: username.trim(), password };
}

export async function register(username: unknown, password: unknown): Promise<{ token: string; account: AccountPublic }> {
  const creds = validateCredentials(username, password);
  const account: AccountRecord = {
    id: randomUUID(),
    username: creds.username,
    passwordHash: await hashPassword(creds.password),
    photoVersion: 0,
    createdAt: Date.now(),
  };
  const res = await store.createAccount(account);
  if (res === 'username_taken') throw new AccountError('USERNAME_TAKEN', 'Ce pseudo de compte est déjà pris', 409);
  return { token: await openSession(account.id), account: toAccountPublic(account) };
}

export async function login(username: unknown, password: unknown): Promise<{ token: string; account: AccountPublic }> {
  if (typeof username !== 'string' || typeof password !== 'string') {
    throw new AccountError('BAD_CREDENTIALS', 'Pseudo ou mot de passe incorrect', 401);
  }
  const account = await store.findByUsername(username.trim());
  if (!account || !(await verifyPassword(password, account.passwordHash))) {
    throw new AccountError('BAD_CREDENTIALS', 'Pseudo ou mot de passe incorrect', 401);
  }
  return { token: await openSession(account.id), account: toAccountPublic(account) };
}

export async function logout(token: string): Promise<void> {
  await store.deleteSession(hashToken(token));
}

/** Compte associé à un jeton, ou null si le jeton est inconnu/révoqué. */
export async function accountFromToken(token: unknown): Promise<AccountRecord | null> {
  if (typeof token !== 'string' || token.length < 20 || token.length > 200) return null;
  const accountId = await store.findSessionAccountId(hashToken(token));
  return accountId ? store.findById(accountId) : null;
}

// ---------------------------------------------------------------------------
// Photo de profil
// ---------------------------------------------------------------------------

const PHOTO_MIMES: Record<string, (b: Buffer) => boolean> = {
  'image/jpeg': (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  'image/png': (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  'image/webp': (b) => b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP',
};

/** Décode et vérifie une photo envoyée en data URL (type annoncé ET signature du fichier). */
export function parsePhotoDataUrl(dataUrl: unknown): StoredPhoto {
  const match = typeof dataUrl === 'string' ? dataUrl.match(/^data:(image\/[a-z]+);base64,([A-Za-z0-9+/=]+)$/) : null;
  const check = match ? PHOTO_MIMES[match[1]] : undefined;
  if (!match || !check) throw new AccountError('INVALID_PHOTO', 'Image invalide (JPEG, PNG ou WebP)');
  const data = Buffer.from(match[2], 'base64');
  if (data.length === 0 || data.length > PHOTO_MAX_BYTES) throw new AccountError('PHOTO_TOO_LARGE', 'Image trop lourde', 413);
  if (!check(data)) throw new AccountError('INVALID_PHOTO', 'Image invalide (JPEG, PNG ou WebP)');
  return { mime: match[1], data };
}

export async function setPhoto(account: AccountRecord, dataUrl: unknown | null): Promise<AccountPublic> {
  const photo = dataUrl === null ? null : parsePhotoDataUrl(dataUrl);
  const photoVersion = await store.setPhoto(account.id, photo);
  return toAccountPublic({ ...account, photoVersion });
}

// ---------------------------------------------------------------------------
// Statistiques
// ---------------------------------------------------------------------------

export async function getStats(accountId: string): Promise<AccountStats> {
  const rows = await store.getRoleStats(accountId);
  const byRole = ALL_ROLES.map((role) => {
    const r = rows.find((x) => x.role === role);
    const played = r?.played ?? 0;
    const won = r?.won ?? 0;
    return { role, played, won, lost: played - won };
  });
  const played = byRole.reduce((n, r) => n + r.played, 0);
  const won = byRole.reduce((n, r) => n + r.won, 0);
  return { played, won, lost: played - won, byRole };
}

/** Une entrée par compte (un même compte ne compte qu'une fois, voir socket account:attach). */
export async function recordGameResults(entries: GameResultEntry[]): Promise<void> {
  const seen = new Set<string>();
  const unique = entries.filter((e) => !seen.has(e.accountId) && seen.add(e.accountId));
  await store.recordGameResults(unique);
}

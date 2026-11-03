// Persistance des comptes joueurs (optionnels : on joue toujours sans compte).
//
// Deux implémentations derrière la même interface :
// - PgAccountStore : Postgres (Neon, Supabase...) dès que DATABASE_URL est défini. Les tables
//   sont créées automatiquement au démarrage (CREATE TABLE IF NOT EXISTS), aucune migration à
//   lancer à la main.
// - MemoryAccountStore : en mémoire, pour le dev local et les tests. Tout est perdu au
//   redémarrage du serveur : en prod, il FAUT un DATABASE_URL.

import pg from 'pg';
import type { Role } from '../types.js';

export interface AccountRecord {
  id: string;
  username: string; // casse d'affichage
  passwordHash: string;
  photoVersion: number; // 0 = pas de photo
  createdAt: number; // epoch ms
}

export interface StoredPhoto {
  mime: string;
  data: Buffer;
}

/** Une ligne par (compte, rôle) : la stat globale est la somme des lignes. */
export interface RoleStatRow {
  role: Role;
  played: number;
  won: number;
}

export interface GameResultEntry {
  accountId: string;
  role: Role;
  won: boolean;
}

export interface AccountStore {
  readonly persistent: boolean;
  init(): Promise<void>;
  createAccount(account: AccountRecord): Promise<'ok' | 'username_taken'>;
  findByUsername(username: string): Promise<AccountRecord | null>;
  findById(id: string): Promise<AccountRecord | null>;
  createSession(tokenHash: string, accountId: string): Promise<void>;
  findSessionAccountId(tokenHash: string): Promise<string | null>;
  deleteSession(tokenHash: string): Promise<void>;
  setPhoto(accountId: string, photo: StoredPhoto | null): Promise<number>;
  getPhoto(accountId: string): Promise<StoredPhoto | null>;
  getRoleStats(accountId: string): Promise<RoleStatRow[]>;
  recordGameResults(entries: GameResultEntry[]): Promise<void>;
}

// ---------------------------------------------------------------------------

export class MemoryAccountStore implements AccountStore {
  readonly persistent = false;
  private accounts = new Map<string, AccountRecord>();
  private byUsername = new Map<string, string>();
  private sessions = new Map<string, string>();
  private photos = new Map<string, StoredPhoto>();
  private stats = new Map<string, Map<Role, RoleStatRow>>();

  async init(): Promise<void> {}

  async createAccount(account: AccountRecord): Promise<'ok' | 'username_taken'> {
    const key = account.username.toLowerCase();
    if (this.byUsername.has(key)) return 'username_taken';
    this.accounts.set(account.id, { ...account });
    this.byUsername.set(key, account.id);
    return 'ok';
  }

  async findByUsername(username: string): Promise<AccountRecord | null> {
    const id = this.byUsername.get(username.toLowerCase());
    return id ? this.findById(id) : null;
  }

  async findById(id: string): Promise<AccountRecord | null> {
    const a = this.accounts.get(id);
    return a ? { ...a } : null;
  }

  async createSession(tokenHash: string, accountId: string): Promise<void> {
    this.sessions.set(tokenHash, accountId);
  }

  async findSessionAccountId(tokenHash: string): Promise<string | null> {
    return this.sessions.get(tokenHash) ?? null;
  }

  async deleteSession(tokenHash: string): Promise<void> {
    this.sessions.delete(tokenHash);
  }

  async setPhoto(accountId: string, photo: StoredPhoto | null): Promise<number> {
    const a = this.accounts.get(accountId);
    if (!a) return 0;
    if (photo) {
      this.photos.set(accountId, photo);
      a.photoVersion += 1;
    } else {
      this.photos.delete(accountId);
      a.photoVersion = 0;
    }
    return a.photoVersion;
  }

  async getPhoto(accountId: string): Promise<StoredPhoto | null> {
    return this.photos.get(accountId) ?? null;
  }

  async getRoleStats(accountId: string): Promise<RoleStatRow[]> {
    return [...(this.stats.get(accountId)?.values() ?? [])].map((r) => ({ ...r }));
  }

  async recordGameResults(entries: GameResultEntry[]): Promise<void> {
    for (const e of entries) {
      let perRole = this.stats.get(e.accountId);
      if (!perRole) {
        perRole = new Map();
        this.stats.set(e.accountId, perRole);
      }
      const row = perRole.get(e.role) ?? { role: e.role, played: 0, won: 0 };
      row.played += 1;
      if (e.won) row.won += 1;
      perRole.set(e.role, row);
    }
  }
}

// ---------------------------------------------------------------------------

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  username_lower TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  photo_mime TEXT,
  photo_data BYTEA,
  photo_version INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS account_sessions (
  token_hash TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS account_role_stats (
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  played INTEGER NOT NULL DEFAULT 0,
  won INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (account_id, role)
);
`;

interface AccountRow {
  id: string;
  username: string;
  password_hash: string;
  photo_version: number;
  created_at: Date;
}

function rowToAccount(r: AccountRow): AccountRecord {
  return {
    id: r.id,
    username: r.username,
    passwordHash: r.password_hash,
    photoVersion: r.photo_version,
    createdAt: new Date(r.created_at).getTime(),
  };
}

const ACCOUNT_COLUMNS = 'id, username, password_hash, photo_version, created_at';

export class PgAccountStore implements AccountStore {
  readonly persistent = true;
  private pool: pg.Pool;

  constructor(connectionString: string) {
    // Neon / Supabase exigent TLS ; en local (localhost) on s'en passe.
    const local = /@(localhost|127\.0\.0\.1)[:/]/.test(connectionString);
    this.pool = new pg.Pool({
      connectionString,
      ssl: local ? undefined : { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30_000,
    });
    this.pool.on('error', (err) => {
      // eslint-disable-next-line no-console
      console.error('[accounts] erreur Postgres (pool)', err.message);
    });
  }

  async init(): Promise<void> {
    await this.pool.query(SCHEMA_SQL);
  }

  async createAccount(account: AccountRecord): Promise<'ok' | 'username_taken'> {
    try {
      await this.pool.query(
        'INSERT INTO accounts (id, username, username_lower, password_hash) VALUES ($1, $2, $3, $4)',
        [account.id, account.username, account.username.toLowerCase(), account.passwordHash]
      );
      return 'ok';
    } catch (err) {
      if ((err as { code?: string }).code === '23505') return 'username_taken';
      throw err;
    }
  }

  async findByUsername(username: string): Promise<AccountRecord | null> {
    const { rows } = await this.pool.query<AccountRow>(
      `SELECT ${ACCOUNT_COLUMNS} FROM accounts WHERE username_lower = $1`,
      [username.toLowerCase()]
    );
    return rows[0] ? rowToAccount(rows[0]) : null;
  }

  async findById(id: string): Promise<AccountRecord | null> {
    const { rows } = await this.pool.query<AccountRow>(`SELECT ${ACCOUNT_COLUMNS} FROM accounts WHERE id = $1`, [id]);
    return rows[0] ? rowToAccount(rows[0]) : null;
  }

  async createSession(tokenHash: string, accountId: string): Promise<void> {
    await this.pool.query('INSERT INTO account_sessions (token_hash, account_id) VALUES ($1, $2)', [tokenHash, accountId]);
  }

  async findSessionAccountId(tokenHash: string): Promise<string | null> {
    const { rows } = await this.pool.query<{ account_id: string }>(
      'SELECT account_id FROM account_sessions WHERE token_hash = $1',
      [tokenHash]
    );
    return rows[0]?.account_id ?? null;
  }

  async deleteSession(tokenHash: string): Promise<void> {
    await this.pool.query('DELETE FROM account_sessions WHERE token_hash = $1', [tokenHash]);
  }

  async setPhoto(accountId: string, photo: StoredPhoto | null): Promise<number> {
    const { rows } = photo
      ? await this.pool.query<{ photo_version: number }>(
          'UPDATE accounts SET photo_mime = $2, photo_data = $3, photo_version = photo_version + 1 WHERE id = $1 RETURNING photo_version',
          [accountId, photo.mime, photo.data]
        )
      : await this.pool.query<{ photo_version: number }>(
          'UPDATE accounts SET photo_mime = NULL, photo_data = NULL, photo_version = 0 WHERE id = $1 RETURNING photo_version',
          [accountId]
        );
    return rows[0]?.photo_version ?? 0;
  }

  async getPhoto(accountId: string): Promise<StoredPhoto | null> {
    const { rows } = await this.pool.query<{ photo_mime: string | null; photo_data: Buffer | null }>(
      'SELECT photo_mime, photo_data FROM accounts WHERE id = $1',
      [accountId]
    );
    const r = rows[0];
    return r?.photo_mime && r.photo_data ? { mime: r.photo_mime, data: r.photo_data } : null;
  }

  async getRoleStats(accountId: string): Promise<RoleStatRow[]> {
    const { rows } = await this.pool.query<RoleStatRow>(
      'SELECT role, played, won FROM account_role_stats WHERE account_id = $1',
      [accountId]
    );
    return rows;
  }

  async recordGameResults(entries: GameResultEntry[]): Promise<void> {
    if (entries.length === 0) return;
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      for (const e of entries) {
        await client.query(
          `INSERT INTO account_role_stats (account_id, role, played, won) VALUES ($1, $2, 1, $3)
           ON CONFLICT (account_id, role) DO UPDATE
           SET played = account_role_stats.played + 1, won = account_role_stats.won + EXCLUDED.won`,
          [e.accountId, e.role, e.won ? 1 : 0]
        );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  }
}

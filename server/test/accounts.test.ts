import http from 'node:http';
import type { AddressInfo } from 'node:net';
import express from 'express';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { MemoryAccountStore } from '../src/accounts/store.js';
import {
  _setAccountStoreForTests,
  accountFromToken,
  getStats,
  hashPassword,
  login,
  parsePhotoDataUrl,
  recordGameResults,
  register,
  verifyPassword,
} from '../src/accounts/service.js';
import { _resetAuthRateLimitForTests, accountsRouter } from '../src/accounts/routes.js';
import { isOnWinningTeam } from '../src/game/engine.js';

// Plus petit JPEG/PNG reconnaissables par leur signature (le contenu exact n'importe pas ici).
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);

beforeEach(() => {
  _setAccountStoreForTests(new MemoryAccountStore());
  _resetAuthRateLimitForTests();
});

describe('mots de passe', () => {
  it('vérifie le bon mot de passe et refuse les autres', async () => {
    const hash = await hashPassword('hunter22');
    expect(hash).not.toContain('hunter22');
    expect(await verifyPassword('hunter22', hash)).toBe(true);
    expect(await verifyPassword('hunter23', hash)).toBe(false);
    expect(await verifyPassword('hunter22', 'n/importe/quoi')).toBe(false);
  });
});

describe('inscription et connexion', () => {
  it('crée un compte, puis s’y reconnecte sans tenir compte de la casse', async () => {
    const { token, account } = await register('Snaky', 'motdepasse');
    expect(account.username).toBe('Snaky');
    expect((await accountFromToken(token))?.id).toBe(account.id);
    const again = await login('snaky', 'motdepasse');
    expect(again.account.id).toBe(account.id);
  });

  it('refuse un pseudo déjà pris (casse ignorée)', async () => {
    await register('Snaky', 'motdepasse');
    await expect(register('SNAKY', 'autre123')).rejects.toMatchObject({ code: 'USERNAME_TAKEN' });
  });

  it('valide pseudo et mot de passe', async () => {
    await expect(register('a', 'motdepasse')).rejects.toMatchObject({ code: 'INVALID_USERNAME' });
    await expect(register('avec espace', 'motdepasse')).rejects.toMatchObject({ code: 'INVALID_USERNAME' });
    await expect(register('Snaky', '123')).rejects.toMatchObject({ code: 'INVALID_PASSWORD' });
  });

  it('même message pour un pseudo inconnu et un mauvais mot de passe', async () => {
    await register('Snaky', 'motdepasse');
    await expect(login('Snaky', 'faux')).rejects.toMatchObject({ code: 'BAD_CREDENTIALS' });
    await expect(login('Inconnu', 'motdepasse')).rejects.toMatchObject({ code: 'BAD_CREDENTIALS' });
  });

  it('ignore les jetons invalides', async () => {
    expect(await accountFromToken('x')).toBeNull();
    expect(await accountFromToken(undefined)).toBeNull();
    expect(await accountFromToken('a'.repeat(43))).toBeNull();
  });
});

describe('photo de profil', () => {
  it('accepte un JPEG ou un PNG en data URL', () => {
    expect(parsePhotoDataUrl(`data:image/jpeg;base64,${JPEG.toString('base64')}`).mime).toBe('image/jpeg');
    expect(parsePhotoDataUrl(`data:image/png;base64,${PNG.toString('base64')}`).mime).toBe('image/png');
  });

  it('refuse un type qui ne correspond pas au contenu, ou un autre format', () => {
    expect(() => parsePhotoDataUrl(`data:image/png;base64,${JPEG.toString('base64')}`)).toThrow();
    expect(() => parsePhotoDataUrl(`data:image/svg+xml;base64,${Buffer.from('<svg/>').toString('base64')}`)).toThrow();
    expect(() => parsePhotoDataUrl('pas une image')).toThrow();
  });

  it('refuse une image trop lourde', () => {
    const big = Buffer.concat([JPEG, Buffer.alloc(300 * 1024)]);
    expect(() => parsePhotoDataUrl(`data:image/jpeg;base64,${big.toString('base64')}`)).toThrow(/lourde/);
  });
});

describe('statistiques', () => {
  it('cumule parties, victoires et défaites, au global et par rôle', async () => {
    const { account } = await register('Snaky', 'motdepasse');
    await recordGameResults([{ accountId: account.id, role: 'civil', won: true }]);
    await recordGameResults([{ accountId: account.id, role: 'civil', won: false }]);
    await recordGameResults([{ accountId: account.id, role: 'undercover', won: true }]);
    const stats = await getStats(account.id);
    expect(stats).toMatchObject({ played: 3, won: 2, lost: 1 });
    expect(stats.byRole.find((r) => r.role === 'civil')).toEqual({ role: 'civil', played: 2, won: 1, lost: 1 });
    expect(stats.byRole.find((r) => r.role === 'undercover')).toEqual({ role: 'undercover', played: 1, won: 1, lost: 0 });
    expect(stats.byRole.find((r) => r.role === 'mrwhite')).toEqual({ role: 'mrwhite', played: 0, won: 0, lost: 0 });
  });

  it('ne compte jamais deux fois le même compte dans une partie', async () => {
    const { account } = await register('Snaky', 'motdepasse');
    await recordGameResults([
      { accountId: account.id, role: 'civil', won: true },
      { accountId: account.id, role: 'civil', won: true },
    ]);
    expect((await getStats(account.id)).played).toBe(1);
  });

  it('camp vainqueur : les variantes civiles gagnent avec les civils', () => {
    expect(isOnWinningTeam('spy', 'civils')).toBe(true);
    expect(isOnWinningTeam('hunter', 'civils')).toBe(true);
    expect(isOnWinningTeam('undercover', 'civils')).toBe(false);
    expect(isOnWinningTeam('jester', 'jester')).toBe(true);
    expect(isOnWinningTeam('civil', 'mrwhite')).toBe(false);
    expect(isOnWinningTeam(null, 'civils')).toBe(false);
  });
});

describe('API HTTP', () => {
  let server: http.Server;
  let base: string;

  beforeAll(async () => {
    const app = express();
    app.use('/api', accountsRouter());
    server = http.createServer(app);
    await new Promise<void>((r) => server.listen(0, r));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;
  });

  afterAll(() => new Promise<void>((r) => server.close(() => r())));

  async function call(method: string, path: string, body?: unknown, token?: string) {
    const res = await fetch(`${base}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    return { status: res.status, json: text ? JSON.parse(text) : null };
  }

  it('parcours complet : inscription, profil, photo, déconnexion', async () => {
    const reg = await call('POST', '/auth/register', { username: 'Snaky', password: 'motdepasse' });
    expect(reg.status).toBe(201);
    const token = reg.json.token as string;

    const me = await call('GET', '/me', undefined, token);
    expect(me.status).toBe(200);
    expect(me.json.account.username).toBe('Snaky');
    expect(me.json.stats.played).toBe(0);

    const photo = await call('PUT', '/me/photo', { dataUrl: `data:image/jpeg;base64,${JPEG.toString('base64')}` }, token);
    expect(photo.status).toBe(200);
    expect(photo.json.account.photoVersion).toBe(1);

    const img = await fetch(`${base}/accounts/${reg.json.account.id}/photo?v=1`);
    expect(img.status).toBe(200);
    expect(img.headers.get('content-type')).toContain('image/jpeg');

    const pub = await call('GET', `/accounts/${reg.json.account.id}`);
    expect(pub.json.account).not.toHaveProperty('passwordHash');

    expect((await call('POST', '/auth/logout', undefined, token)).status).toBe(200);
    expect((await call('GET', '/me', undefined, token)).status).toBe(401);
  });

  it('erreurs propres en JSON', async () => {
    expect((await call('GET', '/me')).status).toBe(401);
    const bad = await call('POST', '/auth/login', { username: 'x', password: 'y' });
    expect(bad.status).toBe(401);
    expect(bad.json.error.code).toBe('BAD_CREDENTIALS');
  });

  it('limite les tentatives de connexion', async () => {
    let last = 0;
    for (let i = 0; i < 25; i++) last = (await call('POST', '/auth/login', { username: 'x', password: 'y' })).status;
    expect(last).toBe(429);
  });
});

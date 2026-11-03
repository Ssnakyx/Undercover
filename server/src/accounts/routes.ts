// API HTTP des comptes joueurs. Authentification : en-tête `Authorization: Bearer <jeton>`.
//
//   POST   /api/auth/register      { username, password }  -> { token, account }
//   POST   /api/auth/login         { username, password }  -> { token, account }
//   POST   /api/auth/logout
//   GET    /api/me                                          -> { account, stats }
//   PUT    /api/me/photo           { dataUrl }              -> { account }
//   DELETE /api/me/photo                                    -> { account }
//   GET    /api/accounts/:id                                -> { account, stats } (profil public)
//   GET    /api/accounts/:id/photo                          -> image
//   GET    /api/accounts/status                             -> { enabled, persistent }

import express, { type NextFunction, type Request, type Response, type Router } from 'express';
import {
  AccountError,
  accountFromToken,
  getAccountStore,
  getStats,
  login,
  logout,
  register,
  setPhoto,
  toAccountPublic,
} from './service.js';
import type { AccountRecord } from './store.js';
import { clientIpFromHeaders } from '../security/clientIp.js';

// Limite simple anti-force brute sur inscription/connexion : N tentatives par IP et par fenêtre.
const AUTH_WINDOW_MS = 10 * 60 * 1000;
const AUTH_MAX_ATTEMPTS = 20;
const authAttempts = new Map<string, { count: number; resetAt: number }>();

function clientIp(req: Request): string {
  return clientIpFromHeaders(req.headers, req.socket.remoteAddress);
}

function authRateLimit(req: Request, res: Response, next: NextFunction): void {
  const now = Date.now();
  if (authAttempts.size > 10_000) {
    for (const [k, v] of authAttempts) if (v.resetAt <= now) authAttempts.delete(k);
  }
  const ip = clientIp(req);
  const entry = authAttempts.get(ip);
  if (!entry || entry.resetAt <= now) {
    authAttempts.set(ip, { count: 1, resetAt: now + AUTH_WINDOW_MS });
    next();
    return;
  }
  entry.count += 1;
  if (entry.count > AUTH_MAX_ATTEMPTS) {
    res.status(429).json({ error: { code: 'TOO_MANY_ATTEMPTS', message: 'Trop de tentatives, réessaie dans quelques minutes' } });
    return;
  }
  next();
}

export function _resetAuthRateLimitForTests(): void {
  authAttempts.clear();
}

function bearerToken(req: Request): string | null {
  const h = req.headers.authorization;
  return h?.startsWith('Bearer ') ? h.slice(7).trim() : null;
}

type AuthedRequest = Request & { account: AccountRecord; token: string };

/** Enveloppe async : erreurs métier -> JSON propre, le reste -> 500. */
function handle(fn: (req: Request, res: Response) => Promise<void>) {
  return (req: Request, res: Response) => {
    fn(req, res).catch((err: unknown) => {
      if (err instanceof AccountError) {
        res.status(err.status).json({ error: { code: err.code, message: err.message } });
        return;
      }
      // eslint-disable-next-line no-console
      console.error('[accounts]', err);
      res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Erreur serveur, réessaie plus tard' } });
    });
  };
}

function authed(fn: (req: AuthedRequest, res: Response) => Promise<void>) {
  return handle(async (req, res) => {
    const token = bearerToken(req);
    const account = token ? await accountFromToken(token) : null;
    if (!token || !account) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Session expirée, reconnecte-toi' } });
      return;
    }
    await fn(Object.assign(req, { account, token }), res);
  });
}

export function accountsRouter(): Router {
  const router = express.Router();
  // La photo arrive en data URL base64 : plus large que la limite JSON par défaut (100 Ko).
  router.use(express.json({ limit: '400kb' }));

  router.get('/accounts/status', (_req, res) => {
    res.json({ enabled: true, persistent: getAccountStore().persistent });
  });

  router.post(
    '/auth/register',
    authRateLimit,
    handle(async (req, res) => {
      const out = await register(req.body?.username, req.body?.password);
      res.status(201).json(out);
    })
  );

  router.post(
    '/auth/login',
    authRateLimit,
    handle(async (req, res) => {
      res.json(await login(req.body?.username, req.body?.password));
    })
  );

  router.post(
    '/auth/logout',
    authed(async (req, res) => {
      await logout(req.token);
      res.json({ ok: true });
    })
  );

  router.get(
    '/me',
    authed(async (req, res) => {
      res.json({ account: toAccountPublic(req.account), stats: await getStats(req.account.id) });
    })
  );

  router.put(
    '/me/photo',
    authed(async (req, res) => {
      res.json({ account: await setPhoto(req.account, req.body?.dataUrl) });
    })
  );

  router.delete(
    '/me/photo',
    authed(async (req, res) => {
      res.json({ account: await setPhoto(req.account, null) });
    })
  );

  router.get(
    '/accounts/:id',
    handle(async (req, res) => {
      const account = await getAccountStore().findById(req.params.id);
      if (!account) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Compte introuvable' } });
        return;
      }
      res.json({ account: toAccountPublic(account), stats: await getStats(account.id) });
    })
  );

  router.get(
    '/accounts/:id/photo',
    handle(async (req, res) => {
      const photo = await getAccountStore().getPhoto(req.params.id);
      if (!photo) {
        res.status(404).end();
        return;
      }
      // L'URL porte ?v=<photoVersion> : une nouvelle photo change l'URL, on peut cacher longtemps.
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.type(photo.mime).send(photo.data);
    })
  );

  return router;
}

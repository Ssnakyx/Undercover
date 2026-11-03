// Garde-fous anti-abus pour un serveur ouvert au public : limite de débit par événement
// (fenêtre glissante simple, en mémoire) et plafond de connexions simultanées par IP.
// Aucun état persistant : un redémarrage remet tous les compteurs à zéro, ce qui suffit ici.

import type { Server, Socket } from 'socket.io';
import { clientIpFromHeaders } from './clientIp.js';

export interface RateRule {
  /** Nombre d'appels autorisés dans la fenêtre. */
  max: number;
  /** Durée de la fenêtre en millisecondes. */
  windowMs: number;
  /** Compté par IP (créations de salon…) plutôt que par socket (chat…). */
  perIp?: boolean;
}

/** Limites par événement client. Les événements absents ne sont pas limités. */
export const EVENT_RULES: Readonly<Record<string, RateRule>> = {
  'room:create': { max: 6, windowMs: 60_000, perIp: true },
  'room:join': { max: 20, windowMs: 60_000, perIp: true },
  'room:joinSpectator': { max: 20, windowMs: 60_000, perIp: true },
  'room:rejoin': { max: 30, windowMs: 60_000, perIp: true },
  'chat:send': { max: 6, windowMs: 8_000 },
  'custom:addPair': { max: 15, windowMs: 10_000 },
  'settings:update': { max: 20, windowMs: 10_000 },
};

/** Garde-fou global : au-delà, plus aucun événement n'est traité pour ce socket. */
export const GLOBAL_RULE: RateRule = { max: 60, windowMs: 10_000 };

export const MAX_CONNECTIONS_PER_IP = 15;

export const RATE_LIMITED_MESSAGE = 'Doucement ! Trop d’actions en peu de temps, réessaie dans quelques secondes.';

/** Fenêtre glissante : garde les horodatages récents par clé. */
export class SlidingWindowLimiter {
  private readonly hits = new Map<string, number[]>();

  /** true si l'appel est autorisé (et le compte), false s'il dépasse la règle. */
  hit(key: string, rule: RateRule, now: number = Date.now()): boolean {
    const since = now - rule.windowMs;
    const list = (this.hits.get(key) ?? []).filter((t) => t > since);
    if (list.length >= rule.max) {
      this.hits.set(key, list);
      return false;
    }
    list.push(now);
    this.hits.set(key, list);
    return true;
  }

  /** Purge les clés dont toutes les entrées sont plus vieilles que maxWindowMs. */
  sweep(maxWindowMs: number, now: number = Date.now()): void {
    for (const [key, list] of this.hits) {
      if (list.length === 0 || list[list.length - 1] <= now - maxWindowMs) this.hits.delete(key);
    }
  }

  get size(): number {
    return this.hits.size;
  }
}

/** IP du client, voir security/clientIp.ts (en-têtes Cloudflare, jamais la 1re entrée de x-forwarded-for). */
export function clientIp(socket: Pick<Socket, 'handshake'>): string {
  return clientIpFromHeaders(socket.handshake.headers, socket.handshake.address);
}

/** Branche les limites sur le serveur Socket.io. À appeler avant registerSocketHandlers. */
export function installRateLimits(io: Server<any, any, any, any>): void {
  const limiter = new SlidingWindowLimiter();
  const connectionsByIp = new Map<string, number>();
  const maxWindow = Math.max(GLOBAL_RULE.windowMs, ...Object.values(EVENT_RULES).map((r) => r.windowMs));
  setInterval(() => limiter.sweep(maxWindow), 60_000).unref();

  io.use((socket, next) => {
    const ip = clientIp(socket);
    const count = connectionsByIp.get(ip) ?? 0;
    if (count >= MAX_CONNECTIONS_PER_IP) {
      next(new Error('TOO_MANY_CONNECTIONS'));
      return;
    }
    connectionsByIp.set(ip, count + 1);
    socket.on('disconnect', () => {
      const n = (connectionsByIp.get(ip) ?? 1) - 1;
      if (n <= 0) connectionsByIp.delete(ip);
      else connectionsByIp.set(ip, n);
    });
    next();
  });

  io.on('connection', (socket) => {
    const ip = clientIp(socket);
    socket.use((packet, next) => {
      const [event, ...args] = packet as [string, ...unknown[]];
      const rule = EVENT_RULES[event];
      const allowed =
        limiter.hit(`all:${socket.id}`, GLOBAL_RULE) &&
        (!rule || limiter.hit(`${event}:${rule.perIp ? ip : socket.id}`, rule));
      if (allowed) {
        next();
        return;
      }
      const ack = args[args.length - 1];
      const error = { code: 'RATE_LIMITED', message: RATE_LIMITED_MESSAGE };
      if (typeof ack === 'function') ack({ ok: false, error });
      else socket.emit('error', error);
    });
  });
}

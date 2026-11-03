import { describe, expect, it } from 'vitest';
import { SlidingWindowLimiter, clientIp } from '../src/security/rateLimit.js';

describe('SlidingWindowLimiter', () => {
  it('bloque au-delà du max puis relâche après la fenêtre', () => {
    const l = new SlidingWindowLimiter();
    const rule = { max: 3, windowMs: 1000 };
    expect([0, 10, 20].map((t) => l.hit('k', rule, t))).toEqual([true, true, true]);
    expect(l.hit('k', rule, 500)).toBe(false);
    expect(l.hit('autre', rule, 500)).toBe(true);
    expect(l.hit('k', rule, 1001)).toBe(true);
  });

  it('purge les clés inactives', () => {
    const l = new SlidingWindowLimiter();
    l.hit('k', { max: 1, windowMs: 1000 }, 0);
    l.sweep(1000, 5000);
    expect(l.size).toBe(0);
  });
});

describe('clientIp', () => {
  it("prend l'IP posée par Cloudflare (True-Client-IP) plutôt que x-forwarded-for", () => {
    const s = {
      handshake: { headers: { 'true-client-ip': '9.9.9.9', 'x-forwarded-for': '6.6.6.6, 9.9.9.9, 104.0.0.1' }, address: '10.0.0.1' },
    };
    expect(clientIp(s as never)).toBe('9.9.9.9');
  });
  it('ignore une première entrée x-forwarded-for inventée par le client', () => {
    const s = { handshake: { headers: { 'x-forwarded-for': '6.6.6.6, 1.2.3.4, 10.0.0.1' }, address: '10.0.0.1' } };
    expect(clientIp(s as never)).toBe('1.2.3.4');
  });
  it('accepte une seule entrée x-forwarded-for', () => {
    const s = { handshake: { headers: { 'x-forwarded-for': '1.2.3.4' }, address: '10.0.0.1' } };
    expect(clientIp(s as never)).toBe('1.2.3.4');
  });
  it("retombe sur l'adresse du socket", () => {
    const s = { handshake: { headers: {}, address: '5.6.7.8' } };
    expect(clientIp(s as never)).toBe('5.6.7.8');
  });
});

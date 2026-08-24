import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Player, Room } from '../src/types.js';
import {
  attemptRejoin,
  cancelDisconnectTimer,
  finalizeDisconnectTimeout,
  findNextHostCandidate,
  migrateHostIfNeeded,
  registerDisconnect,
} from '../src/rooms/reconnection.js';
import {
  DISCONNECT_TIMEOUT_MS,
  _resetRoomStoreForTests,
  computeAvatarSeed,
  createRoom,
  generatePlayerId,
  generateSessionToken,
} from '../src/rooms/roomStore.js';

function addPlayer(room: Room, opts: { isHost?: boolean; connected?: boolean; joinOrder: number }): Player {
  const playerId = generatePlayerId();
  const sessionToken = generateSessionToken();
  const player: Player = {
    playerId,
    sessionToken,
    name: `Player-${opts.joinOrder}`,
    isHost: opts.isHost ?? false,
    connected: opts.connected ?? true,
    alive: true,
    avatarSeed: computeAvatarSeed(playerId),
    socketId: opts.connected === false ? null : `socket-${playerId}`,
    role: null,
    champion: null,
    hasAckedReveal: false,
    joinOrder: opts.joinOrder,
    disconnectedAt: null,
    disconnectTimer: null,
  };
  room.players.set(playerId, player);
  return player;
}

describe('reconnection', () => {
  beforeEach(() => {
    _resetRoomStoreForTests();
  });

  afterEach(() => {
    _resetRoomStoreForTests();
    vi.useRealTimers();
  });

  describe('attemptRejoin', () => {
    it('rejoin valide : rebranche le socket, marque connected=true, efface disconnectedAt', () => {
      const room = createRoom();
      const player = addPlayer(room, { isHost: true, joinOrder: 0, connected: false });
      player.disconnectedAt = Date.now();

      const result = attemptRejoin(room, { playerId: player.playerId, sessionToken: player.sessionToken }, 'new-socket-id');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.player.connected).toBe(true);
        expect(result.player.socketId).toBe('new-socket-id');
        expect(result.player.disconnectedAt).toBeNull();
      }
    });

    it('rejoin refusé : room introuvable -> ROOM_NOT_FOUND', () => {
      const result = attemptRejoin(undefined, { playerId: 'x', sessionToken: 'y' }, 'socket-1');
      expect(result).toEqual({ ok: false, code: 'ROOM_NOT_FOUND', message: expect.any(String) });
    });

    it('rejoin refusé : sessionToken incorrect -> INVALID_SESSION', () => {
      const room = createRoom();
      const player = addPlayer(room, { joinOrder: 0 });
      const result = attemptRejoin(room, { playerId: player.playerId, sessionToken: 'wrong-token' }, 'socket-2');
      expect(result).toEqual({ ok: false, code: 'INVALID_SESSION', message: expect.any(String) });
    });

    it('rejoin refusé : playerId inconnu -> INVALID_SESSION', () => {
      const room = createRoom();
      addPlayer(room, { joinOrder: 0 });
      const result = attemptRejoin(room, { playerId: 'unknown-id', sessionToken: 'whatever' }, 'socket-3');
      expect(result).toEqual({ ok: false, code: 'INVALID_SESSION', message: expect.any(String) });
    });

    it('renvoie shouldResendRolePrivate=false en lobby, true si la partie est en cours', () => {
      const room = createRoom();
      const player = addPlayer(room, { joinOrder: 0 });

      room.phase = 'lobby';
      let result = attemptRejoin(room, { playerId: player.playerId, sessionToken: player.sessionToken }, 's1');
      expect(result.ok && result.shouldResendRolePrivate).toBe(false);

      for (const phase of ['reveal', 'clues', 'round_result', 'mrwhite_guess', 'game_over'] as const) {
        room.phase = phase;
        result = attemptRejoin(room, { playerId: player.playerId, sessionToken: player.sessionToken }, 's2');
        expect(result.ok && result.shouldResendRolePrivate).toBe(true);
      }
    });

    it('annule le timer de déconnexion en cours lors du rejoin', () => {
      vi.useFakeTimers();
      const room = createRoom();
      const player = addPlayer(room, { joinOrder: 0, connected: false });
      const onExpire = vi.fn();
      registerDisconnect(room, player.playerId, onExpire);

      attemptRejoin(room, { playerId: player.playerId, sessionToken: player.sessionToken }, 'new-socket');

      vi.advanceTimersByTime(DISCONNECT_TIMEOUT_MS + 1000);
      expect(onExpire).not.toHaveBeenCalled();
    });
  });

  describe('migration de host', () => {
    it('transfère le host au prochain joueur connecté par ordre d\'arrivée', () => {
      const room = createRoom();
      const host = addPlayer(room, { isHost: true, joinOrder: 0, connected: true });
      addPlayer(room, { joinOrder: 1, connected: false });
      const p2 = addPlayer(room, { joinOrder: 2, connected: true });

      host.connected = false; // simulate disconnect just occurred
      const result = migrateHostIfNeeded(room, host.playerId);

      expect(result.migrated).toBe(true);
      expect(result.newHostPlayerId).toBe(p2.playerId);
      expect(host.isHost).toBe(false);
      expect(p2.isHost).toBe(true);
    });

    it('ne migre rien si personne d\'autre n\'est connecté', () => {
      const room = createRoom();
      const host = addPlayer(room, { isHost: true, joinOrder: 0, connected: false });
      addPlayer(room, { joinOrder: 1, connected: false });

      const result = migrateHostIfNeeded(room, host.playerId);
      expect(result.migrated).toBe(false);
      expect(host.isHost).toBe(true);
    });

    it('ne fait rien si le joueur partant n\'est pas host', () => {
      const room = createRoom();
      addPlayer(room, { isHost: true, joinOrder: 0, connected: true });
      const p2 = addPlayer(room, { joinOrder: 1, connected: true });

      const result = migrateHostIfNeeded(room, p2.playerId);
      expect(result.migrated).toBe(false);
    });

    it('findNextHostCandidate respecte l\'ordre d\'arrivée parmi les connectés', () => {
      const room = createRoom();
      addPlayer(room, { joinOrder: 0, connected: false });
      const p2 = addPlayer(room, { joinOrder: 1, connected: true });
      addPlayer(room, { joinOrder: 2, connected: true });

      const next = findNextHostCandidate(room);
      expect(next?.playerId).toBe(p2.playerId);
    });
  });

  describe('finalizeDisconnectTimeout (expiration du délai de grâce de 3 minutes)', () => {
    it('en lobby : le joueur est retiré de la room', () => {
      const room = createRoom();
      room.phase = 'lobby';
      const player = addPlayer(room, { joinOrder: 0, connected: false });

      const outcome = finalizeDisconnectTimeout(room, player.playerId);

      expect(outcome.outcome).toBe('removed');
      expect(room.players.has(player.playerId)).toBe(false);
    });

    it('en partie : le joueur est marqué éliminé (alive=false), rôle conservé pour révélation', () => {
      const room = createRoom();
      room.phase = 'clues';
      const player = addPlayer(room, { joinOrder: 0, connected: false });
      player.role = 'civil';
      player.champion = 'Garen';

      const outcome = finalizeDisconnectTimeout(room, player.playerId);

      expect(outcome.outcome).toBe('eliminated');
      expect(room.players.has(player.playerId)).toBe(true);
      expect(player.alive).toBe(false);
      expect(player.role).toBe('civil'); // toujours accessible pour révélation par l'appelant
    });

    it('ne fait rien si le joueur s\'est reconnecté avant l\'expiration', () => {
      const room = createRoom();
      room.phase = 'clues';
      const player = addPlayer(room, { joinOrder: 0, connected: false });
      player.connected = true; // reconnecté entre-temps

      const outcome = finalizeDisconnectTimeout(room, player.playerId);

      expect(outcome.outcome).toBe('reconnected');
      expect(player.alive).toBe(true);
      expect(room.players.has(player.playerId)).toBe(true);
    });

    it('ne fait rien si le joueur a déjà été retiré autrement', () => {
      const room = createRoom();
      const outcome = finalizeDisconnectTimeout(room, 'ghost-player-id');
      expect(outcome.outcome).toBe('reconnected');
    });
  });

  describe('registerDisconnect + timer de grâce (fake timers)', () => {
    it('déclenche onGraceExpired après exactement DISCONNECT_TIMEOUT_MS si pas de reconnexion', () => {
      vi.useFakeTimers();
      const room = createRoom();
      const player = addPlayer(room, { joinOrder: 0, connected: true });
      const onExpire = vi.fn();

      registerDisconnect(room, player.playerId, onExpire);
      expect(player.connected).toBe(false);

      vi.advanceTimersByTime(DISCONNECT_TIMEOUT_MS - 1);
      expect(onExpire).not.toHaveBeenCalled();

      vi.advanceTimersByTime(2);
      expect(onExpire).toHaveBeenCalledTimes(1);
      expect(onExpire).toHaveBeenCalledWith(room, player.playerId);
    });

    it('cancelDisconnectTimer empêche le déclenchement', () => {
      vi.useFakeTimers();
      const room = createRoom();
      const player = addPlayer(room, { joinOrder: 0, connected: true });
      const onExpire = vi.fn();

      registerDisconnect(room, player.playerId, onExpire);
      cancelDisconnectTimer(player);

      vi.advanceTimersByTime(DISCONNECT_TIMEOUT_MS + 1000);
      expect(onExpire).not.toHaveBeenCalled();
    });
  });
});

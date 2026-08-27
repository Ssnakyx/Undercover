import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  MAX_CUSTOM_PAIRS_PER_ROOM,
  MAX_PLAYERS_PER_ROOM,
  MAX_SPECTATORS_PER_ROOM,
  _resetRoomStoreForTests,
  cancelEmptyRoomExpiration,
  computeAvatarSeed,
  countConnectedPlayers,
  createRoom,
  defaultRoomSettings,
  deleteRoom,
  generatePlayerId,
  generateSessionToken,
  generateUniqueRoomCode,
  getRoom,
  scheduleEmptyRoomExpiration,
} from '../src/rooms/roomStore.js';
import type { Player, Room } from '../src/types.js';

const ROOM_CODE_REGEX = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{5}$/;

function addPlayer(
  room: Room,
  opts: { connected?: boolean; joinOrder?: number; target?: 'players' | 'spectators' } = {}
): Player {
  const playerId = generatePlayerId();
  const sessionToken = generateSessionToken();
  const connected = opts.connected ?? true;
  const player: Player = {
    playerId,
    sessionToken,
    name: `Player-${playerId.slice(0, 4)}`,
    isHost: false,
    connected,
    alive: true,
    avatarSeed: computeAvatarSeed(playerId),
    socketId: connected ? `socket-${playerId}` : null,
    role: null,
    champion: null,
    hasAckedReveal: false,
    joinOrder: opts.joinOrder ?? 0,
    disconnectedAt: null,
    disconnectTimer: null,
    loverPlayerId: null,
    spyInsightPlayerId: null,
    protectUsedThisGame: false,
    ghostVoteAvailable: false,
    score: 0,
  };
  (opts.target === 'spectators' ? room.spectators : room.players).set(playerId, player);
  return player;
}

beforeEach(() => {
  _resetRoomStoreForTests();
});

afterEach(() => {
  _resetRoomStoreForTests();
  vi.useRealTimers();
});

describe('generateUniqueRoomCode', () => {
  it('génère un code de 5 caractères dans l\'alphabet sans 0/O/1/I', () => {
    const code = generateUniqueRoomCode();
    expect(code).toMatch(ROOM_CODE_REGEX);
  });

  it('ne génère jamais deux fois le même code parmi les rooms actives', () => {
    const codes = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const room = createRoom();
      expect(codes.has(room.roomCode)).toBe(false);
      codes.add(room.roomCode);
    }
  });
});

describe('createRoom / getRoom / deleteRoom', () => {
  it('crée une room avec un état initial conforme au contrat', () => {
    const room = createRoom('lol');
    expect(room.universe).toBe('lol');
    expect(room.phase).toBe('lobby');
    expect(room.players.size).toBe(0);
    expect(room.spectators.size).toBe(0);
    expect(room.round).toBe(0);
    expect(room.turnOrder).toEqual([]);
    expect(room.settings).toEqual(defaultRoomSettings());
  });

  it('utilise "lol" comme univers par défaut', () => {
    const room = createRoom();
    expect(room.universe).toBe('lol');
  });

  it('getRoom retrouve une room créée, insensible à la casse du code', () => {
    const room = createRoom();
    expect(getRoom(room.roomCode)).toBe(room);
    expect(getRoom(room.roomCode.toLowerCase())).toBe(room);
  });

  it('getRoom retourne undefined pour un code inconnu', () => {
    expect(getRoom('ZZZZZ')).toBeUndefined();
  });

  it('deleteRoom retire la room du store', () => {
    const room = createRoom();
    deleteRoom(room.roomCode);
    expect(getRoom(room.roomCode)).toBeUndefined();
  });

  it('deleteRoom sur un code inconnu ne lève pas d\'erreur', () => {
    expect(() => deleteRoom('NOPE1')).not.toThrow();
  });
});

describe('computeAvatarSeed', () => {
  it('est déterministe pour un même playerId', () => {
    const id = generatePlayerId();
    expect(computeAvatarSeed(id)).toBe(computeAvatarSeed(id));
  });

  it('produit une chaîne hexadécimale de 8 caractères', () => {
    expect(computeAvatarSeed('abc')).toMatch(/^[0-9a-f]{8}$/);
  });

  it('donne des seeds différents pour des ids différents (non garanti à 100% mais attendu ici)', () => {
    expect(computeAvatarSeed('playerA')).not.toBe(computeAvatarSeed('playerB'));
  });
});

describe('countConnectedPlayers', () => {
  it('compte les joueurs connectés et exclut les déconnectés', () => {
    const room = createRoom();
    addPlayer(room, { connected: true });
    addPlayer(room, { connected: false });
    expect(countConnectedPlayers(room)).toBe(1);
  });

  it('un spectateur connecté seul compte aussi (empêche l\'expiration de room vide)', () => {
    const room = createRoom();
    addPlayer(room, { connected: true, target: 'spectators' });
    expect(countConnectedPlayers(room)).toBe(1);
  });

  it('retourne 0 pour une room vide', () => {
    const room = createRoom();
    expect(countConnectedPlayers(room)).toBe(0);
  });
});

describe('scheduleEmptyRoomExpiration / cancelEmptyRoomExpiration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('appelle onExpire après 5 minutes si la room est toujours vide', () => {
    const room = createRoom();
    const onExpire = vi.fn();
    scheduleEmptyRoomExpiration(room, onExpire);
    vi.advanceTimersByTime(5 * 60 * 1000);
    expect(onExpire).toHaveBeenCalledWith(room.roomCode);
  });

  it("n'appelle pas onExpire si un joueur est connecté avant l'échéance", () => {
    const room = createRoom();
    addPlayer(room, { connected: true });
    const onExpire = vi.fn();
    scheduleEmptyRoomExpiration(room, onExpire);
    vi.advanceTimersByTime(5 * 60 * 1000);
    expect(onExpire).not.toHaveBeenCalled();
  });

  it('cancelEmptyRoomExpiration empêche le déclenchement', () => {
    const room = createRoom();
    const onExpire = vi.fn();
    scheduleEmptyRoomExpiration(room, onExpire);
    cancelEmptyRoomExpiration(room);
    vi.advanceTimersByTime(10 * 60 * 1000);
    expect(onExpire).not.toHaveBeenCalled();
    expect(room.emptyRoomTimer).toBeNull();
  });

  it('un second appel à scheduleEmptyRoomExpiration relance le délai complet', () => {
    const room = createRoom();
    const onExpire = vi.fn();
    scheduleEmptyRoomExpiration(room, onExpire);
    vi.advanceTimersByTime(4 * 60 * 1000);
    scheduleEmptyRoomExpiration(room, onExpire); // relance le délai de 5 minutes
    vi.advanceTimersByTime(4 * 60 * 1000);
    expect(onExpire).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1 * 60 * 1000 + 1);
    expect(onExpire).toHaveBeenCalledTimes(1);
  });
});

describe('constantes de contrat', () => {
  it('expose les limites attendues par docs/CONTRACT.md', () => {
    expect(MAX_PLAYERS_PER_ROOM).toBe(12);
    expect(MAX_SPECTATORS_PER_ROOM).toBe(20);
    expect(MAX_CUSTOM_PAIRS_PER_ROOM).toBe(30);
  });
});

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Player, Room } from '../src/types.js';
import * as engine from '../src/game/engine.js';
import {
  _resetRoomStoreForTests,
  computeAvatarSeed,
  createRoom,
  generatePlayerId,
  generateSessionToken,
} from '../src/rooms/roomStore.js';

function addPlayer(
  room: Room,
  opts: { joinOrder: number; role?: Player['role']; alive?: boolean }
): Player {
  const playerId = generatePlayerId();
  const player: Player = {
    playerId,
    sessionToken: generateSessionToken(),
    name: `Player-${opts.joinOrder}`,
    isHost: opts.joinOrder === 0,
    connected: true,
    alive: opts.alive ?? true,
    avatarSeed: computeAvatarSeed(playerId),
    socketId: `socket-${playerId}`,
    role: opts.role ?? 'civil',
    champion: opts.role === 'mrwhite' ? null : 'Garen',
    hasAckedReveal: true,
    joinOrder: opts.joinOrder,
    disconnectedAt: null,
    disconnectTimer: null,
  };
  room.players.set(playerId, player);
  return player;
}

describe('removeFromClueTurnOrder — retrait d\'un joueur en cours de round "clues"', () => {
  let room: Room;
  let p0: Player, p1: Player, p2: Player, p3: Player;

  beforeEach(() => {
    _resetRoomStoreForTests();
    room = createRoom();
    p0 = addPlayer(room, { joinOrder: 0 });
    p1 = addPlayer(room, { joinOrder: 1 });
    p2 = addPlayer(room, { joinOrder: 2 });
    p3 = addPlayer(room, { joinOrder: 3 });
    room.phase = 'clues';
    room.turnOrder = [p0.playerId, p1.playerId, p2.playerId, p3.playerId];
    room.currentTurnIndex = 2; // c'est le tour de p2
    room.settings.clueTimeSeconds = 45;
  });

  afterEach(() => {
    _resetRoomStoreForTests();
  });

  it('retrait d\'un joueur AVANT le tour courant : décrémente currentTurnIndex, ne change pas le joueur courant', () => {
    const before = engine.currentTurnPlayerId(room); // p2
    const result = engine.removeFromClueTurnOrder(room, p0.playerId); // idx 0 < currentTurnIndex 2

    expect(result.wasCurrentTurn).toBe(false);
    expect(result.enteredVoting).toBe(false);
    expect(room.turnOrder).toEqual([p1.playerId, p2.playerId, p3.playerId]);
    expect(room.currentTurnIndex).toBe(1); // décrémenté pour continuer à pointer sur p2
    expect(engine.currentTurnPlayerId(room)).toBe(before);
    expect(engine.currentTurnPlayerId(room)).toBe(p2.playerId);
  });

  it('retrait d\'un joueur APRÈS le tour courant : ne change pas currentTurnIndex ni le joueur courant', () => {
    const result = engine.removeFromClueTurnOrder(room, p3.playerId); // idx 3 > currentTurnIndex 2

    expect(result.wasCurrentTurn).toBe(false);
    expect(result.enteredVoting).toBe(false);
    expect(room.turnOrder).toEqual([p0.playerId, p1.playerId, p2.playerId]);
    expect(room.currentTurnIndex).toBe(2);
    expect(engine.currentTurnPlayerId(room)).toBe(p2.playerId);
  });

  it('retrait du joueur DONT C\'EST LE TOUR, avec un joueur suivant : passe au suivant, reprogramme un deadline', () => {
    const deadlineBefore = room.phaseDeadline;
    const result = engine.removeFromClueTurnOrder(room, p2.playerId); // idx === currentTurnIndex

    expect(result.wasCurrentTurn).toBe(true);
    expect(result.enteredVoting).toBe(false);
    expect(room.turnOrder).toEqual([p0.playerId, p1.playerId, p3.playerId]);
    expect(room.currentTurnIndex).toBe(2); // pointe maintenant sur p3 (ancien index 3, décalé à 2)
    expect(engine.currentTurnPlayerId(room)).toBe(p3.playerId);
    expect(room.phaseDeadline).not.toBe(deadlineBefore);
    expect(room.phaseDeadline).toBeGreaterThan(Date.now());
    expect(room.phase).toBe('clues');
  });

  it('retrait du joueur DONT C\'EST LE TOUR, dernier de l\'ordre : fait passer la phase à voting', () => {
    room.currentTurnIndex = 3; // tour de p3, le dernier
    const result = engine.removeFromClueTurnOrder(room, p3.playerId);

    expect(result.wasCurrentTurn).toBe(true);
    expect(result.enteredVoting).toBe(true);
    expect(room.phase).toBe('voting');
    expect(room.turnOrder).toEqual([p0.playerId, p1.playerId, p2.playerId]);
    expect(room.votes).toEqual([]);
    expect(room.phaseDeadline).toBeGreaterThan(Date.now());
  });

  it('joueur déjà absent de turnOrder : no-op', () => {
    const before = { ...room, turnOrder: [...room.turnOrder] };
    const result = engine.removeFromClueTurnOrder(room, 'unknown-id');

    expect(result.wasCurrentTurn).toBe(false);
    expect(result.enteredVoting).toBe(false);
    expect(room.turnOrder).toEqual(before.turnOrder);
    expect(room.currentTurnIndex).toBe(before.currentTurnIndex);
  });

  it('hors phase clues : no-op (ex: phase voting)', () => {
    room.phase = 'voting';
    const result = engine.removeFromClueTurnOrder(room, p1.playerId);
    expect(result).toEqual({ enteredVoting: false, wasCurrentTurn: false });
  });
});

describe('evaluateCurrentWinner (intégration avec countAliveRoles)', () => {
  let room: Room;

  beforeEach(() => {
    _resetRoomStoreForTests();
    room = createRoom();
  });

  afterEach(() => {
    _resetRoomStoreForTests();
  });

  it('civils gagnent quand plus aucun undercover/mrwhite vivant', () => {
    addPlayer(room, { joinOrder: 0, role: 'civil', alive: true });
    addPlayer(room, { joinOrder: 1, role: 'civil', alive: true });
    addPlayer(room, { joinOrder: 2, role: 'undercover', alive: false });
    expect(engine.evaluateCurrentWinner(room)).toBe('civils');
  });

  it('undercover gagnent quand ils égalisent les civils', () => {
    addPlayer(room, { joinOrder: 0, role: 'civil', alive: true });
    addPlayer(room, { joinOrder: 1, role: 'undercover', alive: true });
    addPlayer(room, { joinOrder: 2, role: 'undercover', alive: false });
    expect(engine.evaluateCurrentWinner(room)).toBe('undercover');
  });

  it('partie continue si aucune condition n\'est remplie', () => {
    addPlayer(room, { joinOrder: 0, role: 'civil', alive: true });
    addPlayer(room, { joinOrder: 1, role: 'civil', alive: true });
    addPlayer(room, { joinOrder: 2, role: 'civil', alive: true });
    addPlayer(room, { joinOrder: 3, role: 'undercover', alive: true });
    expect(engine.evaluateCurrentWinner(room)).toBeNull();
  });
});

describe('resolveMrWhiteTimeout', () => {
  let room: Room;

  beforeEach(() => {
    _resetRoomStoreForTests();
    room = createRoom();
  });

  afterEach(() => {
    _resetRoomStoreForTests();
  });

  it('repasse en round_result et calcule le vainqueur si les conditions sont remplies', () => {
    addPlayer(room, { joinOrder: 0, role: 'civil', alive: true });
    addPlayer(room, { joinOrder: 1, role: 'civil', alive: true });
    const mrWhite = addPlayer(room, { joinOrder: 2, role: 'mrwhite', alive: false });
    room.phase = 'mrwhite_guess';
    room.mrWhiteGuessPlayerId = mrWhite.playerId;
    room.championA = 'Garen';

    const result = engine.resolveMrWhiteTimeout(room);

    expect(result.correct).toBe(false);
    expect(result.winner).toBe('civils'); // undercoverAlive=0, mrWhiteAlive=0 (déjà mort)
    expect(room.phase).toBe('round_result');
    expect(room.mrWhiteGuessPlayerId).toBeNull();
  });
});

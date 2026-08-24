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

describe('removeFromTurnOrder — retrait cosmétique de l\'ordre affiché en phase "discussion"', () => {
  let room: Room;
  let p0: Player, p1: Player, p2: Player;

  beforeEach(() => {
    _resetRoomStoreForTests();
    room = createRoom();
    p0 = addPlayer(room, { joinOrder: 0 });
    p1 = addPlayer(room, { joinOrder: 1 });
    p2 = addPlayer(room, { joinOrder: 2 });
    room.phase = 'discussion';
    room.turnOrder = [p0.playerId, p1.playerId, p2.playerId];
  });

  afterEach(() => {
    _resetRoomStoreForTests();
  });

  it('retire le joueur de turnOrder, conserve l\'ordre relatif des autres', () => {
    engine.removeFromTurnOrder(room, p1.playerId);
    expect(room.turnOrder).toEqual([p0.playerId, p2.playerId]);
  });

  it('joueur déjà absent : no-op', () => {
    engine.removeFromTurnOrder(room, 'unknown-id');
    expect(room.turnOrder).toEqual([p0.playerId, p1.playerId, p2.playerId]);
  });
});

function expectEngineErrorCode(fn: () => unknown, code: string): void {
  let caught: unknown;
  try {
    fn();
  } catch (err) {
    caught = err;
  }
  expect(caught).toBeInstanceOf(engine.GameEngineError);
  expect((caught as engine.GameEngineError).code).toBe(code);
}

describe('startVoting', () => {
  let room: Room;

  beforeEach(() => {
    _resetRoomStoreForTests();
    room = createRoom();
    room.phase = 'discussion';
  });

  afterEach(() => {
    _resetRoomStoreForTests();
  });

  it('passe la phase à voting, vide les votes, pas de minuteur', () => {
    engine.startVoting(room);
    expect(room.phase).toBe('voting');
    expect(room.votes).toEqual([]);
    expect(room.phaseDeadline).toBeNull();
  });

  it('refuse hors phase discussion', () => {
    room.phase = 'round_result';
    expectEngineErrorCode(() => engine.startVoting(room), 'INVALID_PHASE');
  });
});

describe('submitVote / tallyVotesAndEliminate — vote de groupe (remplace l\'élimination host-only)', () => {
  let room: Room;
  // p0 = host, 3 civils (p0, p2, p3) + 1 undercover (p1) : assez de civils pour qu'une
  // élimination de civil ne déclenche pas de victoire immédiate (voir conditions §4).
  let p0: Player, p1: Player, p2: Player, p3: Player;

  beforeEach(() => {
    _resetRoomStoreForTests();
    room = createRoom();
    p0 = addPlayer(room, { joinOrder: 0, role: 'civil' });
    p1 = addPlayer(room, { joinOrder: 1, role: 'undercover' });
    p2 = addPlayer(room, { joinOrder: 2, role: 'civil' });
    p3 = addPlayer(room, { joinOrder: 3, role: 'civil' });
    room.phase = 'voting';
    room.championA = 'Garen';
  });

  afterEach(() => {
    _resetRoomStoreForTests();
  });

  it('refuse hors phase voting', () => {
    room.phase = 'discussion';
    expectEngineErrorCode(() => engine.submitVote(room, p0.playerId, p1.playerId), 'INVALID_PHASE');
  });

  it('refuse le vote pour soi-même', () => {
    expectEngineErrorCode(() => engine.submitVote(room, p0.playerId, p0.playerId), 'VOTE_SELF_FORBIDDEN');
  });

  it('refuse une cible invalide ou déjà éliminée', () => {
    expectEngineErrorCode(() => engine.submitVote(room, p0.playerId, 'unknown-id'), 'INVALID_VOTE_TARGET');
    p2.alive = false;
    expectEngineErrorCode(() => engine.submitVote(room, p0.playerId, p2.playerId), 'INVALID_VOTE_TARGET');
  });

  it('refuse un second vote du même joueur', () => {
    engine.submitVote(room, p0.playerId, p1.playerId);
    expectEngineErrorCode(() => engine.submitVote(room, p0.playerId, p2.playerId), 'ALREADY_VOTED');
  });

  it('haveAllAlivePlayersVoted reflète l\'état courant', () => {
    expect(engine.haveAllAlivePlayersVoted(room)).toBe(false);
    engine.submitVote(room, p0.playerId, p1.playerId);
    engine.submitVote(room, p1.playerId, p0.playerId);
    engine.submitVote(room, p2.playerId, p1.playerId);
    expect(engine.haveAllAlivePlayersVoted(room)).toBe(false);
    engine.submitVote(room, p3.playerId, p1.playerId);
    expect(engine.haveAllAlivePlayersVoted(room)).toBe(true);
  });

  it('élimine le joueur majoritaire, révèle son rôle, sans vainqueur si la partie continue', () => {
    engine.submitVote(room, p0.playerId, p3.playerId);
    engine.submitVote(room, p1.playerId, p3.playerId);
    engine.submitVote(room, p2.playerId, p3.playerId);
    engine.submitVote(room, p3.playerId, p0.playerId);

    const { result, winner, enterMrWhiteGuess } = engine.tallyVotesAndEliminate(room);

    expect(p3.alive).toBe(false);
    expect(result.eliminatedPlayerId).toBe(p3.playerId);
    expect(result.eliminatedRole).toBe('civil');
    expect(result.tie).toBe(false);
    expect(room.phase).toBe('round_result');
    expect(winner).toBeNull();
    expect(enterMrWhiteGuess).toBe(false);
  });

  it('égalité au sommet : personne n\'est éliminé', () => {
    engine.submitVote(room, p0.playerId, p2.playerId);
    engine.submitVote(room, p1.playerId, p3.playerId);
    engine.submitVote(room, p2.playerId, p3.playerId);
    engine.submitVote(room, p3.playerId, p2.playerId);

    const { result, winner } = engine.tallyVotesAndEliminate(room);

    expect(result.eliminatedPlayerId).toBeNull();
    expect(result.tie).toBe(true);
    expect(p2.alive).toBe(true);
    expect(p3.alive).toBe(true);
    expect(winner).toBeNull();
  });

  it('déclenche mrwhite_guess si l\'éliminé est Mr White', () => {
    const mrWhite = addPlayer(room, { joinOrder: 4, role: 'mrwhite' });
    engine.submitVote(room, p0.playerId, mrWhite.playerId);
    engine.submitVote(room, p1.playerId, mrWhite.playerId);
    engine.submitVote(room, p2.playerId, mrWhite.playerId);
    engine.submitVote(room, p3.playerId, mrWhite.playerId);
    engine.submitVote(room, mrWhite.playerId, p0.playerId);

    const { winner, enterMrWhiteGuess } = engine.tallyVotesAndEliminate(room);

    expect(enterMrWhiteGuess).toBe(true);
    expect(winner).toBeNull();
    expect(room.mrWhiteGuessPlayerId).toBe(mrWhite.playerId);
  });

  it('déclenche la victoire des civils si undercover et mrwhite sont tous éliminés', () => {
    engine.submitVote(room, p0.playerId, p1.playerId);
    engine.submitVote(room, p2.playerId, p1.playerId);
    engine.submitVote(room, p3.playerId, p1.playerId);

    const { winner } = engine.tallyVotesAndEliminate(room);
    expect(winner).toBe('civils');
  });

  it('ne révèle pas le champion si revealChampionOnElimination est désactivé (défaut)', () => {
    engine.submitVote(room, p0.playerId, p1.playerId);
    engine.submitVote(room, p2.playerId, p1.playerId);
    engine.submitVote(room, p3.playerId, p1.playerId);
    const { result } = engine.tallyVotesAndEliminate(room);
    expect(result.eliminatedChampion).toBeNull();
  });

  it('révèle le champion si revealChampionOnElimination est activé', () => {
    room.settings.revealChampionOnElimination = true;
    engine.submitVote(room, p0.playerId, p1.playerId);
    engine.submitVote(room, p2.playerId, p1.playerId);
    engine.submitVote(room, p3.playerId, p1.playerId);
    const { result } = engine.tallyVotesAndEliminate(room);
    expect(result.eliminatedChampion).toBe('Garen');
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

describe('abortGame — départ volontaire de l\'hôte en cours de partie', () => {
  let room: Room;

  beforeEach(() => {
    _resetRoomStoreForTests();
    room = createRoom();
  });

  afterEach(() => {
    _resetRoomStoreForTests();
  });

  it('passe la room en phase "aborted" et efface l\'état de phase transitoire', () => {
    room.phase = 'voting';
    room.phaseDeadline = Date.now() + 30_000;
    room.mrWhiteGuessPlayerId = 'someone';

    engine.abortGame(room);

    expect(room.phase).toBe('aborted');
    expect(room.phaseDeadline).toBeNull();
    expect(room.mrWhiteGuessPlayerId).toBeNull();
  });

  it('fonctionne depuis n\'importe quelle phase de partie en cours (ex: reveal, mrwhite_guess)', () => {
    room.phase = 'reveal';
    engine.abortGame(room);
    expect(room.phase).toBe('aborted');

    room.phase = 'mrwhite_guess';
    engine.abortGame(room);
    expect(room.phase).toBe('aborted');
  });
});

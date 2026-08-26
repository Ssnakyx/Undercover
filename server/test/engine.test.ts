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
  opts: {
    joinOrder: number;
    role?: Player['role'];
    alive?: boolean;
    loverPlayerId?: string | null;
    ghostVoteAvailable?: boolean;
    protectUsedThisGame?: boolean;
    score?: number;
  }
): Player {
  const playerId = generatePlayerId();
  const noChampionRoles: Player['role'][] = ['mrwhite', 'jester'];
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
    champion: noChampionRoles.includes(opts.role ?? 'civil') ? null : 'Garen',
    hasAckedReveal: true,
    joinOrder: opts.joinOrder,
    disconnectedAt: null,
    disconnectTimer: null,
    loverPlayerId: opts.loverPlayerId ?? null,
    spyInsightPlayerId: null,
    protectUsedThisGame: opts.protectUsedThisGame ?? false,
    ghostVoteAvailable: opts.ghostVoteAvailable ?? false,
    score: opts.score ?? 0,
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

describe('Chasseur — hunter_shoot (calqué sur mrwhite_guess)', () => {
  let room: Room;
  let p0: Player, p1: Player, p2: Player, p3: Player, hunter: Player;

  beforeEach(() => {
    _resetRoomStoreForTests();
    room = createRoom();
    p0 = addPlayer(room, { joinOrder: 0, role: 'civil' });
    p1 = addPlayer(room, { joinOrder: 1, role: 'civil' });
    p2 = addPlayer(room, { joinOrder: 2, role: 'civil' });
    p3 = addPlayer(room, { joinOrder: 3, role: 'undercover' });
    hunter = addPlayer(room, { joinOrder: 4, role: 'hunter' });
    room.phase = 'voting';
    room.championA = 'Garen';
  });

  afterEach(() => {
    _resetRoomStoreForTests();
  });

  it('déclenche enterHunterShoot si l\'éliminé est le Chasseur', () => {
    engine.submitVote(room, p0.playerId, hunter.playerId);
    engine.submitVote(room, p1.playerId, hunter.playerId);
    engine.submitVote(room, p2.playerId, hunter.playerId);
    engine.submitVote(room, p3.playerId, hunter.playerId);
    engine.submitVote(room, hunter.playerId, p0.playerId);

    const { enterHunterShoot, enterMrWhiteGuess, winner } = engine.tallyVotesAndEliminate(room);

    expect(enterHunterShoot).toBe(true);
    expect(enterMrWhiteGuess).toBe(false);
    expect(winner).toBeNull();
    expect(room.hunterShootPlayerId).toBe(hunter.playerId);
    expect(hunter.alive).toBe(false);
  });

  it('submitHunterShot avec une cible : élimine la cible et réévalue les conditions de victoire', () => {
    room.hunterShootPlayerId = hunter.playerId;
    room.phase = 'hunter_shoot';
    hunter.alive = false;

    const { winner } = engine.submitHunterShot(room, hunter.playerId, p3.playerId);

    expect(p3.alive).toBe(false);
    expect(room.lastRoundResult?.eliminatedPlayerId).toBe(p3.playerId);
    expect(room.lastRoundResult?.hunterDeclined).toBe(false);
    expect(room.phase).toBe('round_result');
    expect(room.hunterShootPlayerId).toBeNull();
    expect(winner).toBe('civils'); // seul undercover éliminé, plus de mrwhite
  });

  it('submitHunterShot avec null (passe) : personne n\'est éliminé, hunterDeclined=true', () => {
    room.hunterShootPlayerId = hunter.playerId;
    room.phase = 'hunter_shoot';
    hunter.alive = false;

    const { winner } = engine.submitHunterShot(room, hunter.playerId, null);

    expect(room.lastRoundResult?.eliminatedPlayerId).toBeNull();
    expect(room.lastRoundResult?.hunterDeclined).toBe(true);
    expect(p3.alive).toBe(true);
    expect(winner).toBeNull();
  });

  it('refuse un tir d\'un autre joueur que le Chasseur désigné', () => {
    room.hunterShootPlayerId = hunter.playerId;
    room.phase = 'hunter_shoot';
    expectEngineErrorCode(() => engine.submitHunterShot(room, p0.playerId, p3.playerId), 'NOT_HUNTER_SHOOTER');
  });

  it('refuse une cible déjà éliminée', () => {
    room.hunterShootPlayerId = hunter.playerId;
    room.phase = 'hunter_shoot';
    p3.alive = false;
    expectEngineErrorCode(() => engine.submitHunterShot(room, hunter.playerId, p3.playerId), 'INVALID_HUNTER_TARGET');
  });

  it('resolveHunterShotTimeout équivaut à passer', () => {
    room.hunterShootPlayerId = hunter.playerId;
    room.phase = 'hunter_shoot';
    hunter.alive = false;

    engine.resolveHunterShotTimeout(room);

    expect(room.lastRoundResult?.hunterDeclined).toBe(true);
    expect(room.phase).toBe('round_result');
  });
});

describe('Protecteur — submitProtectorProtect / annulation d\'élimination', () => {
  let room: Room;
  let p0: Player, p1: Player, p2: Player, protector: Player;

  beforeEach(() => {
    _resetRoomStoreForTests();
    room = createRoom();
    p0 = addPlayer(room, { joinOrder: 0, role: 'civil' });
    p1 = addPlayer(room, { joinOrder: 1, role: 'civil' });
    p2 = addPlayer(room, { joinOrder: 2, role: 'undercover' });
    protector = addPlayer(room, { joinOrder: 3, role: 'protector' });
    room.phase = 'voting';
    room.championA = 'Garen';
  });

  afterEach(() => {
    _resetRoomStoreForTests();
  });

  it('annule l\'élimination si la cible protégée correspond à la pluralité du vote', () => {
    engine.submitProtectorProtect(room, protector.playerId, p0.playerId);
    engine.submitVote(room, p1.playerId, p0.playerId);
    engine.submitVote(room, p2.playerId, p0.playerId);
    engine.submitVote(room, protector.playerId, p1.playerId);

    const { result, winner } = engine.tallyVotesAndEliminate(room);

    expect(result.eliminatedPlayerId).toBeNull();
    expect(result.protectedThisRound).toBe(true);
    expect(result.tie).toBe(false);
    expect(p0.alive).toBe(true);
    expect(winner).toBeNull();
  });

  it('capacité à usage unique : consommée à la soumission même si elle ne "sert" pas ce round', () => {
    engine.submitProtectorProtect(room, protector.playerId, p1.playerId); // protège p1, mais p0 sera voté
    expect(protector.protectUsedThisGame).toBe(true);

    expectEngineErrorCode(
      () => engine.submitProtectorProtect(room, protector.playerId, p0.playerId),
      'PROTECT_ALREADY_USED'
    );
  });

  it('refuse l\'auto-protection', () => {
    expectEngineErrorCode(
      () => engine.submitProtectorProtect(room, protector.playerId, protector.playerId),
      'PROTECT_SELF_FORBIDDEN'
    );
  });

  it('reset à chaque nouvelle phase de vote (protectorPendingTargetId)', () => {
    engine.submitProtectorProtect(room, protector.playerId, p0.playerId);
    expect(room.protectorPendingTargetId).toBe(p0.playerId);
    room.phase = 'discussion';
    engine.startVoting(room);
    expect(room.protectorPendingTargetId).toBeNull();
  });
});

describe('Revenant — vote bonus un round après élimination par vote direct', () => {
  let room: Room;
  let p0: Player, p1: Player, p2: Player, ghost: Player;

  beforeEach(() => {
    _resetRoomStoreForTests();
    room = createRoom();
    p0 = addPlayer(room, { joinOrder: 0, role: 'civil' });
    p1 = addPlayer(room, { joinOrder: 1, role: 'civil' });
    p2 = addPlayer(room, { joinOrder: 2, role: 'undercover' });
    ghost = addPlayer(room, { joinOrder: 3, role: 'ghost' });
    room.phase = 'voting';
    room.championA = 'Garen';
  });

  afterEach(() => {
    _resetRoomStoreForTests();
  });

  it('gagne ghostVoteAvailable après une élimination par vote direct', () => {
    engine.submitVote(room, p0.playerId, ghost.playerId);
    engine.submitVote(room, p1.playerId, ghost.playerId);
    engine.submitVote(room, p2.playerId, ghost.playerId);
    engine.submitVote(room, ghost.playerId, p0.playerId);

    engine.tallyVotesAndEliminate(room);

    expect(ghost.alive).toBe(false);
    expect(ghost.ghostVoteAvailable).toBe(true);
  });

  it('peut voter au round suivant malgré alive=false, compte pour la complétude du vote', () => {
    ghost.alive = false;
    ghost.ghostVoteAvailable = true;

    expect(engine.haveAllAlivePlayersVoted(room)).toBe(false);
    engine.submitVote(room, p0.playerId, p1.playerId);
    engine.submitVote(room, p1.playerId, p0.playerId);
    engine.submitVote(room, p2.playerId, p0.playerId);
    expect(engine.haveAllAlivePlayersVoted(room)).toBe(false); // le Revenant n'a pas encore voté
    engine.submitVote(room, ghost.playerId, p0.playerId);
    expect(engine.haveAllAlivePlayersVoted(room)).toBe(true);
  });

  it('la cible du vote doit rester un joueur vivant (même pour un Revenant)', () => {
    ghost.alive = false;
    ghost.ghostVoteAvailable = true;
    expectEngineErrorCode(() => engine.submitVote(room, p0.playerId, ghost.playerId), 'INVALID_VOTE_TARGET');
  });

  it('ne bénéficie PAS du vote bonus si éliminé par départ (hors flux de vote direct)', () => {
    // Simule le comportement attendu de applyMidGameDeparture (handlers.ts) : un départ ne pose
    // jamais ghostVoteAvailable, contrairement à tallyVotesAndEliminate.
    ghost.alive = false;
    expect(ghost.ghostVoteAvailable).toBe(false);
  });
});

describe('Amoureux — mort de chagrin en chaîne, uniquement sur élimination par vote direct', () => {
  let room: Room;
  let loverA: Player, loverB: Player, p2: Player, p3: Player;

  beforeEach(() => {
    _resetRoomStoreForTests();
    room = createRoom();
    loverA = addPlayer(room, { joinOrder: 0, role: 'civil' });
    loverB = addPlayer(room, { joinOrder: 1, role: 'civil' });
    loverA.loverPlayerId = loverB.playerId;
    loverB.loverPlayerId = loverA.playerId;
    p2 = addPlayer(room, { joinOrder: 2, role: 'civil' });
    p3 = addPlayer(room, { joinOrder: 3, role: 'undercover' });
    room.phase = 'voting';
    room.championA = 'Garen';
  });

  afterEach(() => {
    _resetRoomStoreForTests();
  });

  it('le partenaire meurt aussi le même round si l\'autre est éliminé par vote direct', () => {
    engine.submitVote(room, p2.playerId, loverA.playerId);
    engine.submitVote(room, p3.playerId, loverA.playerId);
    engine.submitVote(room, loverB.playerId, loverA.playerId);
    engine.submitVote(room, loverA.playerId, p2.playerId);

    const { result } = engine.tallyVotesAndEliminate(room);

    expect(loverA.alive).toBe(false);
    expect(loverB.alive).toBe(false);
    expect(result.eliminatedPlayerId).toBe(loverA.playerId);
    expect(result.chainEliminatedPlayerId).toBe(loverB.playerId);
  });

  it('pas de chaîne au-delà : le partenaire déjà mort n\'entraîne aucune autre chaîne', () => {
    loverB.alive = false; // déjà mort avant ce round (ex: round précédent)
    engine.submitVote(room, p2.playerId, loverA.playerId);
    engine.submitVote(room, p3.playerId, loverA.playerId);
    engine.submitVote(room, loverA.playerId, p2.playerId);

    const { result } = engine.tallyVotesAndEliminate(room);

    expect(result.eliminatedPlayerId).toBe(loverA.playerId);
    expect(result.chainEliminatedPlayerId).toBeNull();
  });
});

describe('Bouffon — victoire immédiate sur élimination par vote direct uniquement', () => {
  let room: Room;
  let p0: Player, p1: Player, p2: Player, jester: Player;

  beforeEach(() => {
    _resetRoomStoreForTests();
    room = createRoom();
    p0 = addPlayer(room, { joinOrder: 0, role: 'civil' });
    p1 = addPlayer(room, { joinOrder: 1, role: 'civil' });
    p2 = addPlayer(room, { joinOrder: 2, role: 'undercover' });
    jester = addPlayer(room, { joinOrder: 3, role: 'jester' });
    room.phase = 'voting';
    room.championA = 'Garen';
  });

  afterEach(() => {
    _resetRoomStoreForTests();
  });

  it('gagne immédiatement s\'il est éliminé par la pluralité du vote', () => {
    engine.submitVote(room, p0.playerId, jester.playerId);
    engine.submitVote(room, p1.playerId, jester.playerId);
    engine.submitVote(room, p2.playerId, jester.playerId);
    engine.submitVote(room, jester.playerId, p0.playerId);

    const { winner, enterMrWhiteGuess, enterHunterShoot } = engine.tallyVotesAndEliminate(room);

    expect(winner).toBe('jester');
    expect(enterMrWhiteGuess).toBe(false);
    expect(enterHunterShoot).toBe(false);
    expect(room.phase).toBe('round_result');
  });

  it('ne gagne PAS s\'il meurt en chaîne (Amoureux) plutôt que par vote direct', () => {
    const lover = addPlayer(room, { joinOrder: 4, role: 'civil' });
    jester.loverPlayerId = lover.playerId;
    lover.loverPlayerId = jester.playerId;

    engine.submitVote(room, p0.playerId, lover.playerId);
    engine.submitVote(room, p1.playerId, lover.playerId);
    engine.submitVote(room, p2.playerId, lover.playerId);
    engine.submitVote(room, jester.playerId, p0.playerId);

    const { result, winner } = engine.tallyVotesAndEliminate(room);

    expect(result.eliminatedPlayerId).toBe(lover.playerId);
    expect(result.chainEliminatedPlayerId).toBe(jester.playerId);
    expect(jester.alive).toBe(false);
    expect(winner).toBeNull(); // undercover encore vivant : partie continue, pas de victoire Bouffon
  });

  it('n\'est jamais compté comme civil ni undercover dans countAliveRoles', () => {
    const counts = engine.countAliveRoles(room);
    expect(counts.jesterAlive).toBe(1);
    expect(counts.civilsAlive).toBe(2); // p0, p1
    expect(counts.undercoverAlive).toBe(1); // p2
  });
});

describe('awardScoreForWinner — score cumulé "mode Soirée" (CONTRACT.md §5ter)', () => {
  let room: Room;

  beforeEach(() => {
    _resetRoomStoreForTests();
    room = createRoom();
  });

  it('victoire des civils : +1 à civil/spy/protector/ghost/hunter, rien aux undercover/mrwhite/jester', () => {
    const civil = addPlayer(room, { joinOrder: 0, role: 'civil', score: 3 });
    const hunter = addPlayer(room, { joinOrder: 1, role: 'hunter' });
    const undercover = addPlayer(room, { joinOrder: 2, role: 'undercover' });
    const mrwhite = addPlayer(room, { joinOrder: 3, role: 'mrwhite' });
    const jester = addPlayer(room, { joinOrder: 4, role: 'jester' });

    engine.awardScoreForWinner(room, 'civils');

    expect(civil.score).toBe(4);
    expect(hunter.score).toBe(1);
    expect(undercover.score).toBe(0);
    expect(mrwhite.score).toBe(0);
    expect(jester.score).toBe(0);
  });

  it('victoire undercover : seuls les undercover marquent, même déjà éliminés', () => {
    const civil = addPlayer(room, { joinOrder: 0, role: 'civil' });
    const undercoverAlive = addPlayer(room, { joinOrder: 1, role: 'undercover' });
    const undercoverDead = addPlayer(room, { joinOrder: 2, role: 'undercover', alive: false });

    engine.awardScoreForWinner(room, 'undercover');

    expect(civil.score).toBe(0);
    expect(undercoverAlive.score).toBe(1);
    expect(undercoverDead.score).toBe(1); // camp vainqueur = tous les undercover de la partie, vivants ou non
  });

  it('victoire du Bouffon : seul le Bouffon marque', () => {
    const civil = addPlayer(room, { joinOrder: 0, role: 'civil' });
    const undercover = addPlayer(room, { joinOrder: 1, role: 'undercover' });
    const jester = addPlayer(room, { joinOrder: 2, role: 'jester', alive: false });

    engine.awardScoreForWinner(room, 'jester');

    expect(civil.score).toBe(0);
    expect(undercover.score).toBe(0);
    expect(jester.score).toBe(1);
  });

  it('victoire Mr White : seul Mr White marque', () => {
    const civil = addPlayer(room, { joinOrder: 0, role: 'civil' });
    const mrwhite = addPlayer(room, { joinOrder: 1, role: 'mrwhite', alive: false });

    engine.awardScoreForWinner(room, 'mrwhite');

    expect(civil.score).toBe(0);
    expect(mrwhite.score).toBe(1);
  });
});

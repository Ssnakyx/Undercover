// Handlers de tous les événements socket listés en CONTRACT.md section 6, avec vérification
// stricte des permissions (host only, joueur du tour only, etc.) et respect absolu de la
// règle "aucun champ role/champion d'autrui hors game:ended et round:result de l'éliminé".

import type { Server, Socket } from 'socket.io';
import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from './events.js';
import { randomUUID } from 'node:crypto';
import type {
  ChampionPair,
  ChatMessage,
  GameEndedPayload,
  Player,
  PublicPlayer,
  PublicSpectator,
  Room,
  RoomSettings,
  RoomStatePublic,
  RoundResultPayload,
  Winner,
} from '../types.js';
import {
  CHAT_HISTORY_LIMIT,
  MAX_CUSTOM_PAIRS_PER_ROOM,
  MAX_PLAYERS_PER_ROOM,
  MAX_SPECTATORS_PER_ROOM,
  cancelEmptyRoomExpiration,
  computeAvatarSeed,
  countConnectedPlayers,
  createRoom,
  deleteRoom,
  generatePlayerId,
  generateSessionToken,
  getRoom,
  scheduleEmptyRoomExpiration,
} from '../rooms/roomStore.js';
import {
  attemptRejoin,
  cancelDisconnectTimer,
  finalizeDisconnectTimeout,
  migrateHostIfNeeded,
  registerDisconnect,
} from '../rooms/reconnection.js';
import * as engine from '../game/engine.js';
import { GameEngineError } from '../game/engine.js';
import {
  GHOST_MIN_PLAYERS,
  HUNTER_MIN_PLAYERS,
  JESTER_MIN_PLAYERS,
  LOVERS_MIN_PLAYERS,
  MR_WHITE_MIN_PLAYERS,
  PROTECTOR_MIN_PLAYERS,
  SPY_MIN_PLAYERS,
} from '../game/roles.js';
import { getPairs } from '../content/pairsStore.js';
import { characterImage } from '../content/characterImages.js';

type IoServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type IoSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

const NAME_MAX_LENGTH = 24;
const CHAT_MESSAGE_MAX_LENGTH = 300;
const CUSTOM_PAIR_FIELD_MAX_LENGTH = 40;
const CUSTOM_PAIR_THEME_MAX_LENGTH = 80;
// Réglages "qualité de vie" (voir RoomSettings) — valeurs acceptées côté serveur.
const MAX_UNDERCOVER_SETTING = 4;
const DISCUSSION_SECONDS_ALLOWED = new Set([0, 60, 90, 120, 180, 300]);
const DIFFICULTIES = new Set(['all', 'easy', 'medium', 'hard']);
const UNIVERSES = new Set<unknown>(['lol', 'smash', 'pokemon', 'games']);

// ---------------------------------------------------------------------------
// Sérialisation publique — ne JAMAIS inclure role/champion ici (contrat section 6).
// ---------------------------------------------------------------------------

function toPublicPlayer(player: Player): PublicPlayer {
  return {
    playerId: player.playerId,
    name: player.name,
    isHost: player.isHost,
    connected: player.connected,
    alive: player.alive,
    avatarSeed: player.avatarSeed,
    score: player.score,
  };
}

function toPublicSpectator(spectator: Player): PublicSpectator {
  return {
    playerId: spectator.playerId,
    name: spectator.name,
    avatarSeed: spectator.avatarSeed,
  };
}

function toPublicState(room: Room): RoomStatePublic {
  return {
    roomCode: room.roomCode,
    universe: room.universe,
    phase: room.phase,
    players: engine.playersInJoinOrder(room).map(toPublicPlayer),
    spectators: [...room.spectators.values()]
      .sort((a, b) => a.joinOrder - b.joinOrder)
      .map(toPublicSpectator),
    settings: { ...room.settings },
    round: room.round,
    turnOrder: [...room.turnOrder],
    votedPlayerIds: room.votes.map((v) => v.voterId),
    phaseDeadline: room.phaseDeadline,
    ghostVoterIds: engine
      .playersInJoinOrder(room)
      .filter((p) => !p.alive && p.ghostVoteAvailable)
      .map((p) => p.playerId),
    mrWhiteGuessPlayerId: room.phase === 'mrwhite_guess' ? room.mrWhiteGuessPlayerId : null,
    hunterShootPlayerId: room.phase === 'hunter_shoot' ? room.hunterShootPlayerId : null,
    abortedByName: room.phase === 'aborted' ? room.abortedByName : null,
    customPairs: [...room.customPairs],
  };
}

function broadcastRoomState(io: IoServer, room: Room): void {
  io.to(room.roomCode).emit('room:state', toPublicState(room));
}

/** "Univers maison" (voir §7bis) : pool réellement utilisé pour game:start/restart. */
function pickPairsPool(room: Room): ChampionPair[] {
  if (room.settings.customPairsEnabled && room.customPairs.length > 0) {
    return room.customPairs;
  }
  return getPairs(room.universe, room.settings.difficulty);
}

/** Fait entrer tous les spectateurs en jeu au prochain game:restart (voir §5bis) : "rejoindre
 * une partie déjà lancée afin de pouvoir la rejoindre plus tard" — ils regardent la partie en
 * cours puis deviennent joueurs complets dès la suivante, sans action de leur part. */
function promoteSpectatorsToPlayers(room: Room): void {
  if (room.spectators.size === 0) return;
  for (const spectator of room.spectators.values()) {
    if (room.players.size >= MAX_PLAYERS_PER_ROOM) break; // les suivants restent spectateurs
    room.players.set(spectator.playerId, { ...spectator, joinOrder: room.nextJoinOrder++ });
    room.spectators.delete(spectator.playerId);
  }
}

// Rôles considérés comme des variantes du camp civils pour l'insight de l'Espion (voir
// game/engine.ts#CIVIL_ALIGNED_ROLES) — dupliqué ici car handlers.ts ne dépend pas des
// internes du moteur, seulement de types.js.
const CIVIL_ALIGNED_ROLES = new Set(['civil', 'spy', 'protector', 'ghost', 'hunter']);

function sendRolePrivate(io: IoServer, room: Room, player: Player): void {
  if (!player.socketId || !player.role) return;
  const payload: Parameters<ServerToClientEvents['role:private']>[0] = {
    role: player.role,
    champion: player.champion,
    championImage: characterImage(room.universe, player.champion),
  };
  if (player.loverPlayerId) {
    const lover = room.players.get(player.loverPlayerId);
    if (lover) payload.loverName = lover.name;
  }
  if (player.role === 'spy' && player.spyInsightPlayerId) {
    const target = room.players.get(player.spyInsightPlayerId);
    if (target && target.role) {
      const team = CIVIL_ALIGNED_ROLES.has(target.role)
        ? 'civils'
        : target.role === 'jester'
          ? 'jester'
          : (target.role as 'undercover' | 'mrwhite');
      payload.spyInsight = { playerName: target.name, team };
    }
  }
  io.to(player.socketId).emit('role:private', payload);
}

function sendRolePrivateToAllConnected(io: IoServer, room: Room): void {
  for (const player of room.players.values()) {
    sendRolePrivate(io, room, player);
  }
}

/** Rejoue l'historique de chat (tampon borné, voir CHAT_HISTORY_LIMIT) au seul socket qui
 * vient de rejoindre/recréer/se reconnecter — pure convenience, jamais broadcast. */
function sendChatHistory(io: IoServer, socketId: string, room: Room): void {
  io.to(socketId).emit('chat:history', room.chatMessages);
}

function emitError(socket: IoSocket, code: string, message: string): void {
  socket.emit('error', { code, message });
}

// ---------------------------------------------------------------------------
// Timers de phase — le serveur fait autorité sur phaseDeadline (contrat §6).
// ---------------------------------------------------------------------------

function clearRoomTimer(room: Room): void {
  if (room.phaseTimer) {
    clearTimeout(room.phaseTimer);
    room.phaseTimer = null;
  }
}

function scheduleRoomTimer(room: Room, delayMs: number, cb: () => void): void {
  clearRoomTimer(room);
  room.phaseTimer = setTimeout(cb, Math.max(0, delayMs));
  room.phaseTimer.unref?.();
}

function scheduleRevealTimeout(io: IoServer, room: Room): void {
  scheduleRoomTimer(room, engine.REVEAL_ACK_TIMEOUT_MS, () => onRevealTimeout(io, room));
}

function scheduleMrWhiteGuessTimeout(io: IoServer, room: Room): void {
  scheduleRoomTimer(room, engine.MRWHITE_GUESS_TIMEOUT_MS, () => onMrWhiteGuessTimeout(io, room));
}

function scheduleHunterShootTimeout(io: IoServer, room: Room): void {
  scheduleRoomTimer(room, engine.HUNTER_SHOOT_TIMEOUT_MS, () => onHunterShootTimeout(io, room));
}

function onRevealTimeout(io: IoServer, room: Room): void {
  if (room.phase !== 'reveal') return;
  enterDiscussionAndBroadcast(io, room);
}

/** Entre en discussion, programme le minuteur optionnel (settings.discussionSeconds) et diffuse. */
function enterDiscussionAndBroadcast(io: IoServer, room: Room, enter: () => void = () => engine.enterDiscussion(room)): void {
  enter();
  if (room.phaseDeadline) {
    scheduleRoomTimer(room, room.phaseDeadline - Date.now(), () => onDiscussionTimeout(io, room));
  } else {
    clearRoomTimer(room);
  }
  broadcastRoomState(io, room);
}

function onDiscussionTimeout(io: IoServer, room: Room): void {
  if (room.phase !== 'discussion') return;
  engine.startVoting(room);
  broadcastRoomState(io, room);
}

/** Dépouille les votes et enchaîne (mrwhite_guess, hunter_shoot ou fin de partie éventuelle). */
function finishVoting(io: IoServer, room: Room): void {
  const { result, winner, enterMrWhiteGuess, enterHunterShoot } = engine.tallyVotesAndEliminate(room);
  clearRoomTimer(room);
  io.to(room.roomCode).emit('round:result', result);
  broadcastRoomState(io, room);

  if (enterMrWhiteGuess) {
    engine.enterMrWhiteGuess(room);
    broadcastRoomState(io, room);
    scheduleMrWhiteGuessTimeout(io, room);
    return;
  }

  if (enterHunterShoot) {
    engine.enterHunterShoot(room);
    broadcastRoomState(io, room);
    scheduleHunterShootTimeout(io, room);
    return;
  }

  if (winner) {
    finishGame(io, room, winner);
  }
  // Sinon : reste en round_result, attend `round:continue` du host.
}

function onMrWhiteGuessTimeout(io: IoServer, room: Room): void {
  if (room.phase !== 'mrwhite_guess') return;
  const { winner } = engine.resolveMrWhiteTimeout(room);
  broadcastRoomState(io, room);
  if (winner) finishGame(io, room, winner);
}

function onHunterShootTimeout(io: IoServer, room: Room): void {
  if (room.phase !== 'hunter_shoot') return;
  const { winner } = engine.resolveHunterShotTimeout(room);
  if (room.lastRoundResult) io.to(room.roomCode).emit('round:result', room.lastRoundResult);
  broadcastRoomState(io, room);
  if (winner) finishGame(io, room, winner);
}

function finishGame(io: IoServer, room: Room, winner: Winner): void {
  engine.awardScoreForWinner(room, winner);
  engine.enterGameOver(room);
  clearRoomTimer(room);
  const reveal = engine.buildGameEndedReveal(room);
  broadcastRoomState(io, room);
  const payload: GameEndedPayload = { winner, reveal, pair: engine.buildGameEndedPair(room) };
  io.to(room.roomCode).emit('game:ended', payload);
}

/**
 * Départ hors du flux de vote normal (déconnexion expirée ou player:leave en cours de
 * partie). Émet un round:result "ciblé" pour révéler le rôle du seul joueur qui part (règle
 * explicite CONTRACT.md §5 : "marqué éliminé (rôle révélé)"), puis réconcilie l'état de jeu
 * (ordre des tours / fenêtre mrwhite_guess / conditions de victoire).
 */
function applyMidGameDeparture(io: IoServer, room: Room, playerId: string, opts: { kicked?: boolean } = {}): void {
  const player = room.players.get(playerId);
  if (!player) return;

  // Forfait immédiat du vote bonus "Revenant" si ce joueur partait avec un vote en attente —
  // no-op si déjà false. Départs et déconnexions ne déclenchent jamais les réactions spéciales
  // post-élimination (Amoureux/Bouffon/Chasseur), voir CONTRACT.md, règle unificatrice.
  player.ghostVoteAvailable = false;

  // Événement dédié (et non plus un round:result) : un round:result écrasait le résultat de
  // vote affiché, et faisait disparaître l'écran de devinette de Mr White / de tir du Chasseur
  // quand un autre joueur partait pendant ces phases.
  const champion = room.settings.revealChampionOnElimination ? player.champion : null;
  io.to(room.roomCode).emit('player:left', {
    playerId,
    name: player.name,
    role: player.role,
    champion,
    championImage: characterImage(room.universe, champion),
    kicked: opts.kicked ?? false,
  });

  if (room.phase === 'mrwhite_guess' && room.mrWhiteGuessPlayerId === playerId) {
    const res = engine.resolveMrWhiteTimeout(room);
    if (res.winner) {
      finishGame(io, room, res.winner);
      return;
    }
    clearRoomTimer(room);
    broadcastRoomState(io, room);
    return;
  }

  if (room.phase === 'hunter_shoot' && room.hunterShootPlayerId === playerId) {
    const res = engine.resolveHunterShotTimeout(room);
    if (res.winner) {
      finishGame(io, room, res.winner);
      return;
    }
    clearRoomTimer(room);
    broadcastRoomState(io, room);
    return;
  }

  const winner = engine.evaluateCurrentWinner(room);
  if (winner) {
    finishGame(io, room, winner);
    return;
  }

  if (room.phase === 'discussion') {
    engine.removeFromTurnOrder(room, playerId);
    broadcastRoomState(io, room);
    return;
  }

  if (room.phase === 'voting' && engine.haveAllAlivePlayersVoted(room)) {
    finishVoting(io, room);
    return;
  }

  broadcastRoomState(io, room);
}

// ---------------------------------------------------------------------------
// Aides de validation / permissions
// ---------------------------------------------------------------------------

function ok(ack?: (res: { ok: boolean; error?: { code: string; message: string } }) => void): void {
  ack?.({ ok: true });
}

function fail(
  socket: IoSocket,
  ack: ((res: { ok: boolean; error?: { code: string; message: string } }) => void) | undefined,
  code: string,
  message: string
): void {
  emitError(socket, code, message);
  ack?.({ ok: false, error: { code, message } });
}

/** Traduit une erreur levée par le moteur de jeu (ou une erreur inattendue) en réponse client. */
function reportEngineError(
  socket: IoSocket,
  ack: ((res: { ok: boolean; error?: { code: string; message: string } }) => void) | undefined,
  err: unknown,
  fallbackCode = 'INTERNAL_ERROR'
): void {
  if (err instanceof GameEngineError) {
    fail(socket, ack, err.code, err.message);
    return;
  }
  const message = err instanceof Error ? err.message : 'Erreur interne inattendue';
  fail(socket, ack, fallbackCode, message);
}

interface Ctx {
  room: Room;
  player: Player;
  /** true si `player` vient de room.spectators (jamais de room.players) — voir §5bis. Les
   * handlers de jeu (vote, protect, etc.) n'ont pas besoin de la vérifier : ils re-résolvent
   * toujours le joueur via room.players.get() en interne, ce qui échoue naturellement pour un
   * spectateur puisqu'il n'y figure jamais. */
  isSpectator: boolean;
}

/** Récupère la room + le joueur (ou spectateur) associés au socket courant, ou signale
 * l'erreur. */
function requireCtx(
  socket: IoSocket,
  ack?: (res: { ok: boolean; error?: { code: string; message: string } }) => void
): Ctx | null {
  const { roomCode, playerId } = socket.data;
  if (!roomCode || !playerId) {
    fail(socket, ack, 'NOT_IN_ROOM', "Ce socket n'est associé à aucune room");
    return null;
  }
  const room = getRoom(roomCode);
  if (!room) {
    fail(socket, ack, 'ROOM_NOT_FOUND', 'Room introuvable ou expirée');
    return null;
  }
  const player = room.players.get(playerId);
  if (player) return { room, player, isSpectator: false };
  const spectator = room.spectators.get(playerId);
  if (spectator) return { room, player: spectator, isSpectator: true };
  fail(socket, ack, 'PLAYER_NOT_FOUND', 'Joueur introuvable dans cette room');
  return null;
}

function requireHost(
  socket: IoSocket,
  ctx: Ctx,
  ack?: (res: { ok: boolean; error?: { code: string; message: string } }) => void
): boolean {
  if (!ctx.player.isHost) {
    fail(socket, ack, 'NOT_HOST', 'Action réservée au host de la room');
    return false;
  }
  return true;
}

function isValidName(name: unknown): name is string {
  return typeof name === 'string' && name.trim().length >= 1 && name.trim().length <= NAME_MAX_LENGTH;
}

/** Deux joueurs du même nom rendaient votes et chat ambigus : refusé (casse et accents ignorés). */
function isNameTaken(room: Room, name: string): boolean {
  const key = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
  const wanted = key(name);
  return [...room.players.values(), ...room.spectators.values()].some((p) => key(p.name) === wanted);
}

/** Valide les réglages non booléens (voir RoomSettings) ; renvoie un message d'erreur ou null. */
function validateExtraSettings(next: RoomSettings): string | null {
  if (!Number.isInteger(next.undercoverCount) || next.undercoverCount < 0 || next.undercoverCount > MAX_UNDERCOVER_SETTING) {
    return `undercoverCount doit être un entier entre 0 (auto) et ${MAX_UNDERCOVER_SETTING}`;
  }
  if (!DISCUSSION_SECONDS_ALLOWED.has(next.discussionSeconds)) {
    return 'discussionSeconds invalide';
  }
  if (!DIFFICULTIES.has(next.difficulty)) {
    return 'difficulty invalide';
  }
  return null;
}

// ---------------------------------------------------------------------------
// Enregistrement des handlers
// ---------------------------------------------------------------------------

export function registerSocketHandlers(io: IoServer): void {
  io.on('connection', (socket: IoSocket) => {
    socket.data.roomCode = null;
    socket.data.playerId = null;

    socket.on('room:create', (payload, ack) => {
      if (!isValidName(payload?.hostName)) {
        ack({ ok: false, error: { code: 'INVALID_NAME', message: 'Nom du host invalide' } });
        return;
      }
      if (!UNIVERSES.has(payload?.universe)) {
        ack({ ok: false, error: { code: 'INVALID_UNIVERSE', message: 'Univers invalide' } });
        return;
      }
      const room = createRoom(payload.universe);
      const playerId = generatePlayerId();
      const sessionToken = generateSessionToken();
      const player: Player = {
        playerId,
        sessionToken,
        name: payload.hostName.trim(),
        isHost: true,
        connected: true,
        alive: true,
        avatarSeed: computeAvatarSeed(playerId),
        socketId: socket.id,
        role: null,
        champion: null,
        hasAckedReveal: false,
        joinOrder: room.nextJoinOrder++,
        disconnectedAt: null,
        disconnectTimer: null,
        loverPlayerId: null,
        spyInsightPlayerId: null,
        protectUsedThisGame: false,
        ghostVoteAvailable: false,
        score: 0,
      };
      room.players.set(playerId, player);
      socket.join(room.roomCode);
      socket.data.roomCode = room.roomCode;
      socket.data.playerId = playerId;

      ack({ ok: true, roomCode: room.roomCode, playerId, sessionToken });
      broadcastRoomState(io, room);
      sendChatHistory(io, socket.id, room);
    });

    socket.on('room:join', (payload, ack) => {
      const roomCode = (payload?.roomCode ?? '').toString().trim().toUpperCase();
      const room = getRoom(roomCode);
      if (!room) {
        ack({ ok: false, error: { code: 'ROOM_NOT_FOUND', message: 'Room introuvable ou expirée' } });
        return;
      }
      if (room.phase !== 'lobby') {
        ack({ ok: false, error: { code: 'GAME_IN_PROGRESS', message: 'La partie a déjà commencé' } });
        return;
      }
      if (room.players.size >= MAX_PLAYERS_PER_ROOM) {
        ack({ ok: false, error: { code: 'ROOM_FULL', message: 'La room est complète (12 joueurs max)' } });
        return;
      }
      if (!isValidName(payload?.playerName)) {
        ack({ ok: false, error: { code: 'INVALID_NAME', message: 'Nom de joueur invalide' } });
        return;
      }
      if (isNameTaken(room, payload.playerName)) {
        ack({ ok: false, error: { code: 'NAME_TAKEN', message: 'Ce pseudo est déjà pris dans cette room' } });
        return;
      }

      const playerId = generatePlayerId();
      const sessionToken = generateSessionToken();
      const player: Player = {
        playerId,
        sessionToken,
        name: payload.playerName.trim(),
        isHost: false,
        connected: true,
        alive: true,
        avatarSeed: computeAvatarSeed(playerId),
        socketId: socket.id,
        role: null,
        champion: null,
        hasAckedReveal: false,
        joinOrder: room.nextJoinOrder++,
        disconnectedAt: null,
        disconnectTimer: null,
        loverPlayerId: null,
        spyInsightPlayerId: null,
        protectUsedThisGame: false,
        ghostVoteAvailable: false,
        score: 0,
      };
      room.players.set(playerId, player);
      socket.join(room.roomCode);
      socket.data.roomCode = room.roomCode;
      socket.data.playerId = playerId;
      cancelEmptyRoomExpiration(room);

      ack({ ok: true, playerId, sessionToken });
      broadcastRoomState(io, room);
      sendChatHistory(io, socket.id, room);
    });

    // Rejoindre une partie déjà en cours en lecture seule (voir §5bis) : jamais dans
    // room.players, aucune session persistée nécessaire côté client (contrairement à
    // room:join) — si le spectateur se déconnecte ou recharge, il re-rejoint simplement en
    // spectateur. Promu joueur complet au prochain game:restart.
    socket.on('room:joinSpectator', (payload, ack) => {
      const roomCode = (payload?.roomCode ?? '').toString().trim().toUpperCase();
      const room = getRoom(roomCode);
      if (!room) {
        ack({ ok: false, error: { code: 'ROOM_NOT_FOUND', message: 'Room introuvable ou expirée' } });
        return;
      }
      if (room.phase === 'lobby' || room.phase === 'aborted') {
        ack({
          ok: false,
          error: { code: 'INVALID_PHASE', message: 'Aucune partie en cours à regarder dans cette room' },
        });
        return;
      }
      if (room.spectators.size >= MAX_SPECTATORS_PER_ROOM) {
        ack({ ok: false, error: { code: 'ROOM_FULL', message: 'Trop de spectateurs dans cette room' } });
        return;
      }
      if (!isValidName(payload?.playerName)) {
        ack({ ok: false, error: { code: 'INVALID_NAME', message: 'Nom de spectateur invalide' } });
        return;
      }
      if (isNameTaken(room, payload.playerName)) {
        ack({ ok: false, error: { code: 'NAME_TAKEN', message: 'Ce pseudo est déjà pris dans cette room' } });
        return;
      }

      const playerId = generatePlayerId();
      const sessionToken = generateSessionToken();
      const spectator: Player = {
        playerId,
        sessionToken,
        name: payload.playerName.trim(),
        isHost: false,
        connected: true,
        alive: true,
        avatarSeed: computeAvatarSeed(playerId),
        socketId: socket.id,
        role: null,
        champion: null,
        hasAckedReveal: false,
        joinOrder: 0, // réattribué à la promotion en joueur (promoteSpectatorsToPlayers)
        disconnectedAt: null,
        disconnectTimer: null,
        loverPlayerId: null,
        spyInsightPlayerId: null,
        protectUsedThisGame: false,
        ghostVoteAvailable: false,
        score: 0,
      };
      room.spectators.set(playerId, spectator);
      socket.join(room.roomCode);
      socket.data.roomCode = room.roomCode;
      socket.data.playerId = playerId;
      cancelEmptyRoomExpiration(room);

      ack({ ok: true, playerId, sessionToken });
      broadcastRoomState(io, room);
      sendChatHistory(io, socket.id, room);
    });

    socket.on('room:rejoin', (payload, ack) => {
      const roomCode = (payload?.roomCode ?? '').toString().trim().toUpperCase();
      const room = getRoom(roomCode);
      const result = attemptRejoin(
        room,
        { playerId: payload?.playerId, sessionToken: payload?.sessionToken },
        socket.id
      );
      if (!result.ok) {
        ack({ ok: false, error: { code: result.code, message: result.message } });
        return;
      }
      socket.join(roomCode);
      socket.data.roomCode = roomCode;
      socket.data.playerId = result.player.playerId;
      cancelEmptyRoomExpiration(room as Room);

      ack({ ok: true });
      broadcastRoomState(io, room as Room);
      sendChatHistory(io, socket.id, room as Room);
      if (result.shouldResendRolePrivate) {
        sendRolePrivate(io, room as Room, result.player);
      }
    });

    socket.on('settings:update', (payload, ack) => {
      const ctx = requireCtx(socket, ack);
      if (!ctx) return;
      if (!requireHost(socket, ctx, ack)) return;
      const { room } = ctx;
      if (room.phase !== 'lobby') {
        fail(socket, ack, 'INVALID_PHASE', 'Les réglages ne peuvent être modifiés qu\'en lobby');
        return;
      }
      const next = { ...room.settings, ...(payload?.settings ?? {}) };
      const n = room.players.size;

      const boolFields: (keyof typeof next)[] = [
        'mrWhiteEnabled',
        'revealChampionOnElimination',
        'spyEnabled',
        'loversEnabled',
        'protectorEnabled',
        'ghostEnabled',
        'jesterEnabled',
        'hunterEnabled',
        'customPairsEnabled',
        'publicVotes',
      ];
      for (const field of boolFields) {
        if (typeof next[field] !== 'boolean') {
          fail(socket, ack, 'INVALID_SETTINGS', `${field} doit être un booléen`);
          return;
        }
      }

      const thresholds: [keyof typeof next, number, string][] = [
        ['mrWhiteEnabled', MR_WHITE_MIN_PLAYERS, 'Mr White'],
        ['spyEnabled', SPY_MIN_PLAYERS, "L'Espion"],
        ['protectorEnabled', PROTECTOR_MIN_PLAYERS, 'Le Protecteur'],
        ['ghostEnabled', GHOST_MIN_PLAYERS, 'Le Revenant'],
        ['jesterEnabled', JESTER_MIN_PLAYERS, 'Le Bouffon'],
        ['hunterEnabled', HUNTER_MIN_PLAYERS, 'Le Chasseur'],
        ['loversEnabled', LOVERS_MIN_PLAYERS, 'Les Amoureux'],
      ];
      for (const [field, min, label] of thresholds) {
        if (next[field] && n < min) {
          fail(socket, ack, 'INVALID_SETTINGS', `${label} nécessite au moins ${min} joueurs`);
          return;
        }
      }
      const extraError = validateExtraSettings(next);
      if (extraError) {
        fail(socket, ack, 'INVALID_SETTINGS', extraError);
        return;
      }
      if (next.customPairsEnabled && room.customPairs.length === 0) {
        fail(socket, ack, 'INVALID_SETTINGS', 'Ajoute au moins une paire personnalisée avant d\'activer cette option');
        return;
      }

      room.settings = next;
      ok(ack);
      broadcastRoomState(io, room);
    });

    // "Univers maison" (voir §7bis) : paires scoped à CETTE room uniquement, jamais un pool
    // partagé mutable entre rooms (voir l'historique documenté en §7 sur l'ancienne mécanique
    // pairs:add/toggle/remove, abandonnée pour cette raison précise).
    socket.on('custom:addPair', (payload, ack) => {
      const ctx = requireCtx(socket, ack);
      if (!ctx) return;
      if (!requireHost(socket, ctx, ack)) return;
      const { room } = ctx;
      if (room.phase !== 'lobby') {
        fail(socket, ack, 'INVALID_PHASE', 'Les paires personnalisées ne peuvent être modifiées qu\'en lobby');
        return;
      }
      if (room.customPairs.length >= MAX_CUSTOM_PAIRS_PER_ROOM) {
        fail(socket, ack, 'TOO_MANY_PAIRS', `Maximum ${MAX_CUSTOM_PAIRS_PER_ROOM} paires personnalisées`);
        return;
      }
      const champA = (payload?.champA ?? '').toString().trim().slice(0, CUSTOM_PAIR_FIELD_MAX_LENGTH);
      const champB = (payload?.champB ?? '').toString().trim().slice(0, CUSTOM_PAIR_FIELD_MAX_LENGTH);
      const theme = (payload?.theme ?? '').toString().trim().slice(0, CUSTOM_PAIR_THEME_MAX_LENGTH);
      if (!champA || !champB) {
        fail(socket, ack, 'INVALID_PAIR', 'champA et champB sont requis');
        return;
      }
      const pair: ChampionPair = {
        id: randomUUID(),
        champA,
        champB,
        theme: theme || 'Paire personnalisée',
      };
      room.customPairs.push(pair);
      ok(ack);
      broadcastRoomState(io, room);
    });

    socket.on('custom:removePair', (payload, ack) => {
      const ctx = requireCtx(socket, ack);
      if (!ctx) return;
      if (!requireHost(socket, ctx, ack)) return;
      const { room } = ctx;
      if (room.phase !== 'lobby') {
        fail(socket, ack, 'INVALID_PHASE', 'Les paires personnalisées ne peuvent être modifiées qu\'en lobby');
        return;
      }
      const id = (payload?.id ?? '').toString();
      const next = room.customPairs.filter((p) => p.id !== id);
      if (next.length === room.customPairs.length) {
        fail(socket, ack, 'PAIR_NOT_FOUND', 'Paire personnalisée introuvable');
        return;
      }
      room.customPairs = next;
      // Si le dernier retrait vide la liste, redésactiver l'option pour rester cohérent avec
      // la règle "au moins 1 paire pour l'activer" (settings:update).
      if (room.customPairs.length === 0 && room.settings.customPairsEnabled) {
        room.settings = { ...room.settings, customPairsEnabled: false };
      }
      ok(ack);
      broadcastRoomState(io, room);
    });

    socket.on('game:start', (_payload, ack) => {
      const ctx = requireCtx(socket, ack);
      if (!ctx) return;
      if (!requireHost(socket, ctx, ack)) return;
      const { room } = ctx;
      if (room.phase !== 'lobby') {
        fail(socket, ack, 'INVALID_PHASE', 'game:start uniquement valide en phase lobby');
        return;
      }
      try {
        engine.assignRolesAndEnterReveal(room, { pairsPool: pickPairsPool(room) });
      } catch (err) {
        reportEngineError(socket, ack, err, 'START_FAILED');
        return;
      }
      ok(ack);
      sendRolePrivateToAllConnected(io, room);
      broadcastRoomState(io, room);
      scheduleRevealTimeout(io, room);
    });

    socket.on('reveal:ack', (_payload, ack) => {
      const ctx = requireCtx(socket, ack);
      if (!ctx) return;
      const { room, player } = ctx;
      try {
        engine.ackReveal(room, player.playerId);
      } catch (err) {
        reportEngineError(socket, ack, err, 'ACK_FAILED');
        return;
      }
      ok(ack);
      if (engine.haveAllAlivePlayersAckedReveal(room)) {
        enterDiscussionAndBroadcast(io, room);
      }
    });

    socket.on('round:startVoting', (_payload, ack) => {
      const ctx = requireCtx(socket, ack);
      if (!ctx) return;
      if (!requireHost(socket, ctx, ack)) return;
      const { room } = ctx;
      try {
        engine.startVoting(room);
      } catch (err) {
        reportEngineError(socket, ack, err, 'START_VOTING_FAILED');
        return;
      }
      clearRoomTimer(room); // minuteur de discussion éventuel
      ok(ack);
      broadcastRoomState(io, room);
    });

    socket.on('vote:submit', (payload, ack) => {
      const ctx = requireCtx(socket, ack);
      if (!ctx) return;
      const { room, player } = ctx;
      try {
        engine.submitVote(room, player.playerId, (payload?.targetPlayerId ?? '').toString());
        ok(ack);
        if (engine.haveAllAlivePlayersVoted(room)) {
          finishVoting(io, room);
        } else {
          broadcastRoomState(io, room);
        }
      } catch (err) {
        reportEngineError(socket, ack, err, 'VOTE_FAILED');
      }
    });

    socket.on('protector:protect', (payload, ack) => {
      const ctx = requireCtx(socket, ack);
      if (!ctx) return;
      const { room, player } = ctx;
      try {
        engine.submitProtectorProtect(room, player.playerId, (payload?.targetPlayerId ?? '').toString());
        ok(ack);
        broadcastRoomState(io, room);
      } catch (err) {
        reportEngineError(socket, ack, err, 'PROTECT_FAILED');
      }
    });

    socket.on('mrwhite:guess', (payload, ack) => {
      const ctx = requireCtx(socket, ack);
      if (!ctx) return;
      const { room, player } = ctx;
      try {
        const res = engine.submitMrWhiteGuess(room, player.playerId, (payload?.championGuess ?? '').toString());
        clearRoomTimer(room);
        ok(ack);
        if (res.correct) {
          finishGame(io, room, 'mrwhite');
          return;
        }
        broadcastRoomState(io, room);
        if (res.winner) {
          finishGame(io, room, res.winner);
        }
      } catch (err) {
        reportEngineError(socket, ack, err, 'GUESS_FAILED');
      }
    });

    socket.on('hunter:shoot', (payload, ack) => {
      const ctx = requireCtx(socket, ack);
      if (!ctx) return;
      const { room, player } = ctx;
      try {
        const targetPlayerId =
          payload?.targetPlayerId === null || payload?.targetPlayerId === undefined
            ? null
            : payload.targetPlayerId.toString();
        const res = engine.submitHunterShot(room, player.playerId, targetPlayerId);
        clearRoomTimer(room);
        ok(ack);
        if (room.lastRoundResult) io.to(room.roomCode).emit('round:result', room.lastRoundResult);
        broadcastRoomState(io, room);
        if (res.winner) {
          finishGame(io, room, res.winner);
        }
      } catch (err) {
        reportEngineError(socket, ack, err, 'SHOOT_FAILED');
      }
    });

    socket.on('round:continue', (_payload, ack) => {
      const ctx = requireCtx(socket, ack);
      if (!ctx) return;
      if (!requireHost(socket, ctx, ack)) return;
      const { room } = ctx;
      try {
        enterDiscussionAndBroadcast(io, room, () => engine.roundContinue(room));
      } catch (err) {
        reportEngineError(socket, ack, err, 'CONTINUE_FAILED');
        return;
      }
      ok(ack);
    });

    socket.on('game:restart', (_payload, ack) => {
      const ctx = requireCtx(socket, ack);
      if (!ctx) return;
      if (!requireHost(socket, ctx, ack)) return;
      const { room } = ctx;
      // Utilisable aussi bien depuis game_over (rejouer) que depuis n'importe quelle phase de
      // partie en cours (l'hôte relance immédiatement, nouveaux rôles/champions) — seul lobby
      // (game:start s'en charge) et aborted (terminal, voir §5) sont exclus.
      if (room.phase === 'lobby' || room.phase === 'aborted') {
        fail(socket, ack, 'INVALID_PHASE', 'game:restart invalide en phase lobby ou aborted');
        return;
      }
      engine.pruneDepartedPlayers(room);
      promoteSpectatorsToPlayers(room);
      try {
        engine.assignRolesAndEnterReveal(room, { pairsPool: pickPairsPool(room) });
      } catch (err) {
        reportEngineError(socket, ack, err, 'RESTART_FAILED');
        broadcastRoomState(io, room);
        return;
      }
      ok(ack);
      sendRolePrivateToAllConnected(io, room);
      broadcastRoomState(io, room);
      scheduleRevealTimeout(io, room);
    });

    socket.on('chat:send', (payload, ack) => {
      const ctx = requireCtx(socket, ack);
      if (!ctx) return;
      const { room, player } = ctx;
      const text = (payload?.text ?? '').toString().trim().slice(0, CHAT_MESSAGE_MAX_LENGTH);
      if (!text) {
        fail(socket, ack, 'INVALID_MESSAGE', 'Message vide');
        return;
      }
      const message: ChatMessage = {
        id: randomUUID(),
        playerId: player.playerId,
        name: player.name,
        text,
        ts: Date.now(),
      };
      room.chatMessages.push(message);
      if (room.chatMessages.length > CHAT_HISTORY_LIMIT) {
        room.chatMessages.splice(0, room.chatMessages.length - CHAT_HISTORY_LIMIT);
      }
      ok(ack);
      io.to(room.roomCode).emit('chat:message', message);
    });

    // Retour au salon après une partie (ou une partie interrompue) : l'hôte peut changer les
    // réglages, de nouveaux joueurs peuvent rejoindre, les spectateurs deviennent joueurs.
    socket.on('game:backToLobby', (_payload, ack) => {
      const ctx = requireCtx(socket, ack);
      if (!ctx) return;
      if (!requireHost(socket, ctx, ack)) return;
      const { room } = ctx;
      if (room.phase !== 'game_over' && room.phase !== 'aborted') {
        fail(socket, ack, 'INVALID_PHASE', 'Retour au salon possible uniquement en fin de partie');
        return;
      }
      clearRoomTimer(room);
      engine.pruneDepartedPlayers(room);
      promoteSpectatorsToPlayers(room);
      engine.returnToLobby(room);
      room.abortedByName = null;
      ok(ack);
      broadcastRoomState(io, room);
    });

    socket.on('player:kick', (payload, ack) => {
      const ctx = requireCtx(socket, ack);
      if (!ctx) return;
      if (!requireHost(socket, ctx, ack)) return;
      const { room, player: host } = ctx;
      const targetId = (payload?.targetPlayerId ?? '').toString();
      if (targetId === host.playerId) {
        fail(socket, ack, 'KICK_SELF_FORBIDDEN', 'Tu ne peux pas t’exclure toi-même');
        return;
      }
      const target = room.players.get(targetId) ?? room.spectators.get(targetId);
      if (!target) {
        fail(socket, ack, 'PLAYER_NOT_FOUND', 'Joueur introuvable dans cette room');
        return;
      }
      ok(ack);
      // Couper le lien socket <-> room du joueur exclu (il peut revenir avec le code, en lobby).
      if (target.socketId) {
        const targetSocket = io.sockets.sockets.get(target.socketId);
        targetSocket?.emit('player:kicked');
        targetSocket?.leave(room.roomCode);
        if (targetSocket) {
          targetSocket.data.roomCode = null;
          targetSocket.data.playerId = null;
        }
      }
      if (room.spectators.has(targetId)) {
        room.spectators.delete(targetId);
        broadcastRoomState(io, room);
        return;
      }
      target.sessionToken = generateSessionToken(); // invalide toute reconnexion avec l'ancien siège
      handlePlayerDeparture(io, room, targetId, { explicit: false, kicked: true });
    });

    // L'hôte clôt le vote sans attendre les retardataires (joueur AFK, déconnecté...) : le
    // dépouillement porte sur les bulletins déjà déposés.
    socket.on('vote:forceClose', (_payload, ack) => {
      const ctx = requireCtx(socket, ack);
      if (!ctx) return;
      if (!requireHost(socket, ctx, ack)) return;
      const { room } = ctx;
      if (room.phase !== 'voting') {
        fail(socket, ack, 'INVALID_PHASE', 'Aucun vote en cours');
        return;
      }
      ok(ack);
      finishVoting(io, room);
    });

    // L'hôte passe la révélation sans attendre que tout le monde ait confirmé.
    socket.on('reveal:forceEnd', (_payload, ack) => {
      const ctx = requireCtx(socket, ack);
      if (!ctx) return;
      if (!requireHost(socket, ctx, ack)) return;
      const { room } = ctx;
      if (room.phase !== 'reveal') {
        fail(socket, ack, 'INVALID_PHASE', 'Aucune révélation en cours');
        return;
      }
      ok(ack);
      enterDiscussionAndBroadcast(io, room);
    });

    socket.on('player:leave', (_payload, ack) => {
      const ctx = requireCtx(socket, ack);
      if (!ctx) return;
      const { room, player, isSpectator } = ctx;
      socket.leave(room.roomCode);
      socket.data.roomCode = null;
      socket.data.playerId = null;
      ok(ack);
      if (isSpectator) {
        room.spectators.delete(player.playerId);
        broadcastRoomState(io, room);
        return;
      }
      handlePlayerDeparture(io, room, player.playerId, { explicit: true });
    });

    socket.on('disconnect', () => {
      const { roomCode, playerId } = socket.data;
      if (!roomCode || !playerId) return;
      const room = getRoom(roomCode);
      if (!room) return;

      // Spectateur : pas de délai de grâce ni de migration de host (jamais host) — voir
      // §5bis, retiré immédiatement, il pourra re-rejoindre en spectateur s'il revient.
      const spectator = room.spectators.get(playerId);
      if (spectator) {
        if (spectator.socketId !== socket.id) return; // déjà remplacé par une reconnexion
        room.spectators.delete(playerId);
        broadcastRoomState(io, room);
        if (countConnectedPlayers(room) === 0) {
          scheduleEmptyRoomExpiration(room, (code) => deleteRoom(code));
        }
        return;
      }

      const player = room.players.get(playerId);
      if (!player || player.socketId !== socket.id) return; // déjà remplacé par une reconnexion

      registerDisconnect(room, playerId, (r, pid) => handleDisconnectGraceExpired(io, r, pid));
      broadcastRoomState(io, room);

      if (countConnectedPlayers(room) === 0) {
        scheduleEmptyRoomExpiration(room, (code) => deleteRoom(code));
      }
    });
  });
}

/**
 * Termine immédiatement une partie en cours suite au départ volontaire de l'hôte (bouton
 * "Quitter" — voir client/src/components/HostQuitButton.tsx). Contrairement à une
 * déconnexion, il n'y a pas de transfert de host : la partie est terminée pour tout le monde
 * (docs/CONTRACT.md §5). `isHost` reste à true sur le joueur parti pour que les clients restants
 * puissent afficher qui a quitté.
 */
function handleHostAbort(io: IoServer, room: Room, hostPlayerId: string): void {
  const host = room.players.get(hostPlayerId);
  if (host) {
    room.abortedByName = host.name;
    // Le rôle d'hôte passe au joueur suivant : sans ça la room restait bloquée en 'aborted'
    // sans personne pour la ramener au salon.
    migrateHostIfNeeded(room, hostPlayerId);
    host.connected = false;
    host.socketId = null;
  }
  clearRoomTimer(room);
  engine.abortGame(room);
  broadcastRoomState(io, room);
}

/** Gestion commune départ explicite (player:leave) — lobby: retrait; en jeu: élimination. */
function handlePlayerDeparture(
  io: IoServer,
  room: Room,
  playerId: string,
  opts: { explicit: boolean; kicked?: boolean }
): void {
  const player = room.players.get(playerId);
  if (!player) return;
  cancelDisconnectTimer(player);

  if (room.phase === 'lobby') {
    migrateHostIfNeeded(room, playerId);
    room.players.delete(playerId);
    if (room.players.size === 0) {
      deleteRoom(room.roomCode);
      return;
    }
    broadcastRoomState(io, room);
    return;
  }

  // Départ volontaire de l'hôte pendant une partie en cours -> la partie se termine, elle ne
  // continue pas avec un host de secours (cf. déconnexion accidentelle, gérée séparément).
  if (opts.explicit && player.isHost && room.phase !== 'game_over' && room.phase !== 'aborted') {
    handleHostAbort(io, room, playerId);
    return;
  }

  if (room.phase === 'game_over' || room.phase === 'aborted') {
    migrateHostIfNeeded(room, playerId);
    player.connected = false;
    player.socketId = null;
    broadcastRoomState(io, room);
    return;
  }

  migrateHostIfNeeded(room, playerId);
  player.connected = false;
  player.socketId = null;
  player.alive = false;
  applyMidGameDeparture(io, room, playerId, { kicked: opts.kicked });
}

/** Appelé quand le timer de grâce de 3 minutes d'un joueur déconnecté expire. */
function handleDisconnectGraceExpired(io: IoServer, room: Room, playerId: string): void {
  const player = room.players.get(playerId);
  if (player?.isHost) {
    migrateHostIfNeeded(room, playerId);
  }
  const outcome = finalizeDisconnectTimeout(room, playerId);
  if (outcome.outcome === 'reconnected') return;

  if (outcome.outcome === 'removed') {
    if (room.players.size === 0) {
      deleteRoom(room.roomCode);
      return;
    }
    broadcastRoomState(io, room);
    return;
  }

  // 'eliminated'
  applyMidGameDeparture(io, room, playerId);
}

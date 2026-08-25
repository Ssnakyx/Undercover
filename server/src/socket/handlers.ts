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
  ChatMessage,
  GameEndedPayload,
  Player,
  PublicPlayer,
  Room,
  RoomStatePublic,
  RoundResultPayload,
  Winner,
} from '../types.js';
import {
  CHAT_HISTORY_LIMIT,
  MAX_PLAYERS_PER_ROOM,
  cancelEmptyRoomExpiration,
  computeAvatarSeed,
  createRoom,
  deleteRoom,
  generatePlayerId,
  generateSessionToken,
  getRoom,
  scheduleEmptyRoomExpiration,
} from '../rooms/roomStore.js';
import {
  attemptRejoin,
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
import { getAllPairs } from '../content/pairsStore.js';

type IoServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type IoSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

const NAME_MAX_LENGTH = 24;
const CHAT_MESSAGE_MAX_LENGTH = 300;

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
  };
}

function toPublicState(room: Room): RoomStatePublic {
  return {
    roomCode: room.roomCode,
    universe: room.universe,
    phase: room.phase,
    players: engine.playersInJoinOrder(room).map(toPublicPlayer),
    settings: { ...room.settings },
    round: room.round,
    turnOrder: [...room.turnOrder],
    votedPlayerIds: room.votes.map((v) => v.voterId),
    phaseDeadline: room.phaseDeadline,
  };
}

function broadcastRoomState(io: IoServer, room: Room): void {
  io.to(room.roomCode).emit('room:state', toPublicState(room));
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
  engine.enterDiscussion(room);
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
  engine.enterGameOver(room);
  clearRoomTimer(room);
  const reveal = engine.buildGameEndedReveal(room);
  broadcastRoomState(io, room);
  const payload: GameEndedPayload = { winner, reveal };
  io.to(room.roomCode).emit('game:ended', payload);
}

/**
 * Départ hors du flux de vote normal (déconnexion expirée ou player:leave en cours de
 * partie). Émet un round:result "ciblé" pour révéler le rôle du seul joueur qui part (règle
 * explicite CONTRACT.md §5 : "marqué éliminé (rôle révélé)"), puis réconcilie l'état de jeu
 * (ordre des tours / fenêtre mrwhite_guess / conditions de victoire).
 */
function applyMidGameDeparture(io: IoServer, room: Room, playerId: string): void {
  const player = room.players.get(playerId);
  if (!player) return;

  // Forfait immédiat du vote bonus "Revenant" si ce joueur partait avec un vote en attente —
  // no-op si déjà false. Départs et déconnexions ne déclenchent jamais les réactions spéciales
  // post-élimination (Amoureux/Bouffon/Chasseur), voir CONTRACT.md, règle unificatrice.
  player.ghostVoteAvailable = false;

  const revealPayload: RoundResultPayload = {
    eliminatedPlayerId: playerId,
    eliminatedRole: player.role ?? 'civil', // rôle toujours assigné hors phase lobby
    eliminatedChampion: room.settings.revealChampionOnElimination ? player.champion : null,
    voteCounts: {},
    tie: false,
  };
  io.to(room.roomCode).emit('round:result', revealPayload);

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
}

/** Récupère la room + le joueur associés au socket courant, ou signale l'erreur. */
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
  if (!player) {
    fail(socket, ack, 'PLAYER_NOT_FOUND', 'Joueur introuvable dans cette room');
    return null;
  }
  return { room, player };
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
      if (payload?.universe !== 'lol' && payload?.universe !== 'smash' && payload?.universe !== 'pokemon') {
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
        joinOrder: 0,
        disconnectedAt: null,
        disconnectTimer: null,
        loverPlayerId: null,
        spyInsightPlayerId: null,
        protectUsedThisGame: false,
        ghostVoteAvailable: false,
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
        joinOrder: room.players.size,
        disconnectedAt: null,
        disconnectTimer: null,
        loverPlayerId: null,
        spyInsightPlayerId: null,
        protectUsedThisGame: false,
        ghostVoteAvailable: false,
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

      room.settings = next;
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
        engine.assignRolesAndEnterReveal(room, { pairsPool: getAllPairs(room.universe) });
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
        engine.enterDiscussion(room);
        broadcastRoomState(io, room);
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
        engine.roundContinue(room);
      } catch (err) {
        reportEngineError(socket, ack, err, 'CONTINUE_FAILED');
        return;
      }
      ok(ack);
      broadcastRoomState(io, room);
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
      try {
        engine.assignRolesAndEnterReveal(room, { pairsPool: getAllPairs(room.universe) });
      } catch (err) {
        reportEngineError(socket, ack, err, 'RESTART_FAILED');
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

    socket.on('player:leave', (_payload, ack) => {
      const ctx = requireCtx(socket, ack);
      if (!ctx) return;
      const { room, player } = ctx;
      socket.leave(room.roomCode);
      socket.data.roomCode = null;
      socket.data.playerId = null;
      ok(ack);
      handlePlayerDeparture(io, room, player.playerId, { explicit: true });
    });

    socket.on('disconnect', () => {
      const { roomCode, playerId } = socket.data;
      if (!roomCode || !playerId) return;
      const room = getRoom(roomCode);
      if (!room) return;
      const player = room.players.get(playerId);
      if (!player || player.socketId !== socket.id) return; // déjà remplacé par une reconnexion

      registerDisconnect(room, playerId, (r, pid) => handleDisconnectGraceExpired(io, r, pid));
      broadcastRoomState(io, room);

      const stillConnected = [...room.players.values()].some((p) => p.connected);
      if (!stillConnected) {
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
  opts: { explicit: boolean }
): void {
  const player = room.players.get(playerId);
  if (!player) return;

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
  applyMidGameDeparture(io, room, playerId);
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

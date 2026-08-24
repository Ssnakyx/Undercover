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
import type {
  GameEndedPayload,
  Player,
  PublicPlayer,
  Room,
  RoomStatePublic,
  RoundResultPayload,
  Winner,
} from '../types.js';
import {
  MAX_PLAYERS_PER_ROOM,
  cancelEmptyRoomExpiration,
  computeAvatarSeed,
  createRoom,
  deleteRoom,
  generatePlayerId,
  generateSessionToken,
  getAllRooms,
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
  addPair,
  getAllPairs,
  getPairById,
  removePair,
  togglePair,
} from '../content/pairsStore.js';

type IoServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type IoSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

const NAME_MAX_LENGTH = 24;

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
    phase: room.phase,
    players: engine.playersInJoinOrder(room).map(toPublicPlayer),
    settings: { ...room.settings },
    pairs: getAllPairs(),
    round: room.round,
    turnOrder: [...room.turnOrder],
    votedPlayerIds: room.votes.map((v) => v.voterId),
    phaseDeadline: room.phaseDeadline,
  };
}

function broadcastRoomState(io: IoServer, room: Room): void {
  io.to(room.roomCode).emit('room:state', toPublicState(room));
}

/** Diffuse la liste de paires à jour à TOUTES les rooms actives (état global partagé, §7). */
function broadcastPairsToAllRooms(io: IoServer): void {
  for (const room of getAllRooms()) {
    broadcastRoomState(io, room);
  }
}

function sendRolePrivate(io: IoServer, player: Player): void {
  if (!player.socketId || !player.role) return;
  io.to(player.socketId).emit('role:private', { role: player.role, champion: player.champion });
}

function sendRolePrivateToAllConnected(io: IoServer, room: Room): void {
  for (const player of room.players.values()) {
    sendRolePrivate(io, player);
  }
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

function onRevealTimeout(io: IoServer, room: Room): void {
  if (room.phase !== 'reveal') return;
  engine.enterDiscussion(room);
  broadcastRoomState(io, room);
}

/** Dépouille les votes et enchaîne (mrwhite_guess ou fin de partie éventuelle). */
function finishVoting(io: IoServer, room: Room): void {
  const { result, winner, enterMrWhiteGuess } = engine.tallyVotesAndEliminate(room);
  clearRoomTimer(room);
  io.to(room.roomCode).emit('round:result', result);
  broadcastRoomState(io, room);

  if (enterMrWhiteGuess) {
    engine.enterMrWhiteGuess(room);
    broadcastRoomState(io, room);
    scheduleMrWhiteGuessTimeout(io, room);
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
      const room = createRoom();
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
      };
      room.players.set(playerId, player);
      socket.join(room.roomCode);
      socket.data.roomCode = room.roomCode;
      socket.data.playerId = playerId;

      ack({ ok: true, roomCode: room.roomCode, playerId, sessionToken });
      broadcastRoomState(io, room);
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
      };
      room.players.set(playerId, player);
      socket.join(room.roomCode);
      socket.data.roomCode = room.roomCode;
      socket.data.playerId = playerId;
      cancelEmptyRoomExpiration(room);

      ack({ ok: true, playerId, sessionToken });
      broadcastRoomState(io, room);
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
      if (result.shouldResendRolePrivate) {
        sendRolePrivate(io, result.player);
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

      if (typeof next.mrWhiteEnabled !== 'boolean') {
        fail(socket, ack, 'INVALID_SETTINGS', 'mrWhiteEnabled doit être un booléen');
        return;
      }
      if (next.mrWhiteEnabled && room.players.size < 5) {
        fail(socket, ack, 'INVALID_SETTINGS', 'Mr White nécessite au moins 5 joueurs');
        return;
      }
      if (typeof next.revealChampionOnElimination !== 'boolean') {
        fail(socket, ack, 'INVALID_SETTINGS', 'revealChampionOnElimination doit être un booléen');
        return;
      }
      if (next.selectedPairId !== null && !getPairById(next.selectedPairId)) {
        fail(socket, ack, 'PAIR_NOT_FOUND', 'selectedPairId invalide');
        return;
      }

      room.settings = next;
      ok(ack);
      broadcastRoomState(io, room);
    });

    socket.on('pairs:add', (payload, ack) => {
      const ctx = requireCtx(socket, ack);
      if (!ctx) return;
      if (!requireHost(socket, ctx, ack)) return;
      const champA = (payload?.champA ?? '').toString().trim();
      const champB = (payload?.champB ?? '').toString().trim();
      const theme = (payload?.theme ?? '').toString().trim();
      if (!champA || !champB || !theme) {
        fail(socket, ack, 'INVALID_PAIR', 'champA, champB et theme sont requis');
        return;
      }
      addPair({ champA, champB, theme });
      ok(ack);
      broadcastPairsToAllRooms(io);
    });

    socket.on('pairs:toggle', (payload, ack) => {
      const ctx = requireCtx(socket, ack);
      if (!ctx) return;
      if (!requireHost(socket, ctx, ack)) return;
      const updated = togglePair(payload?.pairId, Boolean(payload?.enabled));
      if (!updated) {
        fail(socket, ack, 'PAIR_NOT_FOUND', 'Paire introuvable');
        return;
      }
      ok(ack);
      broadcastPairsToAllRooms(io);
    });

    socket.on('pairs:remove', (payload, ack) => {
      const ctx = requireCtx(socket, ack);
      if (!ctx) return;
      if (!requireHost(socket, ctx, ack)) return;
      const result = removePair(payload?.pairId);
      if (!result.ok) {
        const code = result.reason === 'NOT_CUSTOM' ? 'CANNOT_REMOVE_BASE_PAIR' : 'PAIR_NOT_FOUND';
        fail(socket, ack, code, 'Impossible de retirer cette paire');
        return;
      }
      ok(ack);
      broadcastPairsToAllRooms(io);
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
        engine.assignRolesAndEnterReveal(room, { pairsPool: getAllPairs() });
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
      if (room.phase !== 'game_over') {
        fail(socket, ack, 'INVALID_PHASE', 'game:restart uniquement valide en phase game_over');
        return;
      }
      try {
        engine.assignRolesAndEnterReveal(room, { pairsPool: getAllPairs() });
      } catch (err) {
        reportEngineError(socket, ack, err, 'RESTART_FAILED');
        return;
      }
      ok(ack);
      sendRolePrivateToAllConnected(io, room);
      broadcastRoomState(io, room);
      scheduleRevealTimeout(io, room);
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

/** Gestion commune départ explicite (player:leave) — lobby: retrait; en jeu: élimination. */
function handlePlayerDeparture(
  io: IoServer,
  room: Room,
  playerId: string,
  _opts: { explicit: boolean }
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

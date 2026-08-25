// Logique de rejoin par playerId+sessionToken, migration de host, timers de déconnexion.
// Voir docs/CONTRACT.md section 5.
//
// Ce module ne connaît pas Socket.io : les fonctions ci-dessous mutent l'objet Room /
// Player et retournent un résultat descriptif ; c'est l'appelant (socket/handlers.ts) qui
// diffuse les événements et programme réellement les setTimeout. Ça permet de tester toute
// la logique de reconnexion sans serveur socket réel (test/reconnection.test.ts).

import type { Player, Room } from '../types.js';
import { DISCONNECT_TIMEOUT_MS } from './roomStore.js';

export type RejoinFailureCode = 'ROOM_NOT_FOUND' | 'INVALID_SESSION';

export interface RejoinSuccess {
  ok: true;
  player: Player;
  /** true si la partie est en cours (phase >= reveal) : le serveur doit renvoyer role:private. */
  shouldResendRolePrivate: boolean;
}
export interface RejoinFailure {
  ok: false;
  code: RejoinFailureCode;
  message: string;
}

const PHASES_WITH_ROLE = new Set([
  'reveal',
  'discussion',
  'voting',
  'round_result',
  'mrwhite_guess',
  'hunter_shoot',
  'game_over',
]);

/**
 * Vérifie playerId+sessionToken et rebranche le socket sur le siège existant.
 * `room` peut être undefined (room inconnue/expirée) -> ROOM_NOT_FOUND.
 */
export function attemptRejoin(
  room: Room | undefined,
  payload: { playerId: string; sessionToken: string },
  newSocketId: string
): RejoinSuccess | RejoinFailure {
  if (!room) {
    return { ok: false, code: 'ROOM_NOT_FOUND', message: 'Room introuvable ou expirée' };
  }
  const player = room.players.get(payload.playerId);
  if (!player || player.sessionToken !== payload.sessionToken) {
    return { ok: false, code: 'INVALID_SESSION', message: 'Session invalide ou expirée' };
  }

  cancelDisconnectTimer(player);
  player.socketId = newSocketId;
  player.connected = true;
  player.disconnectedAt = null;

  return {
    ok: true,
    player,
    shouldResendRolePrivate: PHASES_WITH_ROLE.has(room.phase),
  };
}

/** Le joueur suivant par ordre d'arrivée parmi les joueurs connectés (pour migration de host). */
export function findNextHostCandidate(room: Room, excludePlayerId?: string): Player | null {
  const candidates = [...room.players.values()]
    .filter((p) => p.connected && p.playerId !== excludePlayerId)
    .sort((a, b) => a.joinOrder - b.joinOrder);
  return candidates[0] ?? null;
}

export interface HostMigrationResult {
  migrated: boolean;
  newHostPlayerId: string | null;
}

/**
 * Si le joueur qui vient de perdre sa connexion (ou de quitter) était host, transfère le rôle
 * au joueur connecté suivant par ordre d'arrivée. "Host quitte/déconnecte : rôle transféré
 * automatiquement au joueur connecté suivant." — appliqué immédiatement, sans attendre le
 * délai de grâce de 3 minutes (décision de conception : la room a besoin d'un host actif en
 * permanence pour que la partie puisse progresser, ex: round:continue).
 */
export function migrateHostIfNeeded(room: Room, departingPlayerId: string): HostMigrationResult {
  const departing = room.players.get(departingPlayerId);
  if (!departing || !departing.isHost) return { migrated: false, newHostPlayerId: null };

  const next = findNextHostCandidate(room, departingPlayerId);
  if (!next) {
    // Personne d'autre n'est connecté : on laisse le flag isHost tel quel (il repartira au
    // prochain reconnect, ou la room expirera si personne ne revient).
    return { migrated: false, newHostPlayerId: null };
  }
  departing.isHost = false;
  next.isHost = true;
  return { migrated: true, newHostPlayerId: next.playerId };
}

/** Marque un joueur déconnecté et programme son timer de grâce de 3 minutes. */
export function registerDisconnect(
  room: Room,
  playerId: string,
  onGraceExpired: (room: Room, playerId: string) => void
): HostMigrationResult {
  const player = room.players.get(playerId);
  if (!player) return { migrated: false, newHostPlayerId: null };

  player.connected = false;
  player.socketId = null;
  player.disconnectedAt = Date.now();

  cancelDisconnectTimer(player);
  player.disconnectTimer = setTimeout(() => {
    onGraceExpired(room, playerId);
  }, DISCONNECT_TIMEOUT_MS);
  player.disconnectTimer.unref?.();

  return migrateHostIfNeeded(room, playerId);
}

export function cancelDisconnectTimer(player: Player): void {
  if (player.disconnectTimer) {
    clearTimeout(player.disconnectTimer);
    player.disconnectTimer = null;
  }
}

export type DisconnectGraceOutcome =
  | { outcome: 'reconnected' } // le joueur est revenu avant l'expiration, rien à faire
  | { outcome: 'removed'; player: Player } // en lobby : retiré de la room
  | { outcome: 'eliminated'; player: Player }; // en jeu : marqué éliminé (rôle révélé)

/**
 * Appelé quand le timer de grâce de 3 minutes expire (ou directement par les tests). Si le
 * joueur s'est reconnecté entre-temps (connected === true), ne fait rien. Sinon : retiré si
 * en lobby, marqué éliminé si une partie est en cours.
 */
export function finalizeDisconnectTimeout(room: Room, playerId: string): DisconnectGraceOutcome {
  const player = room.players.get(playerId);
  if (!player) return { outcome: 'reconnected' }; // déjà retiré autrement
  if (player.connected) return { outcome: 'reconnected' };

  cancelDisconnectTimer(player);

  if (room.phase === 'lobby') {
    room.players.delete(playerId);
    return { outcome: 'removed', player };
  }

  player.alive = false;
  return { outcome: 'eliminated', player };
}

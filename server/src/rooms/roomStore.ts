// Map<roomCode, Room>, génération de code, expiration, création/suppression.
// Voir docs/CONTRACT.md section 5.

import { randomUUID } from 'node:crypto';
import type { Room, RoomSettings, Universe } from '../types.js';

// "Code de room : 5 caractères, alphabet ABCDEFGHJKMNPQRSTUVWXYZ23456789 (sans 0/O/1/I)"
const ROOM_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const ROOM_CODE_LENGTH = 5;
export const MAX_PLAYERS_PER_ROOM = 12;
export const EMPTY_ROOM_EXPIRATION_MS = 5 * 60 * 1000; // 5 minutes
export const DISCONNECT_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes
export const CHAT_HISTORY_LIMIT = 50; // tampon en mémoire, pas d'archivage long terme

const rooms = new Map<string, Room>();

export function defaultRoomSettings(): RoomSettings {
  return {
    mrWhiteEnabled: false,
    revealChampionOnElimination: false,
    spyEnabled: false,
    loversEnabled: false,
    protectorEnabled: false,
    ghostEnabled: false,
    jesterEnabled: false,
    hunterEnabled: false,
    customPairsEnabled: false,
  };
}

export const MAX_CUSTOM_PAIRS_PER_ROOM = 30;
export const MAX_SPECTATORS_PER_ROOM = 20;

function generateRoomCodeCandidate(): string {
  let code = '';
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += ROOM_CODE_ALPHABET[Math.floor(Math.random() * ROOM_CODE_ALPHABET.length)];
  }
  return code;
}

/** Génère un code de room unique parmi les rooms actives. */
export function generateUniqueRoomCode(): string {
  let code = generateRoomCodeCandidate();
  let attempts = 0;
  while (rooms.has(code) && attempts < 1000) {
    code = generateRoomCodeCandidate();
    attempts++;
  }
  if (rooms.has(code)) {
    // Filet de sécurité théorique (espace de 32^5 ≈ 33M codes) — n'arrivera jamais en pratique.
    throw new Error('Impossible de générer un code de room unique');
  }
  return code;
}

export function createRoom(universe: Universe = 'lol'): Room {
  const roomCode = generateUniqueRoomCode();
  const room: Room = {
    roomCode,
    createdAt: Date.now(),
    universe,
    phase: 'lobby',
    settings: defaultRoomSettings(),
    players: new Map(),
    spectators: new Map(),
    customPairs: [],
    round: 0,
    turnOrder: [],
    votes: [],
    lastRoundResult: null,
    mrWhiteGuessPlayerId: null,
    hunterShootPlayerId: null,
    protectorPendingTargetId: null,
    phaseDeadline: null,
    phaseTimer: null,
    emptyRoomTimer: null,
    currentPairId: null,
    championA: null,
    championB: null,
    chatMessages: [],
  };
  rooms.set(roomCode, room);
  return room;
}

export function getRoom(roomCode: string): Room | undefined {
  return rooms.get(roomCode.toUpperCase());
}

export function deleteRoom(roomCode: string): void {
  const room = rooms.get(roomCode);
  if (room) {
    if (room.phaseTimer) clearTimeout(room.phaseTimer);
    if (room.emptyRoomTimer) clearTimeout(room.emptyRoomTimer);
  }
  rooms.delete(roomCode);
}

export function generateSessionToken(): string {
  return randomUUID();
}

export function generatePlayerId(): string {
  return randomUUID();
}

/** Hash déterministe simple (FNV-1a) du playerId, pour avatarSeed — voir contrat PublicPlayer. */
export function computeAvatarSeed(playerId: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < playerId.length; i++) {
    hash ^= playerId.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/** Nombre de sockets actuellement connectés dans la room (joueurs + spectateurs — un
 * spectateur seul connecté doit lui aussi empêcher l'expiration de la room vide). */
export function countConnectedPlayers(room: Room): number {
  let count = 0;
  for (const player of room.players.values()) {
    if (player.connected) count++;
  }
  for (const spectator of room.spectators.values()) {
    if (spectator.connected) count++;
  }
  return count;
}

/** Planifie la destruction de la room si elle reste vide (0 socket connecté) 5 minutes. */
export function scheduleEmptyRoomExpiration(room: Room, onExpire: (roomCode: string) => void): void {
  cancelEmptyRoomExpiration(room);
  room.emptyRoomTimer = setTimeout(() => {
    if (countConnectedPlayers(room) === 0) {
      onExpire(room.roomCode);
    }
  }, EMPTY_ROOM_EXPIRATION_MS);
  room.emptyRoomTimer.unref?.();
}

export function cancelEmptyRoomExpiration(room: Room): void {
  if (room.emptyRoomTimer) {
    clearTimeout(room.emptyRoomTimer);
    room.emptyRoomTimer = null;
  }
}

/** Toutes les rooms actives du process — utilisé pour diffuser les changements d'état global
 * partagé (ex: liste de paires §7) à toutes les rooms, pas seulement à celle d'origine. */
export function getAllRooms(): Room[] {
  return [...rooms.values()];
}

/** Utilitaire de test uniquement : vide le store global de rooms. */
export function _resetRoomStoreForTests(): void {
  for (const room of rooms.values()) {
    if (room.phaseTimer) clearTimeout(room.phaseTimer);
    if (room.emptyRoomTimer) clearTimeout(room.emptyRoomTimer);
  }
  rooms.clear();
}

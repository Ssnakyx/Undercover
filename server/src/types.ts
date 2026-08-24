// Types partagés — dupliqués fidèlement depuis docs/CONTRACT.md section 2 et 6.
// Ce fichier est la source de vérité LOCALE au serveur. Le client maintient sa propre
// copie identique (voir contrat : "pas de package partagé à builder").

// ---------------------------------------------------------------------------
// Section 2 — modèle de rôles
// ---------------------------------------------------------------------------

export type Role = 'civil' | 'undercover' | 'mrwhite';

export interface PlayerRole {
  playerId: string;
  role: Role;
  champion: string | null; // null uniquement pour mrwhite
}

// ---------------------------------------------------------------------------
// Section 6 — types partagés socket
// ---------------------------------------------------------------------------

/**
 * Univers de contenu choisi au menu principal — même moteur de jeu, deux pools de paires
 * indépendants (voir content/pairsStore.ts). 'lol' = League of Legends, 'smash' = Super
 * Smash Bros Ultimate. Aucun asset visuel officiel dans les deux cas (CONTRACT.md §0).
 */
export type Universe = 'lol' | 'smash';

export interface ChampionPair {
  id: string;
  champA: string;
  champB: string;
  theme: string; // ex: "Tanks brutaux", "Duo assassins mêlée"
  lanes?: string[]; // ex: ["Top"], optionnel
}

export interface RoomSettings {
  mrWhiteEnabled: boolean;
  revealChampionOnElimination: boolean;
}

export type GamePhase =
  | 'lobby'
  | 'reveal'
  | 'discussion'
  | 'voting'
  | 'round_result'
  | 'mrwhite_guess'
  | 'game_over'
  | 'aborted'; // hôte a quitté explicitement une partie en cours (voir CONTRACT.md §5)

export interface PublicPlayer {
  playerId: string;
  name: string;
  isHost: boolean;
  connected: boolean;
  alive: boolean;
  avatarSeed: string; // déterministe (hash du playerId), pour silhouette/couleur custom
}

export interface RoomStatePublic {
  roomCode: string;
  universe: Universe;
  phase: GamePhase;
  players: PublicPlayer[];
  settings: RoomSettings;
  round: number;
  turnOrder: string[]; // playerIds, ordre d'affichage indicatif (phase discussion)
  votedPlayerIds: string[]; // qui a voté (pas pour qui), phase voting
  phaseDeadline: number | null; // epoch ms, pour le compte à rebours client (reveal / mrwhite_guess uniquement)
}

// ---- Client -> Serveur (payloads) ----

export interface RoomCreatePayload {
  hostName: string;
  universe: Universe;
}
export interface RoomCreateAck {
  ok: boolean;
  roomCode?: string;
  playerId?: string;
  sessionToken?: string;
  error?: { code: string; message: string };
}

export interface RoomJoinPayload {
  roomCode: string;
  playerName: string;
}
export interface RoomJoinAck {
  ok: boolean;
  playerId?: string;
  sessionToken?: string;
  error?: { code: string; message: string };
}

export interface RoomRejoinPayload {
  roomCode: string;
  playerId: string;
  sessionToken: string;
}
export interface RoomRejoinAck {
  ok: boolean;
  error?: { code: string; message: string };
}

export interface SettingsUpdatePayload {
  settings: Partial<RoomSettings>;
}

export interface VoteSubmitPayload {
  targetPlayerId: string;
}

export interface MrWhiteGuessPayload {
  championGuess: string;
}

export interface AckResponse {
  ok: boolean;
  error?: { code: string; message: string };
}

// ---- Serveur -> Client(s) ----

export interface RolePrivatePayload {
  role: Role;
  champion: string | null;
}

export interface RoundResultPayload {
  eliminatedPlayerId: string | null; // null si égalité = personne éliminé
  eliminatedRole: Role | null;
  eliminatedChampion: string | null; // selon settings.revealChampionOnElimination, sinon null
  voteCounts: Record<string, number>;
  tie: boolean;
}

export type Winner = 'civils' | 'undercover' | 'mrwhite';

export interface GameEndedPayload {
  winner: Winner;
  reveal: { playerId: string; name: string; role: Role; champion: string | null }[];
}

export interface ErrorPayload {
  code: string;
  message: string;
}

// ---------------------------------------------------------------------------
// Types internes serveur (pas exposés tels quels au client)
// ---------------------------------------------------------------------------

export interface Player {
  playerId: string;
  sessionToken: string;
  name: string;
  isHost: boolean;
  connected: boolean;
  alive: boolean;
  avatarSeed: string;
  socketId: string | null;
  role: Role | null;
  champion: string | null;
  hasAckedReveal: boolean;
  joinOrder: number;
  disconnectedAt: number | null; // epoch ms, pour le timer 3 minutes
  disconnectTimer: NodeJS.Timeout | null;
}

export interface VoteRecord {
  voterId: string;
  targetPlayerId: string;
}

export interface Room {
  roomCode: string;
  createdAt: number;
  universe: Universe;
  phase: GamePhase;
  settings: RoomSettings;
  players: Map<string, Player>; // playerId -> Player, ordre non garanti (utiliser joinOrder)
  round: number;
  turnOrder: string[]; // playerIds vivants, ordre d'affichage indicatif (phase discussion)
  votes: VoteRecord[];
  lastRoundResult: RoundResultPayload | null;
  mrWhiteGuessPlayerId: string | null; // qui a le droit de deviner
  phaseDeadline: number | null;
  phaseTimer: NodeJS.Timeout | null;
  emptyRoomTimer: NodeJS.Timeout | null;
  currentPairId: string | null; // paire tirée pour la partie en cours
  championA: string | null;
  championB: string | null;
}

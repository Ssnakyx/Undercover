// Types partagés — dupliqués fidèlement depuis docs/CONTRACT.md section 2 et 6
// (miroir de server/src/types.ts). Pas de package partagé : voir CONTRACT.md §1.

// civil/undercover/mrwhite : rôles historiques. spy/protector/ghost/hunter sont des variantes
// du camp civils, jester est une faction solo à part (voir server/src/types.ts pour le détail).
export type Role = 'civil' | 'undercover' | 'mrwhite' | 'spy' | 'protector' | 'ghost' | 'jester' | 'hunter';

// Univers de contenu choisi au menu principal — même moteur de jeu, trois pools de paires
// indépendants. Aucun asset visuel officiel dans les trois cas (CONTRACT.md §0).
export type Universe = 'lol' | 'smash' | 'pokemon';

export interface RoomSettings {
  mrWhiteEnabled: boolean;
  revealChampionOnElimination: boolean;
  spyEnabled: boolean;
  loversEnabled: boolean;
  protectorEnabled: boolean;
  ghostEnabled: boolean;
  jesterEnabled: boolean;
  hunterEnabled: boolean;
  customPairsEnabled: boolean;
}

export interface ChampionPair {
  id: string;
  champA: string;
  champB: string;
  theme: string;
}

export type GamePhase =
  | 'lobby'
  | 'reveal'
  | 'discussion'
  | 'voting'
  | 'round_result'
  | 'mrwhite_guess'
  | 'hunter_shoot'
  | 'game_over'
  | 'aborted'; // hôte a quitté explicitement une partie en cours (voir CONTRACT.md §5)

export interface PublicPlayer {
  playerId: string;
  name: string;
  isHost: boolean;
  connected: boolean;
  alive: boolean;
  avatarSeed: string;
}

/** Spectateur : rejoint une partie déjà en cours en lecture seule, promu joueur complet au
 * prochain game:restart. Jamais dans `RoomStatePublic.players`. */
export interface PublicSpectator {
  playerId: string;
  name: string;
  avatarSeed: string;
}

export interface RoomStatePublic {
  roomCode: string;
  universe: Universe;
  phase: GamePhase;
  players: PublicPlayer[];
  spectators: PublicSpectator[];
  settings: RoomSettings;
  round: number;
  turnOrder: string[];
  votedPlayerIds: string[];
  phaseDeadline: number | null;
  customPairs: ChampionPair[];
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

export interface ChatSendPayload {
  text: string;
}

export interface MrWhiteGuessPayload {
  championGuess: string;
}

export interface HunterShootPayload {
  targetPlayerId: string | null; // null = le Chasseur choisit de ne tirer sur personne
}

export interface ProtectorProtectPayload {
  targetPlayerId: string;
}

export interface CustomPairAddPayload {
  champA: string;
  champB: string;
  theme?: string;
}

export interface CustomPairRemovePayload {
  id: string;
}

export interface SpectatorJoinPayload {
  roomCode: string;
  playerName: string;
}
export interface SpectatorJoinAck {
  ok: boolean;
  playerId?: string;
  sessionToken?: string;
  error?: { code: string; message: string };
}

export interface AckResponse {
  ok: boolean;
  error?: { code: string; message: string };
}

// ---- Serveur -> Client(s) ----

export interface RolePrivatePayload {
  role: Role;
  champion: string | null;
  loverName?: string | null;
  spyInsight?: { playerName: string; team: 'civils' | 'undercover' | 'mrwhite' | 'jester' };
}

export interface RoundResultPayload {
  eliminatedPlayerId: string | null; // null si égalité = personne éliminé
  eliminatedRole: Role | null;
  eliminatedChampion: string | null;
  voteCounts: Record<string, number>;
  tie: boolean;
  protectedThisRound?: boolean;
  chainEliminatedPlayerId?: string | null;
  chainEliminatedRole?: Role | null;
  chainEliminatedChampion?: string | null;
  hunterDeclined?: boolean;
}

export type Winner = 'civils' | 'undercover' | 'mrwhite' | 'jester';

export interface GameEndedPayload {
  winner: Winner;
  reveal: { playerId: string; name: string; role: Role; champion: string | null; loverPlayerId?: string | null }[];
}

export interface ErrorPayload {
  code: string;
  message: string;
}

export interface ChatMessage {
  id: string;
  playerId: string;
  name: string;
  text: string;
  ts: number;
}

// ---- Événements socket (miroir de server/src/socket/events.ts) ----

export interface ClientToServerEvents {
  'room:create': (payload: RoomCreatePayload, ack: (res: RoomCreateAck) => void) => void;
  'room:join': (payload: RoomJoinPayload, ack: (res: RoomJoinAck) => void) => void;
  'room:joinSpectator': (payload: SpectatorJoinPayload, ack: (res: SpectatorJoinAck) => void) => void;
  'room:rejoin': (payload: RoomRejoinPayload, ack: (res: RoomRejoinAck) => void) => void;
  'settings:update': (payload: SettingsUpdatePayload, ack?: (res: AckResponse) => void) => void;
  'custom:addPair': (payload: CustomPairAddPayload, ack?: (res: AckResponse) => void) => void;
  'custom:removePair': (payload: CustomPairRemovePayload, ack?: (res: AckResponse) => void) => void;
  'game:start': (payload: Record<string, never>, ack?: (res: AckResponse) => void) => void;
  'reveal:ack': (payload: Record<string, never>, ack?: (res: AckResponse) => void) => void;
  'round:startVoting': (payload: Record<string, never>, ack?: (res: AckResponse) => void) => void;
  'vote:submit': (payload: VoteSubmitPayload, ack?: (res: AckResponse) => void) => void;
  'protector:protect': (payload: ProtectorProtectPayload, ack?: (res: AckResponse) => void) => void;
  'mrwhite:guess': (payload: MrWhiteGuessPayload, ack?: (res: AckResponse) => void) => void;
  'hunter:shoot': (payload: HunterShootPayload, ack?: (res: AckResponse) => void) => void;
  'round:continue': (payload: Record<string, never>, ack?: (res: AckResponse) => void) => void;
  'game:restart': (payload: Record<string, never>, ack?: (res: AckResponse) => void) => void;
  'player:leave': (payload: Record<string, never>, ack?: (res: AckResponse) => void) => void;
  'chat:send': (payload: ChatSendPayload, ack?: (res: AckResponse) => void) => void;
}

export interface ServerToClientEvents {
  'room:state': (state: RoomStatePublic) => void;
  'role:private': (payload: RolePrivatePayload) => void;
  'round:result': (payload: RoundResultPayload) => void;
  'game:ended': (payload: GameEndedPayload) => void;
  'chat:message': (payload: ChatMessage) => void;
  'chat:history': (payload: ChatMessage[]) => void;
  error: (payload: ErrorPayload) => void;
}

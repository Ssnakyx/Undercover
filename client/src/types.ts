// Types partagés — dupliqués fidèlement depuis docs/CONTRACT.md section 2 et 6
// (miroir de server/src/types.ts). Pas de package partagé : voir CONTRACT.md §1.

export type Role = 'civil' | 'undercover' | 'mrwhite';

export interface ChampionPair {
  id: string;
  champA: string;
  champB: string;
  theme: string;
  lanes?: string[];
  enabled: boolean;
  isCustom: boolean;
}

export interface RoomSettings {
  mrWhiteEnabled: boolean;
  revealChampionOnElimination: boolean;
  selectedPairId: string | null;
}

export type GamePhase =
  | 'lobby'
  | 'reveal'
  | 'clues'
  | 'round_result'
  | 'mrwhite_guess'
  | 'game_over';

export interface PublicPlayer {
  playerId: string;
  name: string;
  isHost: boolean;
  connected: boolean;
  alive: boolean;
  avatarSeed: string;
}

export interface RoomStatePublic {
  roomCode: string;
  phase: GamePhase;
  players: PublicPlayer[];
  settings: RoomSettings;
  pairs: ChampionPair[];
  round: number;
  turnOrder: string[];
  currentTurnPlayerId: string | null; // null = tous les indices du round sont donnés
  clues: { playerId: string; text: string }[];
  phaseDeadline: number | null;
}

// ---- Client -> Serveur (payloads) ----

export interface RoomCreatePayload {
  hostName: string;
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

export interface PairsAddPayload {
  champA: string;
  champB: string;
  theme: string;
}

export interface PairsTogglePayload {
  pairId: string;
  enabled: boolean;
}

export interface PairsRemovePayload {
  pairId: string;
}

export interface ClueSubmitPayload {
  text: string;
}

export interface PlayerEliminatePayload {
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
  eliminatedPlayerId: string;
  eliminatedRole: Role;
  eliminatedChampion: string | null;
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

// ---- Événements socket (miroir de server/src/socket/events.ts) ----

export interface ClientToServerEvents {
  'room:create': (payload: RoomCreatePayload, ack: (res: RoomCreateAck) => void) => void;
  'room:join': (payload: RoomJoinPayload, ack: (res: RoomJoinAck) => void) => void;
  'room:rejoin': (payload: RoomRejoinPayload, ack: (res: RoomRejoinAck) => void) => void;
  'settings:update': (payload: SettingsUpdatePayload, ack?: (res: AckResponse) => void) => void;
  'pairs:add': (payload: PairsAddPayload, ack?: (res: AckResponse) => void) => void;
  'pairs:toggle': (payload: PairsTogglePayload, ack?: (res: AckResponse) => void) => void;
  'pairs:remove': (payload: PairsRemovePayload, ack?: (res: AckResponse) => void) => void;
  'game:start': (payload: Record<string, never>, ack?: (res: AckResponse) => void) => void;
  'reveal:ack': (payload: Record<string, never>, ack?: (res: AckResponse) => void) => void;
  'clue:submit': (payload: ClueSubmitPayload, ack?: (res: AckResponse) => void) => void;
  'player:eliminate': (payload: PlayerEliminatePayload, ack?: (res: AckResponse) => void) => void;
  'mrwhite:guess': (payload: MrWhiteGuessPayload, ack?: (res: AckResponse) => void) => void;
  'round:continue': (payload: Record<string, never>, ack?: (res: AckResponse) => void) => void;
  'game:restart': (payload: Record<string, never>, ack?: (res: AckResponse) => void) => void;
  'player:leave': (payload: Record<string, never>, ack?: (res: AckResponse) => void) => void;
}

export interface ServerToClientEvents {
  'room:state': (state: RoomStatePublic) => void;
  'role:private': (payload: RolePrivatePayload) => void;
  'round:result': (payload: RoundResultPayload) => void;
  'game:ended': (payload: GameEndedPayload) => void;
  error: (payload: ErrorPayload) => void;
}

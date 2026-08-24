// Typage strict des événements Socket.io — miroir exact de docs/CONTRACT.md section 6.
// Sert à la fois de documentation vivante et de garde-fou compile-time pour handlers.ts.

import type {
  AckResponse,
  ChatMessage,
  ChatSendPayload,
  GameEndedPayload,
  MrWhiteGuessPayload,
  ErrorPayload,
  RoomCreateAck,
  RoomCreatePayload,
  RoomJoinAck,
  RoomJoinPayload,
  RoomRejoinAck,
  RoomRejoinPayload,
  RoomStatePublic,
  RolePrivatePayload,
  RoundResultPayload,
  SettingsUpdatePayload,
  VoteSubmitPayload,
} from '../types.js';

export interface ClientToServerEvents {
  'room:create': (payload: RoomCreatePayload, ack: (res: RoomCreateAck) => void) => void;
  'room:join': (payload: RoomJoinPayload, ack: (res: RoomJoinAck) => void) => void;
  'room:rejoin': (payload: RoomRejoinPayload, ack: (res: RoomRejoinAck) => void) => void;
  'settings:update': (payload: SettingsUpdatePayload, ack?: (res: AckResponse) => void) => void;
  'game:start': (payload: Record<string, never>, ack?: (res: AckResponse) => void) => void;
  'reveal:ack': (payload: Record<string, never>, ack?: (res: AckResponse) => void) => void;
  'round:startVoting': (payload: Record<string, never>, ack?: (res: AckResponse) => void) => void;
  'vote:submit': (payload: VoteSubmitPayload, ack?: (res: AckResponse) => void) => void;
  'mrwhite:guess': (payload: MrWhiteGuessPayload, ack?: (res: AckResponse) => void) => void;
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

export interface InterServerEvents {
  // Aucun événement serveur<->serveur : process unique, pas de cluster.
}

export interface SocketData {
  roomCode: string | null;
  playerId: string | null;
}

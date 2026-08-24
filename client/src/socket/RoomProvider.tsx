import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { socket } from './client';
import { saveSession, loadSession, clearSession } from '../lib/session';
import type {
  ChatMessage,
  ErrorPayload,
  GameEndedPayload,
  RoomCreateAck,
  RoomJoinAck,
  RoomRejoinAck,
  RoomSettings,
  RoomStatePublic,
  RolePrivatePayload,
  RoundResultPayload,
  Universe,
} from '../types';

interface Session {
  roomCode: string;
  playerId: string;
  sessionToken: string;
}

// Cap client-side de sécurité — le serveur ne conserve/rejoue déjà que les CHAT_HISTORY_LIMIT
// derniers messages (voir server/src/rooms/roomStore.ts), ceci évite juste une croissance
// illimitée du tableau côté client pendant une très longue session sans reconnexion.
const CHAT_CLIENT_BUFFER = 200;

interface RoomContextValue {
  connected: boolean;
  roomState: RoomStatePublic | null;
  myRole: RolePrivatePayload | null;
  playerId: string | null;
  roomCode: string | null;
  lastRoundResult: RoundResultPayload | null;
  lastGameEnded: GameEndedPayload | null;
  lastError: ErrorPayload | null;
  chatMessages: ChatMessage[];
  chatUnreadCount: number;
  markChatRead: () => void;
  clearError: () => void;
  createRoom: (hostName: string, universe: Universe) => Promise<RoomCreateAck>;
  joinRoom: (roomCode: string, playerName: string) => Promise<RoomJoinAck>;
  rejoinFromStorage: (roomCode: string) => Promise<boolean>;
  updateSettings: (settings: Partial<RoomSettings>) => void;
  startGame: () => void;
  ackReveal: () => void;
  startVoting: () => void;
  submitVote: (targetPlayerId: string) => void;
  submitGuess: (championGuess: string) => void;
  continueRound: () => void;
  restartGame: () => void;
  leaveRoom: () => void;
  sendChatMessage: (text: string) => void;
}

const RoomContext = createContext<RoomContextValue | null>(null);

export function RoomProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(socket.connected);
  const [session, setSessionState] = useState<Session | null>(null);
  const [roomState, setRoomState] = useState<RoomStatePublic | null>(null);
  const [myRole, setMyRole] = useState<RolePrivatePayload | null>(null);
  const [lastRoundResult, setLastRoundResult] = useState<RoundResultPayload | null>(null);
  const [lastGameEnded, setLastGameEnded] = useState<GameEndedPayload | null>(null);
  const [lastError, setLastError] = useState<ErrorPayload | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);

  const sessionRef = useRef<Session | null>(null);
  const setSession = useCallback((s: Session | null) => {
    sessionRef.current = s;
    setSessionState(s);
  }, []);

  useEffect(() => {
    function onConnect() {
      setConnected(true);
      const s = sessionRef.current;
      if (s) {
        socket.emit('room:rejoin', { roomCode: s.roomCode, playerId: s.playerId, sessionToken: s.sessionToken }, (res) => {
          if (!res.ok) {
            clearSession(s.roomCode);
            setSession(null);
            setRoomState(null);
            setMyRole(null);
          }
        });
      }
    }
    function onDisconnect() {
      setConnected(false);
    }
    function onRoomState(state: RoomStatePublic) {
      setRoomState(state);
    }
    function onRolePrivate(payload: RolePrivatePayload) {
      setMyRole(payload);
    }
    function onRoundResult(payload: RoundResultPayload) {
      setLastRoundResult(payload);
    }
    function onGameEnded(payload: GameEndedPayload) {
      setLastGameEnded(payload);
    }
    function onError(payload: ErrorPayload) {
      setLastError(payload);
    }
    function onChatMessage(payload: ChatMessage) {
      setChatMessages((prev) => {
        const next = [...prev, payload];
        return next.length > CHAT_CLIENT_BUFFER ? next.slice(next.length - CHAT_CLIENT_BUFFER) : next;
      });
      // Incrémenté ici (dans le handler de l'événement qui cause le changement), pas dans un
      // effet qui dériverait ce compteur de chatMessages — ChatBox le remet à 0 via
      // markChatRead() à l'ouverture/fermeture du panneau (voir components/ChatBox.tsx).
      setChatUnreadCount((n) => n + 1);
    }
    function onChatHistory(payload: ChatMessage[]) {
      setChatMessages(payload);
      setChatUnreadCount(0);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('room:state', onRoomState);
    socket.on('role:private', onRolePrivate);
    socket.on('round:result', onRoundResult);
    socket.on('game:ended', onGameEnded);
    socket.on('error', onError);
    socket.on('chat:message', onChatMessage);
    socket.on('chat:history', onChatHistory);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('room:state', onRoomState);
      socket.off('role:private', onRolePrivate);
      socket.off('round:result', onRoundResult);
      socket.off('game:ended', onGameEnded);
      socket.off('error', onError);
      socket.off('chat:message', onChatMessage);
      socket.off('chat:history', onChatHistory);
    };
  }, [setSession]);

  const createRoom = useCallback(
    (hostName: string, universe: Universe) =>
      new Promise<RoomCreateAck>((resolve) => {
        socket.emit('room:create', { hostName, universe }, (res) => {
          if (res.ok && res.roomCode && res.playerId && res.sessionToken) {
            const s = { roomCode: res.roomCode, playerId: res.playerId, sessionToken: res.sessionToken };
            saveSession(s.roomCode, { playerId: s.playerId, sessionToken: s.sessionToken });
            setSession(s);
          }
          resolve(res);
        });
      }),
    [setSession]
  );

  const joinRoom = useCallback(
    (roomCode: string, playerName: string) =>
      new Promise<RoomJoinAck>((resolve) => {
        socket.emit('room:join', { roomCode, playerName }, (res) => {
          if (res.ok && res.playerId && res.sessionToken) {
            const s = { roomCode, playerId: res.playerId, sessionToken: res.sessionToken };
            saveSession(roomCode, { playerId: s.playerId, sessionToken: s.sessionToken });
            setSession(s);
          }
          resolve(res);
        });
      }),
    [setSession]
  );

  const rejoinFromStorage = useCallback(
    (roomCode: string) =>
      new Promise<boolean>((resolve) => {
        const stored = loadSession(roomCode);
        if (!stored) {
          resolve(false);
          return;
        }
        const payload = { roomCode, playerId: stored.playerId, sessionToken: stored.sessionToken };
        socket.emit('room:rejoin', payload, (res: RoomRejoinAck) => {
          if (res.ok) {
            setSession(payload);
            resolve(true);
          } else {
            clearSession(roomCode);
            resolve(false);
          }
        });
      }),
    [setSession]
  );

  const updateSettings = useCallback((settings: Partial<RoomSettings>) => {
    socket.emit('settings:update', { settings });
  }, []);
  const startGame = useCallback(() => {
    socket.emit('game:start', {});
  }, []);
  const ackReveal = useCallback(() => {
    socket.emit('reveal:ack', {});
  }, []);
  const startVoting = useCallback(() => {
    socket.emit('round:startVoting', {});
  }, []);
  const submitVote = useCallback((targetPlayerId: string) => {
    socket.emit('vote:submit', { targetPlayerId });
  }, []);
  const submitGuess = useCallback((championGuess: string) => {
    socket.emit('mrwhite:guess', { championGuess });
  }, []);
  const continueRound = useCallback(() => {
    socket.emit('round:continue', {});
  }, []);
  const restartGame = useCallback(() => {
    socket.emit('game:restart', {});
  }, []);
  const leaveRoom = useCallback(() => {
    socket.emit('player:leave', {});
    if (sessionRef.current) clearSession(sessionRef.current.roomCode);
    setSession(null);
    setRoomState(null);
    setMyRole(null);
    setChatMessages([]);
    setChatUnreadCount(0);
  }, [setSession]);
  const sendChatMessage = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    socket.emit('chat:send', { text: trimmed });
  }, []);
  const markChatRead = useCallback(() => setChatUnreadCount(0), []);

  const clearError = useCallback(() => setLastError(null), []);

  const value: RoomContextValue = {
    connected,
    roomState,
    myRole,
    playerId: session?.playerId ?? null,
    roomCode: session?.roomCode ?? null,
    lastRoundResult,
    lastGameEnded,
    lastError,
    chatMessages,
    chatUnreadCount,
    markChatRead,
    clearError,
    createRoom,
    joinRoom,
    rejoinFromStorage,
    updateSettings,
    startGame,
    ackReveal,
    startVoting,
    submitVote,
    submitGuess,
    continueRound,
    restartGame,
    leaveRoom,
    sendChatMessage,
  };

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
}

export function useRoom(): RoomContextValue {
  const ctx = useContext(RoomContext);
  if (!ctx) throw new Error('useRoom must be used within a RoomProvider');
  return ctx;
}

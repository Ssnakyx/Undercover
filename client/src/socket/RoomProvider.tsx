import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { socket } from './client';
import { saveSession, loadSession, clearSession } from '../lib/session';
import { roleLabel } from '../lib/roleInfo';
import type {
  ChatMessage,
  ErrorPayload,
  GameEndedPayload,
  PlayerLeftPayload,
  RoomClosedPayload,
  RoomCreateAck,
  RoomJoinAck,
  RoomRejoinAck,
  RoomSettings,
  RoomStatePublic,
  RolePrivatePayload,
  RoundResultPayload,
  SpectatorJoinAck,
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
const TOAST_DURATION_MS = 5000;

/** Notification éphémère (erreur serveur, joueur parti, exclusion...). Avant, les erreurs
 * renvoyées par le serveur n'étaient affichées nulle part. */
export interface Toast {
  id: number;
  kind: 'info' | 'error';
  text: string;
  image?: string | null;
}

interface RoomContextValue {
  connected: boolean;
  roomState: RoomStatePublic | null;
  myRole: RolePrivatePayload | null;
  playerId: string | null;
  roomCode: string | null;
  /** true si `playerId` figure dans roomState.spectators (jamais persisté en session — voir
   * joinAsSpectator, un refresh en cours de spectate re-rejoint simplement en spectateur). */
  isSpectator: boolean;
  lastRoundResult: RoundResultPayload | null;
  lastGameEnded: GameEndedPayload | null;
  lastError: ErrorPayload | null;
  /** Incrémenté à chaque role:private : sert de clé pour remonter l'écran de révélation quand
   * l'hôte relance pendant une révélation (sinon "Rôle confirmé" restait grisé). */
  roleVersion: number;
  toasts: Toast[];
  dismissToast: (id: number) => void;
  chatMessages: ChatMessage[];
  chatUnreadCount: number;
  markChatRead: () => void;
  clearError: () => void;
  createRoom: (hostName: string, universe: Universe) => Promise<RoomCreateAck>;
  joinRoom: (roomCode: string, playerName: string) => Promise<RoomJoinAck>;
  joinAsSpectator: (roomCode: string, playerName: string) => Promise<SpectatorJoinAck>;
  rejoinFromStorage: (roomCode: string) => Promise<boolean>;
  updateSettings: (settings: Partial<RoomSettings>) => void;
  addCustomPair: (champA: string, champB: string, theme?: string) => void;
  removeCustomPair: (id: string) => void;
  startGame: () => void;
  ackReveal: () => void;
  startVoting: () => void;
  submitVote: (targetPlayerId: string) => void;
  protectorProtect: (targetPlayerId: string) => void;
  submitGuess: (championGuess: string) => void;
  hunterShoot: (targetPlayerId: string | null) => void;
  continueRound: () => void;
  restartGame: () => void;
  backToLobby: () => void;
  kickPlayer: (targetPlayerId: string) => void;
  forceCloseVote: () => void;
  forceEndReveal: () => void;
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
  const [roleVersion, setRoleVersion] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);
  const pushToast = useCallback(
    (toast: Omit<Toast, 'id'>) => {
      const id = ++toastIdRef.current;
      setToasts((prev) => [...prev.slice(-3), { ...toast, id }]);
      window.setTimeout(() => dismissToast(id), TOAST_DURATION_MS);
    },
    [dismissToast]
  );

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
      // Garde-fou : un état d'une autre room (ancienne partie) ne doit jamais remplacer
      // celle où l'on est — c'est ce qui ramenait l'hôte sur sa partie précédente.
      if (state.roomCode !== sessionRef.current?.roomCode) return;
      setRoomState(state);
      // Nouvelle partie ou retour au salon : on oublie le résultat et la fin de partie précédents.
      if (state.phase === 'lobby' || state.phase === 'reveal') {
        setLastRoundResult(null);
        setLastGameEnded(null);
      }
      if (state.phase === 'lobby') setMyRole(null);
    }
    function onRolePrivate(payload: RolePrivatePayload) {
      setMyRole(payload);
      setRoleVersion((v) => v + 1);
    }
    function onRoundResult(payload: RoundResultPayload) {
      setLastRoundResult(payload);
    }
    function onGameEnded(payload: GameEndedPayload) {
      setLastGameEnded(payload);
    }
    function onError(payload: ErrorPayload) {
      setLastError(payload);
      pushToast({ kind: 'error', text: payload.message });
    }
    function onPlayerLeft(payload: PlayerLeftPayload) {
      const what = payload.kicked ? 'a été exclu par l’hôte' : 'a quitté la partie';
      const role = payload.role ? ` — il était ${roleLabel(payload.role)}` : '';
      const word = payload.champion ? ` (${payload.champion})` : '';
      pushToast({ kind: 'info', text: `${payload.name} ${what}${role}${word}.`, image: payload.championImage });
    }
    function onKicked() {
      const s = sessionRef.current;
      if (s) clearSession(s.roomCode);
      setSession(null);
      setRoomState(null);
      setMyRole(null);
      setChatMessages([]);
      pushToast({ kind: 'error', text: "L'hôte t'a exclu de la partie." });
    }
    function onRoomClosed(payload: RoomClosedPayload) {
      const s = sessionRef.current;
      if (s) clearSession(s.roomCode);
      setSession(null);
      setRoomState(null);
      setMyRole(null);
      setChatMessages([]);
      setChatUnreadCount(0);
      pushToast({ kind: 'info', text: `${payload.hostName} (l'hôte) a quitté : la partie est fermée.` });
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
    socket.on('player:left', onPlayerLeft);
    socket.on('player:kicked', onKicked);
    socket.on('room:closed', onRoomClosed);

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
      socket.off('player:left', onPlayerLeft);
      socket.off('player:kicked', onKicked);
      socket.off('room:closed', onRoomClosed);
    };
  }, [setSession, pushToast]);

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

  // Pas de saveSession ici, volontairement : un spectateur n'a pas de siège persistant à
  // retrouver (voir server/src/types.ts#Room.spectators) — un refresh en cours de spectate
  // re-déclenche simplement ce flow depuis Home.tsx plutôt qu'un rejoin de session.
  const joinAsSpectator = useCallback(
    (roomCode: string, playerName: string) =>
      new Promise<SpectatorJoinAck>((resolve) => {
        socket.emit('room:joinSpectator', { roomCode, playerName }, (res) => {
          if (res.ok && res.playerId && res.sessionToken) {
            setSession({ roomCode, playerId: res.playerId, sessionToken: res.sessionToken });
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
  const addCustomPair = useCallback((champA: string, champB: string, theme?: string) => {
    socket.emit('custom:addPair', { champA, champB, theme });
  }, []);
  const removeCustomPair = useCallback((id: string) => {
    socket.emit('custom:removePair', { id });
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
  const protectorProtect = useCallback((targetPlayerId: string) => {
    socket.emit('protector:protect', { targetPlayerId });
  }, []);
  const submitGuess = useCallback((championGuess: string) => {
    socket.emit('mrwhite:guess', { championGuess });
  }, []);
  const hunterShoot = useCallback((targetPlayerId: string | null) => {
    socket.emit('hunter:shoot', { targetPlayerId });
  }, []);
  const continueRound = useCallback(() => {
    socket.emit('round:continue', {});
  }, []);
  const restartGame = useCallback(() => {
    socket.emit('game:restart', {});
  }, []);
  const backToLobby = useCallback(() => {
    socket.emit('game:backToLobby', {});
  }, []);
  const kickPlayer = useCallback((targetPlayerId: string) => {
    socket.emit('player:kick', { targetPlayerId });
  }, []);
  const forceCloseVote = useCallback(() => {
    socket.emit('vote:forceClose', {});
  }, []);
  const forceEndReveal = useCallback(() => {
    socket.emit('reveal:forceEnd', {});
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

  const playerId = session?.playerId ?? null;
  const isSpectator = playerId !== null && (roomState?.spectators.some((s) => s.playerId === playerId) ?? false);

  const value: RoomContextValue = {
    connected,
    roomState,
    myRole,
    playerId,
    roomCode: session?.roomCode ?? null,
    isSpectator,
    lastRoundResult,
    lastGameEnded,
    lastError,
    roleVersion,
    toasts,
    dismissToast,
    chatMessages,
    chatUnreadCount,
    markChatRead,
    clearError,
    createRoom,
    joinRoom,
    joinAsSpectator,
    rejoinFromStorage,
    updateSettings,
    addCustomPair,
    removeCustomPair,
    startGame,
    ackReveal,
    startVoting,
    submitVote,
    protectorProtect,
    submitGuess,
    hunterShoot,
    continueRound,
    restartGame,
    backToLobby,
    kickPlayer,
    forceCloseVote,
    forceEndReveal,
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

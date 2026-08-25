// Types partagés — dupliqués fidèlement depuis docs/CONTRACT.md section 2 et 6.
// Ce fichier est la source de vérité LOCALE au serveur. Le client maintient sa propre
// copie identique (voir contrat : "pas de package partagé à builder").

// ---------------------------------------------------------------------------
// Section 2 — modèle de rôles
// ---------------------------------------------------------------------------

/**
 * civil/undercover/mrwhite : rôles historiques. spy/protector/ghost/hunter sont des variantes
 * du camp civils (comptées comme civils dans les décomptes de victoire, voir
 * game/engine.ts#countAliveRoles) avec une mécanique additionnelle. jester est une faction
 * solo à part, exclue de tous les décomptes de victoire existants — elle gagne uniquement en
 * étant éliminée par un vote direct (voir game/engine.ts#tallyVotesAndEliminate).
 * 'lover' n'est PAS un rôle : c'est un tag orthogonal (Player.loverPlayerId) posé sur 2
 * joueurs de rôle quelconque après l'assignation des rôles.
 */
export type Role = 'civil' | 'undercover' | 'mrwhite' | 'spy' | 'protector' | 'ghost' | 'jester' | 'hunter';

export interface PlayerRole {
  playerId: string;
  role: Role;
  champion: string | null; // null uniquement pour mrwhite
  /** Réciproque : posé sur les 2 joueurs "Amoureux" tirés au sort, sinon absent/null. */
  loverPlayerId?: string | null;
  /** Uniquement rempli sur l'entrée du joueur "Espion" : la cible de son insight de révélation. */
  spyInsightPlayerId?: string | null;
}

// ---------------------------------------------------------------------------
// Section 6 — types partagés socket
// ---------------------------------------------------------------------------

/**
 * Univers de contenu choisi au menu principal — même moteur de jeu, trois pools de paires
 * indépendants (voir content/pairsStore.ts). 'lol' = League of Legends, 'smash' = Super
 * Smash Bros Ultimate, 'pokemon' = Pokémon. Aucun asset visuel officiel dans les trois cas
 * (CONTRACT.md §0).
 */
export type Universe = 'lol' | 'smash' | 'pokemon';

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
  spyEnabled: boolean;
  loversEnabled: boolean;
  protectorEnabled: boolean;
  ghostEnabled: boolean;
  jesterEnabled: boolean;
  hunterEnabled: boolean;
  /** "Univers maison" (voir §7bis) : si true et room.customPairs non vide, game:start/restart
   * tire dans room.customPairs au lieu du pool fixe de l'univers. */
  customPairsEnabled: boolean;
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
  avatarSeed: string; // déterministe (hash du playerId), pour silhouette/couleur custom
}

/** Spectateur : rejoint une partie déjà en cours en lecture seule, promu joueur complet au
 * prochain game:restart (voir §5bis). Jamais dans `RoomStatePublic.players`. */
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
  turnOrder: string[]; // playerIds, ordre d'affichage indicatif (phase discussion)
  votedPlayerIds: string[]; // qui a voté (pas pour qui), phase voting
  phaseDeadline: number | null; // epoch ms, pour le compte à rebours client (reveal / mrwhite_guess / hunter_shoot uniquement)
  /** "Univers maison" : paires ajoutées par l'hôte pour cette room, visibles de tous en lobby
   * (rien de secret dans le contenu d'un pool, voir §7). Vide hors usage de la fonctionnalité. */
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
  /** Nom courant du partenaire "Amoureux", si settings.loversEnabled et ce joueur en fait partie. */
  loverName?: string | null;
  /** Uniquement pour le rôle "Espion" : camp d'un autre joueur tiré au sort à la révélation. */
  spyInsight?: { playerName: string; team: 'civils' | 'undercover' | 'mrwhite' | 'jester' };
}

export interface RoundResultPayload {
  eliminatedPlayerId: string | null; // null si égalité = personne éliminé
  eliminatedRole: Role | null;
  eliminatedChampion: string | null; // selon settings.revealChampionOnElimination, sinon null
  voteCounts: Record<string, number>;
  tie: boolean;
  /** true si le Protecteur a annulé l'élimination de la cible de la pluralité (jamais qui). */
  protectedThisRound?: boolean;
  /** "Amoureux" : mort de chagrin le même round que eliminatedPlayerId, jamais de chaîne au-delà. */
  chainEliminatedPlayerId?: string | null;
  chainEliminatedRole?: Role | null;
  chainEliminatedChampion?: string | null;
  /** true si ce round_result représente le tir du Chasseur et qu'il a choisi de ne tirer sur personne. */
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

/** Message de chat texte libre entre joueurs d'une room — pure convenience, ne fait pas
 * partie de la boucle de jeu (pas de rôle/champion, aucun impact sur la machine à états). */
export interface ChatMessage {
  id: string;
  playerId: string;
  name: string;
  text: string;
  ts: number; // epoch ms
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
  loverPlayerId: string | null; // "Amoureux" : réciproque, null si non applicable
  spyInsightPlayerId: string | null; // "Espion" uniquement : cible de son insight
  protectUsedThisGame: boolean; // "Protecteur" : capacité à usage unique par partie
  ghostVoteAvailable: boolean; // "Revenant" : true pendant exactement un round après son élimination par vote direct
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
  /** Spectateurs (voir §5bis) : jamais mêlés à `players` — aucune logique de jeu (rôles,
   * votes, décomptes de victoire) ne les voit jamais, par construction (map séparée). Promus
   * en bloc dans `players` au prochain game:restart, puis cette map est vidée. */
  spectators: Map<string, Player>;
  /** "Univers maison" (voir §7bis) : paires ajoutées par l'hôte, scoped à CETTE room
   * uniquement (jamais de pool partagé mutable entre rooms — voir l'historique documenté en
   * §7 sur pairs:add/toggle/remove). */
  customPairs: ChampionPair[];
  round: number;
  turnOrder: string[]; // playerIds vivants, ordre d'affichage indicatif (phase discussion)
  votes: VoteRecord[];
  lastRoundResult: RoundResultPayload | null;
  mrWhiteGuessPlayerId: string | null; // qui a le droit de deviner
  hunterShootPlayerId: string | null; // qui a le droit de tirer (phase hunter_shoot)
  protectorPendingTargetId: string | null; // cible protégée ce round de vote, reset à chaque startVoting
  phaseDeadline: number | null;
  phaseTimer: NodeJS.Timeout | null;
  emptyRoomTimer: NodeJS.Timeout | null;
  currentPairId: string | null; // paire tirée pour la partie en cours
  championA: string | null;
  championB: string | null;
  chatMessages: ChatMessage[]; // tampon borné (voir CHAT_HISTORY_LIMIT), pas d'archivage long terme
}

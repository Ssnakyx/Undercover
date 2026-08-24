// Orchestration de la machine à états d'une Room — mute l'objet Room en place.
// Ce module ne connaît PAS Socket.io : il ne fait aucun broadcast et ne programme aucun
// timer lui-même (voir socket/handlers.ts, qui appelle ces fonctions puis diffuse le
// `room:state` résultant et programme les timers de phase avec `setTimeout`). Ça garde ce
// fichier testable unitairement sans faux serveur socket.

import type { ChampionPair, Player, Room, RoundResultPayload, Winner } from '../types.js';
import { assignRoles } from './roles.js';
import { computeInitialTurnOrder, recomputeTurnOrderAfterElimination } from './turnOrder.js';
import { evaluateWinConditions, isCorrectMrWhiteGuess } from './winConditions.js';

// ---------------------------------------------------------------------------
// Constantes de conception non couvertes explicitement par le contrat (documentées
// également dans server/README.md et dans le rapport final) :
//   - Le contrat ne définit pas de champ settings pour le délai de la phase "reveal"
//     ("...ou après un délai") ni pour la fenêtre de "mrwhite_guess". On utilise des
//     constantes serveur fixes plutôt que d'ajouter des champs à RoomSettings, pour ne
//     pas dévier du contrat section 6 (interface exacte).
// ---------------------------------------------------------------------------
export const REVEAL_ACK_TIMEOUT_MS = 20_000;
export const MRWHITE_GUESS_TIMEOUT_MS = 30_000;
export const MIN_PLAYERS_TO_START = 3;

export class GameEngineError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'GameEngineError';
  }
}

// ---------------------------------------------------------------------------
// Aides
// ---------------------------------------------------------------------------

export function playersInJoinOrder(room: Room): Player[] {
  return [...room.players.values()].sort((a, b) => a.joinOrder - b.joinOrder);
}

export function alivePlayers(room: Room): Player[] {
  return playersInJoinOrder(room).filter((p) => p.alive);
}

export function alivePlayerIds(room: Room): string[] {
  return alivePlayers(room).map((p) => p.playerId);
}

export interface AliveRoleCounts {
  civilsAlive: number;
  undercoverAlive: number;
  mrWhiteAlive: number;
}

export function countAliveRoles(room: Room): AliveRoleCounts {
  let civilsAlive = 0;
  let undercoverAlive = 0;
  let mrWhiteAlive = 0;
  for (const p of room.players.values()) {
    if (!p.alive) continue;
    if (p.role === 'civil') civilsAlive++;
    else if (p.role === 'undercover') undercoverAlive++;
    else if (p.role === 'mrwhite') mrWhiteAlive++;
  }
  return { civilsAlive, undercoverAlive, mrWhiteAlive };
}

function selectPair(room: Room, pairsPool: ChampionPair[]): ChampionPair {
  const { selectedPairId } = room.settings;
  if (selectedPairId) {
    const forced = pairsPool.find((p) => p.id === selectedPairId);
    if (!forced) {
      throw new GameEngineError('PAIR_NOT_FOUND', `Paire sélectionnée introuvable: ${selectedPairId}`);
    }
    return forced;
  }
  const enabled = pairsPool.filter((p) => p.enabled);
  if (enabled.length === 0) {
    throw new GameEngineError('NO_PAIRS_AVAILABLE', 'Aucune paire de champions activée');
  }
  return enabled[Math.floor(Math.random() * enabled.length)];
}

// ---------------------------------------------------------------------------
// lobby -> reveal (game:start et game:restart partagent cette logique)
// ---------------------------------------------------------------------------

export interface StartGameOptions {
  pairsPool: ChampionPair[];
  rng?: () => number;
}

/**
 * Tire une paire, distribue les rôles à tous les joueurs actuellement dans la room (y compris
 * ceux temporairement déconnectés mais pas encore expirés), et fait entrer la room en phase
 * "reveal". Utilisé par `game:start` (depuis lobby) et `game:restart` (depuis game_over).
 */
export function assignRolesAndEnterReveal(room: Room, options: StartGameOptions): void {
  const playerIds = playersInJoinOrder(room).map((p) => p.playerId);
  if (playerIds.length < MIN_PLAYERS_TO_START) {
    throw new GameEngineError(
      'NOT_ENOUGH_PLAYERS',
      `Il faut au moins ${MIN_PLAYERS_TO_START} joueurs pour lancer une partie`
    );
  }
  if (playerIds.length > 12) {
    throw new GameEngineError('TOO_MANY_PLAYERS', 'La room dépasse la limite de 12 joueurs');
  }

  const pair = selectPair(room, options.pairsPool);
  const mrWhiteRequested = playerIds.length >= 5 && room.settings.mrWhiteEnabled;

  const roles = assignRoles({
    playerIds,
    mrWhiteRequested,
    championA: pair.champA,
    championB: pair.champB,
    rng: options.rng,
  });

  const roleByPlayerId = new Map(roles.map((r) => [r.playerId, r]));

  for (const player of room.players.values()) {
    const assigned = roleByPlayerId.get(player.playerId);
    player.role = assigned ? assigned.role : null;
    player.champion = assigned ? assigned.champion : null;
    player.alive = true;
    player.hasAckedReveal = false;
  }

  room.currentPairId = pair.id;
  room.championA = pair.champA;
  room.championB = pair.champB;
  room.phase = 'reveal';
  room.round = 0;
  room.turnOrder = [];
  room.currentTurnIndex = -1;
  room.clues = [];
  room.votes = [];
  room.lastRoundResult = null;
  room.mrWhiteGuessPlayerId = null;
  room.phaseDeadline = Date.now() + REVEAL_ACK_TIMEOUT_MS;
}

// ---------------------------------------------------------------------------
// reveal -> clues
// ---------------------------------------------------------------------------

/** true si tous les joueurs vivants ont confirmé avoir vu leur rôle. */
export function haveAllAlivePlayersAckedReveal(room: Room): boolean {
  return alivePlayers(room).every((p) => p.hasAckedReveal);
}

export function ackReveal(room: Room, playerId: string): void {
  const player = room.players.get(playerId);
  if (!player) throw new GameEngineError('PLAYER_NOT_FOUND', 'Joueur introuvable dans la room');
  if (room.phase !== 'reveal') {
    throw new GameEngineError('INVALID_PHASE', 'reveal:ack uniquement valide en phase reveal');
  }
  player.hasAckedReveal = true;
}

export function enterClues(room: Room, options: { rng?: () => number } = {}): void {
  const alive = alivePlayerIds(room);
  room.round += 1;
  room.turnOrder =
    room.round === 1
      ? computeInitialTurnOrder(alive, options.rng)
      : recomputeTurnOrderAfterElimination(room.turnOrder, alive);
  room.currentTurnIndex = 0;
  room.clues = [];
  room.phase = 'clues';
  room.phaseDeadline = Date.now() + room.settings.clueTimeSeconds * 1000;
}

export function currentTurnPlayerId(room: Room): string | null {
  if (room.phase !== 'clues') return null;
  return room.turnOrder[room.currentTurnIndex] ?? null;
}

// ---------------------------------------------------------------------------
// clues
// ---------------------------------------------------------------------------

export interface SubmitClueResult {
  /** true si la phase est passée à "voting" après cet indice (dernier joueur de l'ordre). */
  enteredVoting: boolean;
}

function pushClueAndAdvance(room: Room, playerId: string, text: string): SubmitClueResult {
  room.clues.push({ playerId, text });
  room.currentTurnIndex += 1;
  if (room.currentTurnIndex >= room.turnOrder.length) {
    enterVoting(room);
    return { enteredVoting: true };
  }
  room.phaseDeadline = Date.now() + room.settings.clueTimeSeconds * 1000;
  return { enteredVoting: false };
}

/** Validation + soumission d'un indice par le joueur dont c'est le tour. */
export function submitClue(room: Room, playerId: string, rawText: string): SubmitClueResult {
  if (room.phase !== 'clues') {
    throw new GameEngineError('INVALID_PHASE', 'clue:submit uniquement valide en phase clues');
  }
  const expected = currentTurnPlayerId(room);
  if (expected !== playerId) {
    throw new GameEngineError('NOT_YOUR_TURN', "Ce n'est pas le tour de ce joueur");
  }
  const text = rawText.trim();
  if (text.length < 1 || text.length > 60) {
    throw new GameEngineError('INVALID_CLUE', "L'indice doit contenir entre 1 et 60 caractères");
  }
  return pushClueAndAdvance(room, playerId, text);
}

/** Appelé par le timer serveur quand le joueur du tour n'a rien soumis à temps. */
export function autoPassCurrentTurn(room: Room): SubmitClueResult {
  if (room.phase !== 'clues') {
    throw new GameEngineError('INVALID_PHASE', 'autoPassCurrentTurn uniquement valide en phase clues');
  }
  const playerId = currentTurnPlayerId(room);
  if (!playerId) {
    throw new GameEngineError('NO_CURRENT_TURN', 'Aucun joueur courant à faire passer');
  }
  return pushClueAndAdvance(room, playerId, '(passé)');
}

// ---------------------------------------------------------------------------
// voting
// ---------------------------------------------------------------------------

export function enterVoting(room: Room): void {
  room.phase = 'voting';
  room.votes = [];
  room.phaseDeadline = Date.now() + room.settings.voteTimeSeconds * 1000;
}

export function submitVote(room: Room, voterId: string, targetPlayerId: string): void {
  if (room.phase !== 'voting') {
    throw new GameEngineError('INVALID_PHASE', 'vote:submit uniquement valide en phase voting');
  }
  const voter = room.players.get(voterId);
  if (!voter || !voter.alive) {
    throw new GameEngineError('NOT_ALIVE', 'Seul un joueur vivant peut voter');
  }
  if (voterId === targetPlayerId) {
    throw new GameEngineError('VOTE_SELF_FORBIDDEN', 'Un joueur ne peut pas voter pour lui-même');
  }
  const target = room.players.get(targetPlayerId);
  if (!target || !target.alive) {
    throw new GameEngineError('INVALID_VOTE_TARGET', 'Cible de vote invalide (introuvable ou éliminée)');
  }
  if (room.votes.some((v) => v.voterId === voterId)) {
    throw new GameEngineError('ALREADY_VOTED', 'Ce joueur a déjà voté ce round');
  }
  room.votes.push({ voterId, targetPlayerId });
}

export interface TallyResult {
  result: RoundResultPayload;
  /** Vainqueur si la partie se termine immédiatement après ce dépouillement (hors mrwhite_guess). */
  winner: Winner | null;
  /** true si on doit entrer en phase mrwhite_guess (mr white éliminé). */
  enterMrWhiteGuess: boolean;
}

/**
 * Dépouille les votes des joueurs vivants (les absents/non-votants ne comptent pas), élimine
 * le joueur avec le plus de voix, ou personne en cas d'égalité au sommet (règle MVP, section 3).
 */
export function tallyVotesAndEliminate(room: Room): TallyResult {
  if (room.phase !== 'voting') {
    throw new GameEngineError('INVALID_PHASE', 'Dépouillement uniquement valide en phase voting');
  }

  const voteCounts: Record<string, number> = {};
  for (const p of alivePlayers(room)) voteCounts[p.playerId] = 0;
  for (const v of room.votes) {
    voteCounts[v.targetPlayerId] = (voteCounts[v.targetPlayerId] ?? 0) + 1;
  }

  let maxVotes = -1;
  let topIds: string[] = [];
  for (const [playerId, count] of Object.entries(voteCounts)) {
    if (count > maxVotes) {
      maxVotes = count;
      topIds = [playerId];
    } else if (count === maxVotes) {
      topIds.push(playerId);
    }
  }

  // Égalité au sommet dès que plus d'un joueur partage le maximum de voix, y compris le cas
  // "personne n'a voté" (tous à 0). Dans les deux cas : personne n'est éliminé ce round.
  const isTopTie = topIds.length > 1;

  let eliminatedPlayerId: string | null = null;
  if (!isTopTie && maxVotes > 0) {
    eliminatedPlayerId = topIds[0];
  }

  let eliminatedRole = null as RoundResultPayload['eliminatedRole'];
  let eliminatedChampion: string | null = null;

  if (eliminatedPlayerId) {
    const eliminated = room.players.get(eliminatedPlayerId);
    if (eliminated) {
      eliminated.alive = false;
      eliminatedRole = eliminated.role;
      eliminatedChampion = room.settings.revealChampionOnElimination ? eliminated.champion : null;
    }
  }

  const result: RoundResultPayload = {
    eliminatedPlayerId,
    eliminatedRole,
    eliminatedChampion,
    voteCounts,
    tie: eliminatedPlayerId === null && maxVotes > 0,
  };

  room.lastRoundResult = result;
  room.phase = 'round_result';
  room.phaseDeadline = null;
  room.turnOrder = recomputeTurnOrderAfterElimination(room.turnOrder, alivePlayerIds(room));

  if (eliminatedPlayerId && eliminatedRole === 'mrwhite') {
    room.mrWhiteGuessPlayerId = eliminatedPlayerId;
    return { result, winner: null, enterMrWhiteGuess: true };
  }

  const winner = eliminatedPlayerId ? evaluateWinConditions(countAliveRoles(room)) : null;
  return { result, winner, enterMrWhiteGuess: false };
}

// ---------------------------------------------------------------------------
// mrwhite_guess
// ---------------------------------------------------------------------------

export function enterMrWhiteGuess(room: Room): void {
  room.phase = 'mrwhite_guess';
  room.phaseDeadline = Date.now() + MRWHITE_GUESS_TIMEOUT_MS;
}

export interface MrWhiteGuessResult {
  correct: boolean;
  winner: Winner | null;
}

/**
 * Traite la devinette de Mr White. Si correcte -> victoire immédiate de Mr White. Sinon (ou
 * en cas de timeout, voir `resolveMrWhiteTimeout`) on réévalue les conditions de victoire
 * section 4 comme si Mr White n'avait pas deviné.
 */
export function submitMrWhiteGuess(room: Room, playerId: string, championGuess: string): MrWhiteGuessResult {
  if (room.phase !== 'mrwhite_guess') {
    throw new GameEngineError('INVALID_PHASE', 'mrwhite:guess uniquement valide en phase mrwhite_guess');
  }
  if (room.mrWhiteGuessPlayerId !== playerId) {
    throw new GameEngineError('NOT_MRWHITE_GUESSER', "Seul le Mr White qui vient d'être éliminé peut deviner");
  }
  if (!room.championA) {
    throw new GameEngineError('NO_ACTIVE_CHAMPION', 'Aucun champion actif pour cette partie');
  }

  room.mrWhiteGuessPlayerId = null;

  if (isCorrectMrWhiteGuess(championGuess, room.championA)) {
    room.phaseDeadline = null;
    return { correct: true, winner: 'mrwhite' };
  }

  const winner = evaluateWinConditions(countAliveRoles(room));
  room.phase = 'round_result';
  room.phaseDeadline = null;
  return { correct: false, winner };
}

/** Appelé par le timer serveur si Mr White n'a pas répondu à temps. */
export function resolveMrWhiteTimeout(room: Room): MrWhiteGuessResult {
  if (room.phase !== 'mrwhite_guess') {
    throw new GameEngineError('INVALID_PHASE', 'Timeout mrwhite_guess hors phase mrwhite_guess');
  }
  room.mrWhiteGuessPlayerId = null;
  const winner = evaluateWinConditions(countAliveRoles(room));
  room.phase = 'round_result';
  room.phaseDeadline = null;
  return { correct: false, winner };
}

// ---------------------------------------------------------------------------
// round_result -> clues | game_over
// ---------------------------------------------------------------------------

export function roundContinue(room: Room, options: { rng?: () => number } = {}): void {
  if (room.phase !== 'round_result') {
    throw new GameEngineError('INVALID_PHASE', 'round:continue uniquement valide en phase round_result');
  }
  enterClues(room, options);
}

export function enterGameOver(room: Room): void {
  room.phase = 'game_over';
  room.phaseDeadline = null;
  room.mrWhiteGuessPlayerId = null;
}

export function buildGameEndedReveal(room: Room): { playerId: string; name: string; role: import('../types.js').Role; champion: string | null }[] {
  return playersInJoinOrder(room).map((p) => ({
    playerId: p.playerId,
    name: p.name,
    role: p.role ?? 'civil',
    champion: p.champion,
  }));
}

// ---------------------------------------------------------------------------
// Départs hors du flux de vote normal (déconnexion expirée, player:leave en cours de
// partie) — voir socket/handlers.ts pour l'orchestration complète (émission de
// round:result pour révéler le rôle du partant, cf. CONTRACT.md section 5 "rôle révélé").
// ---------------------------------------------------------------------------

/** Réévalue les conditions de victoire section 4 avec les décomptes actuels de la room. */
export function evaluateCurrentWinner(room: Room): Winner | null {
  return evaluateWinConditions(countAliveRoles(room));
}

export interface RemoveFromClueTurnOrderResult {
  /** true si le retrait a fait passer la phase clues -> voting (c'était le dernier tour restant). */
  enteredVoting: boolean;
  /** true si le joueur retiré était le joueur du tour courant. */
  wasCurrentTurn: boolean;
}

/**
 * Retire un joueur de l'ordre de passage en cours de round "clues" (départ en cours de
 * partie), en ajustant l'index du tour courant. Si le joueur retiré était le joueur du tour
 * et qu'il n'y a plus personne après lui, fait passer la phase à "voting".
 */
export function removeFromClueTurnOrder(room: Room, playerId: string): RemoveFromClueTurnOrderResult {
  if (room.phase !== 'clues') {
    return { enteredVoting: false, wasCurrentTurn: false };
  }
  const idx = room.turnOrder.indexOf(playerId);
  if (idx === -1) {
    return { enteredVoting: false, wasCurrentTurn: false };
  }

  const wasCurrentTurn = idx === room.currentTurnIndex;
  room.turnOrder.splice(idx, 1);
  if (idx < room.currentTurnIndex) {
    room.currentTurnIndex -= 1;
  }

  if (!wasCurrentTurn) {
    return { enteredVoting: false, wasCurrentTurn: false };
  }

  if (room.currentTurnIndex >= room.turnOrder.length) {
    enterVoting(room);
    return { enteredVoting: true, wasCurrentTurn: true };
  }

  room.phaseDeadline = Date.now() + room.settings.clueTimeSeconds * 1000;
  return { enteredVoting: false, wasCurrentTurn: true };
}

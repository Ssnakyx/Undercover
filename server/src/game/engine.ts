// Orchestration de la machine à états d'une Room — mute l'objet Room en place.
// Ce module ne connaît PAS Socket.io : il ne fait aucun broadcast et ne programme aucun
// timer lui-même (voir socket/handlers.ts, qui appelle ces fonctions puis diffuse le
// `room:state` résultant et programme les timers de phase avec `setTimeout`). Ça garde ce
// fichier testable unitairement sans faux serveur socket.

import type { ChampionPair, Player, Room, RoundResultPayload, Winner } from '../types.js';
import { assignRoles, type RoleRequest } from './roles.js';
import { computeInitialTurnOrder, recomputeTurnOrderAfterElimination } from './turnOrder.js';
import { evaluateWinConditions, isCorrectMrWhiteGuess } from './winConditions.js';

// Rôles considérés comme des variantes du camp civils pour les décomptes de victoire (voir
// types.ts#Role) — spy/protector/ghost/hunter ne sont jamais des factions séparées.
const CIVIL_ALIGNED_ROLES = new Set(['civil', 'spy', 'protector', 'ghost', 'hunter']);

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
export const HUNTER_SHOOT_TIMEOUT_MS = 30_000;
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

/**
 * Vivants + "Revenant" (ghost) éliminés au round précédent qui ont encore leur vote bonus
 * disponible (voir CONTRACT.md, mécanique Revenant) — c'est l'ensemble utilisé pour la
 * validation/complétude du vote, JAMAIS pour les décomptes de victoire (countAliveRoles reste
 * strictement basé sur `alive`).
 */
export function voteEligiblePlayers(room: Room): Player[] {
  return playersInJoinOrder(room).filter((p) => p.alive || p.ghostVoteAvailable);
}

export interface AliveRoleCounts {
  civilsAlive: number;
  undercoverAlive: number;
  mrWhiteAlive: number;
  jesterAlive: number;
}

export function countAliveRoles(room: Room): AliveRoleCounts {
  let civilsAlive = 0;
  let undercoverAlive = 0;
  let mrWhiteAlive = 0;
  let jesterAlive = 0;
  for (const p of room.players.values()) {
    if (!p.alive) continue;
    if (p.role && CIVIL_ALIGNED_ROLES.has(p.role)) civilsAlive++;
    else if (p.role === 'undercover') undercoverAlive++;
    else if (p.role === 'mrwhite') mrWhiteAlive++;
    else if (p.role === 'jester') jesterAlive++;
  }
  return { civilsAlive, undercoverAlive, mrWhiteAlive, jesterAlive };
}

function selectPair(pairsPool: ChampionPair[]): ChampionPair {
  if (pairsPool.length === 0) {
    throw new GameEngineError('NO_PAIRS_AVAILABLE', 'Aucune paire de champions disponible pour cet univers');
  }
  return pairsPool[Math.floor(Math.random() * pairsPool.length)];
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

  const pair = selectPair(options.pairsPool);
  const requested: RoleRequest = {
    mrWhite: room.settings.mrWhiteEnabled,
    spy: room.settings.spyEnabled,
    protector: room.settings.protectorEnabled,
    ghost: room.settings.ghostEnabled,
    jester: room.settings.jesterEnabled,
    hunter: room.settings.hunterEnabled,
    lovers: room.settings.loversEnabled,
  };

  const roles = assignRoles({
    playerIds,
    requested,
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
    player.loverPlayerId = assigned?.loverPlayerId ?? null;
    player.spyInsightPlayerId = assigned?.spyInsightPlayerId ?? null;
    player.protectUsedThisGame = false;
    player.ghostVoteAvailable = false;
  }

  room.currentPairId = pair.id;
  room.championA = pair.champA;
  room.championB = pair.champB;
  room.phase = 'reveal';
  room.round = 0;
  room.turnOrder = [];
  room.votes = [];
  room.lastRoundResult = null;
  room.mrWhiteGuessPlayerId = null;
  room.hunterShootPlayerId = null;
  room.protectorPendingTargetId = null;
  room.phaseDeadline = Date.now() + REVEAL_ACK_TIMEOUT_MS;
}

// ---------------------------------------------------------------------------
// reveal -> discussion
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

/**
 * `turnOrder` n'est ici qu'un ordre d'affichage indicatif (qui parle dans quel ordre, hors
 * app) — voir CONTRACT.md §3. Aucune interaction applicative n'en dépend : pas de minuteur,
 * pas de saisie d'indice, pas de notion de "tour courant" côté serveur.
 */
export function enterDiscussion(room: Room, options: { rng?: () => number } = {}): void {
  const alive = alivePlayerIds(room);
  room.round += 1;
  room.turnOrder =
    room.round === 1
      ? computeInitialTurnOrder(alive, options.rng)
      : recomputeTurnOrderAfterElimination(room.turnOrder, alive);
  room.phase = 'discussion';
  room.phaseDeadline = null;
}

// ---------------------------------------------------------------------------
// discussion -> voting
// ---------------------------------------------------------------------------

/** Déclenché uniquement par l'hôte (`round:startVoting`), quand il juge la discussion close. */
export function startVoting(room: Room): void {
  if (room.phase !== 'discussion') {
    throw new GameEngineError('INVALID_PHASE', 'round:startVoting uniquement valide en phase discussion');
  }
  room.phase = 'voting';
  room.votes = [];
  room.protectorPendingTargetId = null;
  // Pas de minuteur de vote (voir CONTRACT.md §3) : phaseDeadline reste null durant voting.
  room.phaseDeadline = null;
}

// ---------------------------------------------------------------------------
// voting
// ---------------------------------------------------------------------------

/**
 * Un joueur peut voter s'il est vivant, OU s'il est un "Revenant" (ghost) éliminé au round
 * précédent qui a encore son vote bonus disponible (voir CONTRACT.md, mécanique Revenant). La
 * CIBLE du vote doit en revanche toujours être un joueur vivant, sans exception.
 */
export function submitVote(room: Room, voterId: string, targetPlayerId: string): void {
  if (room.phase !== 'voting') {
    throw new GameEngineError('INVALID_PHASE', 'vote:submit uniquement valide en phase voting');
  }
  const voter = room.players.get(voterId);
  if (!voter || !(voter.alive || voter.ghostVoteAvailable)) {
    throw new GameEngineError('NOT_ALIVE', 'Seul un joueur vivant (ou un Revenant avec un vote bonus) peut voter');
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

/** true si tous les votants éligibles (vivants + Revenants avec vote bonus) ont voté (déclenche
 * le dépouillement, cf. CONTRACT.md §3). */
export function haveAllAlivePlayersVoted(room: Room): boolean {
  return voteEligiblePlayers(room).every((p) => room.votes.some((v) => v.voterId === p.playerId));
}

/**
 * Le Protecteur ne peut agir qu'une fois par partie, pendant la phase de vote, en désignant un
 * joueur vivant (autre que lui-même) à protéger d'une élimination ce round. Consommé dès la
 * soumission (que ça "serve" ou non ce round-là) — design volontairement simple pour éviter
 * tout calcul à rebours de la valeur de l'action.
 */
export function submitProtectorProtect(room: Room, playerId: string, targetPlayerId: string): void {
  if (room.phase !== 'voting') {
    throw new GameEngineError('INVALID_PHASE', 'protector:protect uniquement valide en phase voting');
  }
  const protector = room.players.get(playerId);
  if (!protector || protector.role !== 'protector' || !protector.alive) {
    throw new GameEngineError('NOT_PROTECTOR', "Seul le Protecteur vivant peut utiliser cette capacité");
  }
  if (protector.protectUsedThisGame) {
    throw new GameEngineError('PROTECT_ALREADY_USED', 'Le Protecteur a déjà utilisé sa capacité cette partie');
  }
  if (playerId === targetPlayerId) {
    throw new GameEngineError('PROTECT_SELF_FORBIDDEN', 'Le Protecteur ne peut pas se protéger lui-même');
  }
  const target = room.players.get(targetPlayerId);
  if (!target || !target.alive) {
    throw new GameEngineError('INVALID_PROTECT_TARGET', 'Cible de protection invalide (introuvable ou éliminée)');
  }
  protector.protectUsedThisGame = true;
  room.protectorPendingTargetId = targetPlayerId;
}

export interface TallyResult {
  result: RoundResultPayload;
  /** Vainqueur si la partie se termine immédiatement après ce dépouillement (hors mrwhite_guess/hunter_shoot). */
  winner: Winner | null;
  /** true si on doit entrer en phase mrwhite_guess (mr white éliminé). */
  enterMrWhiteGuess: boolean;
  /** true si on doit entrer en phase hunter_shoot (Chasseur éliminé). */
  enterHunterShoot: boolean;
}

/**
 * Dépouille les votes des joueurs vivants, élimine le joueur avec le plus de voix, ou
 * personne en cas d'égalité au sommet (règle MVP, section 3).
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

  let plurality: string | null = null;
  if (!isTopTie && maxVotes > 0) {
    plurality = topIds[0];
  }

  // Le Protecteur annule l'élimination de sa cible si elle correspond exactement à la
  // pluralité — traité comme "personne n'est éliminé", sans jamais révéler qui a protégé.
  const protectedThisRound = plurality !== null && room.protectorPendingTargetId === plurality;
  const eliminatedPlayerId = protectedThisRound ? null : plurality;

  let eliminatedRole = null as RoundResultPayload['eliminatedRole'];
  let eliminatedChampion: string | null = null;
  let chainEliminatedPlayerId: string | null = null;
  let chainEliminatedRole: RoundResultPayload['eliminatedRole'] = null;
  let chainEliminatedChampion: string | null = null;

  if (eliminatedPlayerId) {
    const eliminated = room.players.get(eliminatedPlayerId);
    if (eliminated) {
      eliminated.alive = false;
      eliminatedRole = eliminated.role;
      eliminatedChampion = room.settings.revealChampionOnElimination ? eliminated.champion : null;

      // "Amoureux" : mort de chagrin en chaîne, uniquement sur une élimination par vote direct
      // (jamais de chaîne au-delà de ce second joueur — voir règle unificatrice CONTRACT.md).
      if (eliminated.loverPlayerId) {
        const lover = room.players.get(eliminated.loverPlayerId);
        if (lover && lover.alive) {
          lover.alive = false;
          chainEliminatedPlayerId = lover.playerId;
          chainEliminatedRole = lover.role;
          chainEliminatedChampion = room.settings.revealChampionOnElimination ? lover.champion : null;
        }
      }

      // Bouffon : victoire immédiate sur élimination par vote direct — court-circuite tout le
      // reste (mrwhite_guess/hunter_shoot/win conditions standards ne sont jamais évalués).
      if (eliminatedRole === 'jester') {
        const result: RoundResultPayload = {
          eliminatedPlayerId,
          eliminatedRole,
          eliminatedChampion,
          voteCounts,
          tie: false,
          chainEliminatedPlayerId,
          chainEliminatedRole,
          chainEliminatedChampion,
        };
        room.lastRoundResult = result;
        room.phase = 'round_result';
        room.phaseDeadline = null;
        room.protectorPendingTargetId = null;
        room.turnOrder = recomputeTurnOrderAfterElimination(room.turnOrder, alivePlayerIds(room));
        return { result, winner: 'jester', enterMrWhiteGuess: false, enterHunterShoot: false };
      }

      if (eliminatedRole === 'ghost') {
        eliminated.ghostVoteAvailable = true;
      }
    }
  }

  const result: RoundResultPayload = {
    eliminatedPlayerId,
    eliminatedRole,
    eliminatedChampion,
    voteCounts,
    tie: eliminatedPlayerId === null && !protectedThisRound && maxVotes > 0,
    protectedThisRound,
    chainEliminatedPlayerId,
    chainEliminatedRole,
    chainEliminatedChampion,
  };

  room.lastRoundResult = result;
  room.phase = 'round_result';
  room.phaseDeadline = null;
  room.protectorPendingTargetId = null;
  room.turnOrder = recomputeTurnOrderAfterElimination(room.turnOrder, alivePlayerIds(room));

  if (eliminatedPlayerId && eliminatedRole === 'mrwhite') {
    room.mrWhiteGuessPlayerId = eliminatedPlayerId;
    return { result, winner: null, enterMrWhiteGuess: true, enterHunterShoot: false };
  }

  if (eliminatedPlayerId && eliminatedRole === 'hunter') {
    room.hunterShootPlayerId = eliminatedPlayerId;
    return { result, winner: null, enterMrWhiteGuess: false, enterHunterShoot: true };
  }

  const winner = eliminatedPlayerId ? evaluateWinConditions(countAliveRoles(room)) : null;
  return { result, winner, enterMrWhiteGuess: false, enterHunterShoot: false };
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
// hunter_shoot — calqué sur mrwhite_guess : le Chasseur qui vient d'être éliminé par un vote
// direct a une fenêtre pour tirer sur un joueur vivant (ou passer), qui est alors éliminé aussi.
// Ce tir n'a lui-même AUCUN déclencheur en chaîne (Amoureux/Bouffon/mrwhite_guess/nouveau
// hunter_shoot), même si sa cible aurait normalement dû en produire un — bornage volontaire
// documenté dans la règle unificatrice (CONTRACT.md).
// ---------------------------------------------------------------------------

export function enterHunterShoot(room: Room): void {
  room.phase = 'hunter_shoot';
  room.phaseDeadline = Date.now() + HUNTER_SHOOT_TIMEOUT_MS;
}

export interface HunterShootResult {
  winner: Winner | null;
}

function resolveHunterShot(room: Room, targetPlayerId: string | null): HunterShootResult {
  room.hunterShootPlayerId = null;

  let eliminatedPlayerId: string | null = null;
  let eliminatedRole: RoundResultPayload['eliminatedRole'] = null;
  let eliminatedChampion: string | null = null;

  if (targetPlayerId) {
    const target = room.players.get(targetPlayerId);
    if (target && target.alive) {
      target.alive = false;
      eliminatedPlayerId = target.playerId;
      eliminatedRole = target.role;
      eliminatedChampion = room.settings.revealChampionOnElimination ? target.champion : null;
    }
  }

  const result: RoundResultPayload = {
    eliminatedPlayerId,
    eliminatedRole,
    eliminatedChampion,
    voteCounts: {},
    tie: false,
    hunterDeclined: eliminatedPlayerId === null,
  };
  room.lastRoundResult = result;
  room.phase = 'round_result';
  room.phaseDeadline = null;
  room.turnOrder = recomputeTurnOrderAfterElimination(room.turnOrder, alivePlayerIds(room));

  const winner = evaluateWinConditions(countAliveRoles(room));
  return { winner };
}

/**
 * Traite le tir du Chasseur (targetPlayerId `null` = il choisit de ne tirer sur personne).
 * Réévalue les conditions de victoire section 4 avec la cible retirée le cas échéant.
 */
export function submitHunterShot(room: Room, playerId: string, targetPlayerId: string | null): HunterShootResult {
  if (room.phase !== 'hunter_shoot') {
    throw new GameEngineError('INVALID_PHASE', 'hunter:shoot uniquement valide en phase hunter_shoot');
  }
  if (room.hunterShootPlayerId !== playerId) {
    throw new GameEngineError('NOT_HUNTER_SHOOTER', "Seul le Chasseur qui vient d'être éliminé peut tirer");
  }
  if (targetPlayerId !== null) {
    if (targetPlayerId === playerId) {
      throw new GameEngineError('HUNTER_SELF_FORBIDDEN', 'Le Chasseur ne peut pas se tirer dessus');
    }
    const target = room.players.get(targetPlayerId);
    if (!target || !target.alive) {
      throw new GameEngineError('INVALID_HUNTER_TARGET', 'Cible de tir invalide (introuvable ou éliminée)');
    }
  }
  return resolveHunterShot(room, targetPlayerId);
}

/** Appelé par le timer serveur si le Chasseur n'a pas tiré à temps : équivaut à "passer". */
export function resolveHunterShotTimeout(room: Room): HunterShootResult {
  if (room.phase !== 'hunter_shoot') {
    throw new GameEngineError('INVALID_PHASE', 'Timeout hunter_shoot hors phase hunter_shoot');
  }
  return resolveHunterShot(room, null);
}

// ---------------------------------------------------------------------------
// round_result -> discussion | game_over
// ---------------------------------------------------------------------------

export function roundContinue(room: Room, options: { rng?: () => number } = {}): void {
  if (room.phase !== 'round_result') {
    throw new GameEngineError('INVALID_PHASE', 'round:continue uniquement valide en phase round_result');
  }
  enterDiscussion(room, options);
}

export function enterGameOver(room: Room): void {
  room.phase = 'game_over';
  room.phaseDeadline = null;
  room.mrWhiteGuessPlayerId = null;
  room.hunterShootPlayerId = null;
}

/**
 * Score cumulé "mode Soirée" (voir CONTRACT.md §5ter) : à la toute fin d'une partie, +1 point
 * pour chaque joueur dont le rôle appartenait au camp vainqueur — qu'il ait survécu ou non
 * jusqu'au bout. `civils` regroupe le même agrégat que countAliveRoles (civil/spy/protector/
 * ghost/hunter). Jamais réinitialisé par game:restart : le score vit tant que dure la room.
 */
export function awardScoreForWinner(room: Room, winner: Winner): void {
  for (const player of room.players.values()) {
    const onWinningTeam =
      winner === 'civils'
        ? !!player.role && CIVIL_ALIGNED_ROLES.has(player.role)
        : player.role === winner;
    if (onWinningTeam) player.score += 1;
  }
}

export function buildGameEndedReveal(room: Room): { playerId: string; name: string; role: import('../types.js').Role; champion: string | null; loverPlayerId: string | null }[] {
  return playersInJoinOrder(room).map((p) => ({
    playerId: p.playerId,
    name: p.name,
    role: p.role ?? 'civil',
    champion: p.champion,
    loverPlayerId: p.loverPlayerId,
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

/**
 * Retire un joueur de l'ordre de passage affiché en phase "discussion" (départ en cours de
 * partie) — purement cosmétique, aucune logique de tour ne dépend de `turnOrder` côté serveur.
 */
export function removeFromTurnOrder(room: Room, playerId: string): void {
  room.turnOrder = room.turnOrder.filter((id) => id !== playerId);
}

/**
 * L'hôte quitte explicitement (bouton "Quitter") une partie en cours (phase ≠ lobby,
 * game_over, aborted) : contrairement à une déconnexion accidentelle (qui transfère le host
 * pour laisser la partie continuer), un départ volontaire de l'hôte termine la partie pour
 * tout le monde — voir docs/CONTRACT.md §5.
 */
export function abortGame(room: Room): void {
  room.phase = 'aborted';
  room.phaseDeadline = null;
  room.mrWhiteGuessPlayerId = null;
  room.hunterShootPlayerId = null;
}

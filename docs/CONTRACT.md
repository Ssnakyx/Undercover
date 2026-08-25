# CONTRACT.md — source de vérité unique

Ce document est LA référence technique du projet. Tout agent (Design, Frontend, Backend,
Contenu, QA, Correction) doit lire ce fichier intégralement avant de produire quoi que ce
soit, et ne doit jamais s'en écarter sans mettre ce fichier à jour d'abord.

Nom du projet : **lolCover**. Jeu façon Undercover/Mr White, multijoueur temps réel, un joueur
par appareil. Un menu principal propose le choix entre trois **univers** de contenu
(`Universe`, voir §6) qui partagent exactement le même moteur de jeu : **League of Legends**
(`'lol'`), **Super Smash Bros Ultimate** (`'smash'`) et **Pokémon** (`'pokemon'`).

---

## 0. Frontière propriété intellectuelle (IMPORTANT — lire avant de designer/contenu)

Vaut pour les TROIS univers de contenu (League of Legends, Super Smash Bros Ultimate, Pokémon).

- **Autorisé et requis** : les noms de champions/combattants/Pokémon en texte brut (Garen,
  Darius, Ashe, ... / Mario, Fox, Marth, ... / Dracaufeu, Bulbizarre, Raichu d'Alola, ...). Le
  jeu ne fonctionne pas sans eux — ne pas les génériciser, ne pas les remplacer par des noms
  inventés. Les noms Pokémon utilisent la traduction française officielle (voir §7).
- **Interdit** : tout asset visuel officiel Riot Games, Nintendo/Sakurai ou The Pokémon
  Company/Game Freak — splash arts, artworks/rendus officiels, icônes de personnage officielles,
  logos, polices ou charte graphique copiées de leurs sites.
- Toute représentation visuelle d'un champion/combattant/Pokémon doit être une création
  originale (typographie du nom, silhouette géométrique stylisée maison, motif abstrait,
  dégradé propre au design system défini section 4) — identique dans les trois univers.

---

## 1. Stack & structure de dossiers

```
/server        Node.js + TypeScript + Express + Socket.io. État en mémoire (Map).
  src/
    game/      logique pure testable (rôles, tours, votes, conditions de victoire)
    rooms/     gestion des rooms, reconnexion, expiration
    socket/    handlers des événements socket.io
    content/   listes de paires de champions/combattants par univers (source de vérité serveur)
  test/        tests unitaires (Vitest)
/client        React + TypeScript + Vite + socket.io-client + react-router-dom
  src/
    screens/   MainMenu, Home, Lobby, Reveal, Discussion, Voting, RoundResult, GameOver
    components/
    styles/    design tokens (css variables), issus des maquettes /design
    socket/    client socket wrapper + hooks
/design         maquettes statiques HTML/CSS autonomes (une par écran clé), AVANT tout code
  design-system.css   tokens : couleurs, typo, espacement, icônes custom en SVG inline
  home.html, lobby.html, reveal.html, clues.html, voting.html, gameover.html
/docs
  CONTRACT.md   ce fichier
  REPORT.md     rapport final (rédigé à la fin)
/e2e            tests Playwright (multi-contextes navigateur)
```

Pas de monorepo/workspace npm : `/server` et `/client` ont chacun leur `package.json`
indépendant, s'installent et se lancent séparément (deux terminaux, ou un script racine
`concurrently` optionnel côté README). Chaque package définit ses propres types TS
correspondant exactement aux interfaces de ce contrat — pas de package partagé à builder.

---

## 2. Modèle de rôles

```ts
// civil/undercover/mrwhite : rôles historiques. spy/protector/ghost/hunter sont des variantes
// du camp civils (comptées comme "civils" dans les décomptes de victoire §4). jester est une
// faction solo à part, exclue de tous les décomptes de victoire existants.
type Role = 'civil' | 'undercover' | 'mrwhite' | 'spy' | 'protector' | 'ghost' | 'jester' | 'hunter';

interface PlayerRole {
  playerId: string;
  role: Role;
  champion: string | null; // null uniquement pour mrwhite/jester
  loverPlayerId?: string | null; // "Amoureux" : réciproque sur 2 joueurs de rôle quelconque
  spyInsightPlayerId?: string | null; // "Espion" uniquement : cible de son insight
}
```

### Table de répartition (exacte, obligatoire — pas d'improvisation)

| Joueurs (N) | Undercover | Mr White | Bouffon | Autres (Espion/Protecteur/Revenant/Chasseur/Amoureux) |
|---|---|---|---|---|
| 3 | 1 | non | non | non |
| 4 | 1 | non | non | Espion/Chasseur/Amoureux dispo (seuil 4) |
| 5–8 | 1 | oui (seuil 5) | non (seuil 6) | + Protecteur/Revenant dispo (seuil 5) |
| 9–12 | 2 | oui | oui (dès N≥6) | tous disponibles |

- Civils (agrégat civil/spy/protector/ghost/hunter) = N − undercover − (mrWhite ? 1 : 0) −
  (jester ? 1 : 0), moins un slot par sous-rôle civil optionnel effectivement attribué.
- Mr White, Bouffon, Espion, Protecteur, Revenant, Chasseur sont chacun un joueur au maximum.
- Invariant de sécurité (inchangé dans son esprit) : civils (agrégat) ≥ undercover + mrWhite + 1
  au lancement — jester n'est volontairement PAS ajouté à ce membre de droite (faction solo, ne
  "grandit" jamais par attrition contrairement à undercover/mrWhite). Toute demande de rôle
  optionnel en dessous de son seuil minimum de joueurs, ou en surnombre par rapport aux slots
  civils restants, est **ignorée silencieusement** côté serveur (jamais d'erreur bloquante) —
  même philosophie que le comportement historique de Mr White à N<5.
- Champion A (majoritaire) attribué aux civils/spy/protector/ghost/hunter, champion B (proche)
  attribué aux undercover, aucun champion à Mr White ni au Bouffon.
- Tirage : une paire de champions est choisie aléatoirement dans le pool entier de l'univers de
  la room (voir §7) ; les rôles sont ensuite distribués aléatoirement parmi les joueurs selon la
  table ci-dessus. `loverPlayerId`/`spyInsightPlayerId` sont calculés dans la même passe, sans
  appel supplémentaire au générateur aléatoire (déterminisme testable préservé).

### Mécaniques des nouveaux rôles

**Règle unificatrice** : toutes les réactions spéciales post-élimination (victoire immédiate du
Bouffon, phase `hunter_shoot`, vote bonus du Revenant) ne se déclenchent QUE sur une élimination
par vote direct (la cible de la pluralité du round) — jamais sur une mort en chaîne (Amoureux),
une déconnexion ou un départ volontaire. Ça borne strictement la complexité (pas de récursion,
pas de double déclenchement), dans le même esprit que l'extension Mr White survie déjà
documentée en §4.

- **Espion** (camp civils) : à la révélation, apprend en privé (`role:private.spyInsight`) le
  CAMP (`'civils' | 'undercover' | 'mrwhite' | 'jester'`, jamais le rôle exact) d'un autre joueur
  tiré au sort.
- **Amoureux** : 2 joueurs tirés au sort (n'importe quel rôle, y compris Mr White/Bouffon) sont
  liés en secret (`loverPlayerId` réciproque). Si l'un est éliminé par un vote direct, l'autre
  meurt aussi ("de chagrin") le même round (`RoundResultPayload.chainEliminated*`) — jamais de
  chaîne au-delà de ce second joueur, et cette mort en chaîne ne déclenche elle-même aucune
  réaction spéciale (règle unificatrice).
- **Protecteur** (camp civils) : une fois par partie, pendant la phase `voting`
  (`protector:protect { targetPlayerId }`), désigne un joueur à protéger. Si ce joueur est la
  cible du vote majoritaire du round, personne n'est éliminé
  (`RoundResultPayload.protectedThisRound = true`, sans jamais révéler qui a protégé). Capacité
  consommée dès la soumission, que ça "serve" ou non ce round-là.
- **Revenant** (camp civils) : quand il est éliminé par un vote direct, reste éligible à voter
  (`vote:submit`) une dernière fois au round de vote suivant malgré `alive = false`, puis perd
  définitivement ce droit — que ce vote bonus ait été utilisé ou non. Un départ/déconnexion
  pendant cette fenêtre annule le vote bonus (jamais de réaction spéciale sur ce chemin).
- **Bouffon** (camp solo) : gagne seul, immédiatement (`winner: 'jester'`), s'il est éliminé par
  un vote direct — jamais sur une mort en chaîne. N'est jamais compté dans `civilsAlive` ni
  `undercoverAlive` (§4).
- **Chasseur** (camp civils) : quand il est éliminé par un vote direct, la room entre en phase
  `hunter_shoot` (calquée sur `mrwhite_guess`, même minuteur serveur) — il choisit une cible
  vivante à éliminer aussi (`hunter:shoot { targetPlayerId }`, `null` = il passe), ou le
  minuteur résout automatiquement un passage. Ce tir n'a lui-même aucun déclencheur en chaîne,
  même si sa cible aurait normalement dû en produire un (règle unificatrice — bornage
  volontaire).

---

## 3. Déroulement d'une partie (machine à états serveur)

```
lobby → reveal → discussion → voting → round_result → (discussion | mrwhite_guess | hunter_shoot | game_over)
mrwhite_guess → round_result   [devinette traitée, retour round_result pour round:continue]
hunter_shoot → round_result   [tir traité, retour round_result pour round:continue]
(reveal | discussion | voting | round_result | mrwhite_guess | hunter_shoot) → aborted   [départ volontaire de l'hôte, voir §5]
(reveal | discussion | voting | round_result | mrwhite_guess | hunter_shoot | game_over) → reveal   [game:restart, host only]
```

- **lobby** : joueurs rejoignent, host règle les paramètres et la liste de paires, host lance.
- **reveal** : chaque client reçoit son rôle en privé (`role:private`), écran individuel,
  jamais de diffusion publique. Le host déclenche le passage à `discussion` une fois que tous
  les joueurs ont confirmé avoir vu leur rôle (ou après un délai).
- **discussion** : aucune interaction applicative — l'app affiche uniquement l'ordre de
  passage (`turnOrder`, mélangé aléatoirement au round 1, recalculé chaque round en retirant
  les éliminés en conservant l'ordre relatif) avec le nom de chaque joueur, à titre indicatif.
  Les joueurs décrivent leur champion à voix haute, hors app, dans cet ordre. **Pas de
  minuteur, pas de saisie d'indice.** Quand la discussion est terminée, l'hôte déclenche
  `round:startVoting` pour passer à `voting` — c'est lui seul qui juge le moment venu.
- **voting** : vote secret simultané. Un joueur vivant (ou un Revenant avec son vote bonus, voir
  §2) vote pour un autre joueur vivant (pas pour lui-même). `room:state` expose uniquement qui A
  voté (booléen), jamais la cible, avant le dépouillement. Si un Protecteur est présent, il peut
  en plus soumettre une seule fois par partie `protector:protect { targetPlayerId }` (voir §2) —
  action indépendante de son propre vote. **Pas de minuteur** : le dépouillement se déclenche dès
  que tous les votants éligibles ont voté.
- **round_result** : dépouillement. Le joueur avec le plus de votes est éliminé, sauf si le
  Protecteur l'a protégé ce round (voir §2 — traité comme "personne n'est éliminé", sans révéler
  qui a protégé). **Égalité au sommet → personne n'est éliminé ce round** (règle MVP explicite,
  pas de second tour). Le rôle de l'éliminé est révélé à tous ; son champion n'est révélé que si
  `settings.revealChampionOnElimination === true`. Si l'éliminé a un(e) Amoureux·se encore
  vivant(e), celui-ci/celle-ci meurt aussi le même round (voir §2, `chainEliminated*`). Puis :
  - si l'éliminé est le Bouffon : victoire immédiate (`winner: 'jester'`), `game_over` —
    court-circuite tout le reste (voir §2, règle unificatrice).
  - sinon si l'éliminé est Mr White : passage à `mrwhite_guess`.
  - sinon si l'éliminé est le Chasseur : passage à `hunter_shoot`.
  - sinon on évalue les conditions de victoire (section 4) ; si aucune, host déclenche le
    round suivant (`round:continue`) → retour à `discussion` avec les joueurs restants.
- **mrwhite_guess** : le joueur éliminé (Mr White) a une fenêtre pour proposer un nom de
  champion (`mrwhite:guess`). Comparaison insensible à la casse/accents avec le champion A
  (celui des civils). Bonne réponse → Mr White gagne immédiatement, `game_over`. Mauvaise
  réponse ou timeout → on réévalue les conditions de victoire section 4 comme si Mr White
  n'avait pas deviné.
- **hunter_shoot** : le joueur éliminé (Chasseur) a une fenêtre pour tirer sur un joueur vivant
  (`hunter:shoot { targetPlayerId }`, `null` = il passe) qui est alors éliminé aussi. Timeout
  serveur équivaut à passer. Ce tir ne déclenche lui-même aucune réaction en chaîne (voir §2).
  Retour à `round_result` avec le nouveau résultat, puis réévaluation des conditions de victoire
  section 4 comme pour `mrwhite_guess`.
- **game_over** : révélation complète (tous les rôles + champions de tous les joueurs) via
  `game:ended`, affichage du vainqueur. Host peut relancer (`game:restart`) une nouvelle
  partie dans la même room (nouveaux rôles/champions, mêmes joueurs/paramètres).
- **Relance à tout moment (`game:restart`)** : au-delà de `game_over`, l'hôte peut aussi
  relancer (bouton dédié côté client, voir §5/§6) depuis n'importe quelle phase de partie en
  cours (`reveal` à `mrwhite_guess`) — abandonne immédiatement la manche en cours et retire de
  nouveaux rôles/champions pour tous les joueurs. Seules `lobby` (utiliser `game:start`) et
  `aborted` (terminale) refusent cet événement.
- **aborted** : phase terminale atteinte uniquement quand l'hôte quitte explicitement une
  partie en cours (§5) — pas de vainqueur, pas de révélation des rôles. Les clients affichent
  un écran "partie terminée" avec retour à l'accueil ; aucune reprise possible depuis cette
  room (contrairement à `game_over` → `game:restart`).

---

## 4. Conditions de victoire (évaluées après chaque élimination, dans cet ordre)

Soit `civilsAlive`, `undercoverAlive`, `mrWhiteAlive` les décomptes parmi les joueurs encore
en vie après l'élimination (et après une éventuelle non-élimination sur égalité/protection —
dans ce cas pas de réévaluation, la partie continue). `civilsAlive` inclut civil/spy/protector/
ghost/hunter (voir §2) ; le Bouffon (`jester`) n'est JAMAIS compté ni dans `civilsAlive` ni dans
`undercoverAlive`.

0. **Victoire immédiate du Bouffon** s'il vient d'être éliminé par un vote direct (cf. §2/§3) —
   traitée avant toute autre évaluation, court-circuite les cas 1 à 4.
1. Victoire immédiate de Mr White s'il vient d'être éliminé et devine correctement (cf. §3).
2. **Civils gagnent** si `undercoverAlive === 0 && mrWhiteAlive === 0`.
3. **Undercover gagnent** si `undercoverAlive > 0 && undercoverAlive >= civilsAlive`.
4. **Mr White gagne (survie)** si `undercoverAlive === 0 && mrWhiteAlive > 0 && mrWhiteAlive >= civilsAlive`.
   — Extension au-delà du texte littéral de la spec, ajoutée pour éliminer tout risque de
   partie infinie quand seuls des civils et un Mr White survivant restent ; à documenter comme
   décision de conception dans le rapport final.
5. Sinon la partie continue.

Cette formule reste mathématiquement complète (aucun état atteignable ne tombe hors des cas
0 à 4) — le Bouffon ne bloque jamais les cas 2/3/4 puisqu'il n'est compté dans aucun des deux
décomptes qu'ils utilisent.

---

## 5. Room, codes, reconnexion

- Code de room : 5 caractères, alphabet `ABCDEFGHJKMNPQRSTUVWXYZ23456789` (sans 0/O/1/I pour
  éviter les confusions à l'oral/à l'écrit), généré unique parmi les rooms actives.
- **Lien d'invitation** : convenience purement client, aucun événement socket dédié — le Lobby
  expose `${origin}/play/{universe}?code={roomCode}` (bouton "Copier le lien d'invitation").
  `Home` (route `/play/:universe`) lit le paramètre `?code=` s'il est présent pour préremplir le
  code et basculer directement sur l'onglet "Rejoindre" ; le flux `room:join` derrière reste
  strictement identique (même validation, mêmes erreurs).
- **Pseudo mémorisé** : convenience purement client — `Home` sauvegarde le pseudo saisi dans
  `localStorage['lolcover:pseudo']` (voir `client/src/lib/session.ts`) et le pré-remplit à la
  prochaine visite, pour "Créer" comme pour "Rejoindre". Indépendant de toute room ; aucun
  impact sur le contrat socket (`room:create`/`room:join` reçoivent toujours un `hostName`/
  `playerName` explicite dans le payload).
- Room pleine : max 12 joueurs, `room:join` renvoie une erreur `ROOM_FULL`.
- Room introuvable/code invalide : erreur `ROOM_NOT_FOUND`.
- Room en jeu (phase ≠ lobby) : un nouveau joueur (jamais vu) ne peut pas rejoindre, erreur
  `GAME_IN_PROGRESS` — seule une reconnexion (`room:rejoin`) d'un joueur déjà connu est admise.
- **Reconnexion** : à la création/jointure, le serveur renvoie `{ playerId, sessionToken }`
  (deux UUID v4 distincts). Le client les stocke en `localStorage` sous la clé
  `lolcover:{roomCode}`. À la (re)connexion du socket, le client émet
  `room:rejoin { roomCode, playerId, sessionToken }`. Le serveur vérifie la correspondance
  exacte, rebranche le socket.id sur le siège existant, marque `connected: true`, et renvoie
  l'état complet adapté (y compris `role:private` à nouveau si la partie est en cours). Token
  invalide/expiré → erreur `INVALID_SESSION`, le client retombe sur l'écran d'accueil.
- **Reprise depuis le menu principal** : `room:rejoin` n'était auparavant déclenché que si le
  client atterrissait directement sur `/room/{roomCode}` (lien gardé, onglet jamais fermé) — en
  revanche fermer l'onglet puis rouvrir l'app sur `/` n'offrait aucun moyen de revenir dans la
  partie sans retaper l'URL exacte. `MainMenu` liste désormais, au montage, tous les codes de
  room ayant encore une session valide en `localStorage` (`lib/session.ts` :
  `listStoredRoomCodes`) et propose un bouton "Reprendre" par room, qui navigue simplement vers
  `/room/{roomCode}` — le flux `room:rejoin` existant s'occupe du reste (session invalide/room
  expirée → nettoyage silencieux et retour à `/`, cf. `GameRoute`).
- **Déconnexion** : un joueur dont le socket se déconnecte reste dans la room avec
  `connected: false` pendant 3 minutes (timer serveur). En phase `voting`, le dépouillement
  attend que tous les joueurs vivants aient voté — un joueur déconnecté qui n'a pas encore
  voté retarde donc le dépouillement jusqu'à sa reconnexion ou l'expiration des 3 minutes de
  grâce (après quoi il est retiré de la partie, voir ci-dessous, ce qui débloque le vote).
  Passé 3 minutes sans reconnexion, le joueur est marqué éliminé (rôle révélé) si la partie
  est en cours, ou retiré si en lobby.
- **Host déconnecte** (perte de connexion accidentelle) : le rôle d'host est transféré
  automatiquement au joueur connecté suivant par ordre d'arrivée dans la room ; la partie
  continue normalement.
- **Host quitte explicitement une partie en cours** (bouton "Quitter", visible pour l'hôte de
  `reveal` à `mrwhite_guess`/`hunter_shoot`) : contrairement à une déconnexion, il n'y a **pas** de transfert
  de host — la partie se termine immédiatement pour tout le monde, la room passe en phase
  `aborted` (voir §6). Un départ volontaire de l'hôte en phase `lobby` reste un simple retrait
  (transfert de host normal, la room continue en lobby).
- **Room vide** : quand plus aucun joueur n'est connecté (0 socket actif), la room est détruite
  après 5 minutes.

---

## 6. Événements Socket.io (contrat exact)

Convention : `->` client vers serveur (avec ack éventuel), `<-` serveur vers client(s).
**PRIVATE** = envoyé uniquement au socket du joueur concerné, jamais broadcast.
**PUBLIC** = broadcast à toute la room, ne doit JAMAIS contenir de champ role/champion d'autrui.

```ts
// ---- Types partagés (à dupliquer identiquement server/src et client/src) ----

// Univers de contenu choisi au menu principal (voir §0/§7) — même moteur de jeu, trois pools
// de paires indépendants. Aucun asset visuel officiel dans les trois cas.
type Universe = 'lol' | 'smash' | 'pokemon';

interface ChampionPair {
  id: string;
  champA: string;
  champB: string;
  theme: string;      // ex: "Tanks brutaux", "Duo assassins mêlée"
  lanes?: string[];   // ex: ["Top"], optionnel (univers 'lol' uniquement)
}

interface RoomSettings {
  mrWhiteEnabled: boolean;
  revealChampionOnElimination: boolean;
  spyEnabled: boolean;
  loversEnabled: boolean;
  protectorEnabled: boolean;
  ghostEnabled: boolean;
  jesterEnabled: boolean;
  hunterEnabled: boolean;
}

type GamePhase = 'lobby' | 'reveal' | 'discussion' | 'voting' | 'round_result'
               | 'mrwhite_guess' | 'hunter_shoot' | 'game_over' | 'aborted';

interface PublicPlayer {
  playerId: string;
  name: string;
  isHost: boolean;
  connected: boolean;
  alive: boolean;
  avatarSeed: string; // déterministe (hash du playerId), pour silhouette/couleur custom
}

interface RoomStatePublic {
  roomCode: string;
  universe: Universe;           // fixé à la création, jamais modifiable ensuite
  phase: GamePhase;
  players: PublicPlayer[];
  settings: RoomSettings;
  round: number;
  turnOrder: string[];          // playerIds, ordre d'affichage indicatif (phase discussion)
  votedPlayerIds: string[];     // qui a voté (pas pour qui), phase voting
  phaseDeadline: number | null; // epoch ms, pour le compte à rebours client (reveal / mrwhite_guess / hunter_shoot uniquement)
}

// Chat texte libre entre joueurs d'une room — pure convenience, hors boucle de jeu (aucun
// impact sur la machine à états, jamais de role/champion). Tampon serveur borné à
// CHAT_HISTORY_LIMIT (50) messages par room, rejoué une fois via 'chat:history' à la
// connexion/reconnexion — pas d'archivage long terme.
interface ChatMessage {
  id: string;
  playerId: string;
  name: string;
  text: string;
  ts: number; // epoch ms
}

// ---- Client -> Serveur ----
'room:create'   { hostName: string, universe: Universe } -> ack { ok: true, roomCode, playerId, sessionToken } | { ok: false, error }
'room:join'     { roomCode: string, playerName: string } -> ack { ok, playerId?, sessionToken?, error? }
'room:rejoin'   { roomCode: string, playerId: string, sessionToken: string } -> ack { ok, error? }
'settings:update' { settings: Partial<RoomSettings> }               // host only
'game:start'    {}                                                  // host only, phase lobby
'reveal:ack'    {}                                                  // joueur confirme avoir vu son rôle
'round:startVoting' {}                                              // host only, phase discussion
'vote:submit'   { targetPlayerId: string }                          // votant éligible (vivant ou Revenant), une fois/round
'protector:protect' { targetPlayerId: string }                      // le Protecteur vivant, UNE fois par partie, phase voting
'mrwhite:guess' { championGuess: string }                           // le Mr White éliminé, une fois
'hunter:shoot'  { targetPlayerId: string | null }                   // le Chasseur éliminé, une fois (null = passe)
'round:continue' {}                                                 // host only
'game:restart'  {}                                                  // host only, toute phase sauf lobby/aborted
'player:leave'  {}                                                  // hôte + partie en cours -> termine la partie (§5), sinon départ normal
'chat:send'     { text: string }                                    // n'importe quel joueur, n'importe quelle phase, texte non vide (300 car. max)

// ---- Serveur -> Client(s) ----
'room:state'    RoomStatePublic                          // PUBLIC, à chaque changement d'état
'role:private'  {                                         // PRIVATE, envoyé à reveal + à la reconnexion si phase >= reveal
  role: Role,
  champion: string | null,
  loverName?: string | null,          // si loversEnabled et ce joueur est un des 2 Amoureux
  spyInsight?: { playerName: string, team: 'civils' | 'undercover' | 'mrwhite' | 'jester' }, // rôle Espion uniquement
}
'round:result'  {                                          // PUBLIC
  eliminatedPlayerId: string | null,  // null si égalité, protection, ou tir du Chasseur décliné
  eliminatedRole: Role | null,
  eliminatedChampion: string | null,  // selon settings.revealChampionOnElimination, sinon null
  voteCounts: Record<string, number>,
  tie: boolean,
  protectedThisRound?: boolean,       // le Protecteur a annulé l'élimination (jamais qui)
  chainEliminatedPlayerId?: string | null,  // Amoureux : mort de chagrin le même round
  chainEliminatedRole?: Role | null,
  chainEliminatedChampion?: string | null,
  hunterDeclined?: boolean,           // ce round_result représente un tir du Chasseur décliné
}
'game:ended'    {                                          // PUBLIC — révélation complète, fin de partie uniquement
  winner: 'civils' | 'undercover' | 'mrwhite' | 'jester',
  reveal: { playerId: string, name: string, role: Role, champion: string | null, loverPlayerId?: string | null }[],
}
'error'         { code: string, message: string }          // au socket d'origine uniquement
'chat:message'  ChatMessage                                 // PUBLIC, à chaque chat:send accepté
'chat:history'  ChatMessage[]                               // PRIVATE, une fois à room:create/room:join/room:rejoin réussis
```

Règle absolue vérifiable par QA : à aucun moment, pour aucun événement PUBLIC, un champ
`role` ou `champion` d'un AUTRE joueur que le destinataire n'apparaît dans le payload —
sauf dans `game:ended` (fin de partie, révélation totale voulue) et `round:result` pour le
seul joueur qui vient d'être éliminé.

---

## 7. Contenu — paires de champions/combattants/Pokémon

Le serveur détient **trois pools indépendants**, un par univers (`server/src/content/pairsStore.ts`,
voir §6 `Universe`) — les paires League of Legends, Smash Bros Ultimate et Pokémon ne se
mélangent jamais, et chaque room n'accède qu'au pool de son propre `universe`.

- **Univers `'lol'`** — `server/src/content/championPairs.ts` (≥80 paires, couvrant tout le
  roster de base, thème + lane(s) si
  pertinent), en partant de : Garen/Darius, Ashe/Sivir, Katarina/Talon, Lux/Morgana,
  Malphite/Ornn, Miss Fortune/Caitlyn, Jinx/Vayne, Yasuo/Yone, Vi/Jax, Nidalee/Rengar,
  Xin Zhao/Renekton, Ezreal/Kai'Sa, Annie/Zoe, Braum/Thresh, Soraka/Janna, Shen/Zed,
  Fiora/Riven, Karma/Sona, Teemo/Heimerdinger, Nautilus/Illaoi, Kled/Rumble, Ahri/Neeko,
  Diana/Leona, Tristana/Corki.
- **Univers `'smash'`** — `server/src/content/smashPairs.ts` (≥65 paires, thème = lien de
  moveset/lore — Echo Fighter officiel, clone, rivalité canon), ex. Mario/Luigi, Fox/Falco,
  Marth/Lucina, Pit/Dark Pit, Pikachu/Pichu. Inclut aussi des combattants DLC (Fighters Pass 1 &
  2) et des personnages de trophées d'aide appariés à des combattants du roster.
- **Univers `'pokemon'`** — `server/src/content/pokemonPairs.ts` (≥130 paires, noms en français
  officiel contrairement aux deux autres univers qui gardent l'anglais — les Pokémon ont une
  vraie traduction FR largement plus connue du public visé). Pool volontairement très chargé en
  paires difficiles (formes régionales Alola/Galar/Hisui quasi identiques, duos/trios légendaires
  jumeaux), avec nettement moins de paires moyennes et encore moins de paires faciles.

Chaque pool est une **liste fixe définie en code**, sans édition possible en cours de partie
(pas d'UI host pour ajouter/désactiver une paire) : à `game:start`/`game:restart`, le serveur
tire une paire au hasard dans le pool entier de l'univers de la room. Décision de conception :
un pool global mutable partagé entre toutes les rooms d'un univers (ancienne mécanique
`pairs:add`/`pairs:toggle`/`pairs:remove`) faisait qu'une action d'un host affectait aussi les
rooms des autres hosts en cours de partie simultanément — contraire à l'exigence que chaque
partie soit indépendante. Le pool étant maintenant immuable, ce risque n'existe plus.

Chaque pool mélange volontairement des paires très proches (undercover difficile à repérer,
ex. Echo Fighters officiels côté `'smash'`, frères/rivaux canon côté `'lol'`, formes régionales
côté `'pokemon'`) et des paires plus éloignées (undercover plus facilement repérable) — voir les
commentaires en tête de `championPairs.ts` / `smashPairs.ts` / `pokemonPairs.ts`.

---

## 8. Design system (résumé — le détail vit dans /design)

- Palette inspirée Hextech (or, bleu acier, fond sombre) sans aucun asset Riot officiel.
- 2-3 polices max : une display à caractère pour titres, une lisible pour le texte.
- Grille d'espacement 4/8px.
- Icônes custom SVG maison pour rôles (Civil/Undercover/MrWhite/Espion/Protecteur/Revenant/
  Bouffon/Chasseur) et lanes (Top/Jungle/Mid/ADC/Support).
- Mobile-first, cibles tactiles ≥44px, jamais de :hover comme seule affordance.
- WCAG AA minimum, focus visibles.

---

## 9. Ordre de production (rappel)

Design (maquettes statiques, aucune logique) → Backend + Contenu (en parallèle, zéro
dépendance visuelle) → Frontend (attend les maquettes Design ET le contrat ci-dessus) → QA →
Correction (boucle avec QA).

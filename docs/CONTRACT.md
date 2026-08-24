# CONTRACT.md — source de vérité unique

Ce document est LA référence technique du projet. Tout agent (Design, Frontend, Backend,
Contenu, QA, Correction) doit lire ce fichier intégralement avant de produire quoi que ce
soit, et ne doit jamais s'en écarter sans mettre ce fichier à jour d'abord.

Nom du projet : **lolCover**. Jeu façon Undercover/Mr White, multijoueur temps réel, un joueur
par appareil. Un menu principal propose le choix entre deux **univers** de contenu
(`Universe`, voir §6) qui partagent exactement le même moteur de jeu : **League of Legends**
(`'lol'`) et **Super Smash Bros Ultimate** (`'smash'`).

---

## 0. Frontière propriété intellectuelle (IMPORTANT — lire avant de designer/contenu)

Vaut pour les DEUX univers de contenu (League of Legends et Super Smash Bros Ultimate).

- **Autorisé et requis** : les noms de champions/combattants en texte brut (Garen, Darius,
  Ashe, ... / Mario, Fox, Marth, ...). Le jeu ne fonctionne pas sans eux — ne pas les
  génériciser, ne pas les remplacer par des noms inventés.
- **Interdit** : tout asset visuel officiel Riot Games ou Nintendo/Sakurai — splash arts,
  artworks/rendus officiels, icônes de personnage officielles, logos (Riot/League of Legends,
  Nintendo/Super Smash Bros), polices ou charte graphique copiées de leurs sites.
- Toute représentation visuelle d'un champion/combattant doit être une création originale
  (typographie du nom, silhouette géométrique stylisée maison, motif abstrait, dégradé propre
  au design system défini section 4) — identique dans les deux univers.

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
type Role = 'civil' | 'undercover' | 'mrwhite';

interface PlayerRole {
  playerId: string;
  role: Role;
  champion: string | null; // null uniquement pour mrwhite
}
```

### Table de répartition (exacte, obligatoire — pas d'improvisation)

| Joueurs (N) | Undercover | Mr White disponible (toggle host) |
|---|---|---|
| 3 | 1 | non |
| 4 | 1 | non |
| 5–8 | 1 | oui, défaut désactivé |
| 9–12 | 2 | oui, défaut désactivé |

- Civils = N − undercover − (mrWhite activé ? 1 : 0).
- Mr White est un joueur au maximum, jamais plus.
- Cette table garantit toujours civils ≥ (undercover + mrWhite) + 1 au lancement — ne pas
  permettre un réglage qui violerait cette invariante (le host ne peut pas activer Mr White
  si N < 5 ; le toggle doit être désactivé/grisé côté UI dans ce cas).
- Champion A (majoritaire) attribué aux civils, champion B (proche) attribué aux undercover,
  aucun champion à Mr White.
- Tirage : une paire de champions est choisie aléatoirement dans le pool entier de l'univers de
  la room (voir §7) ; les rôles sont ensuite distribués aléatoirement parmi les joueurs selon la
  table ci-dessus.

---

## 3. Déroulement d'une partie (machine à états serveur)

```
lobby → reveal → discussion → voting → round_result → (discussion | mrwhite_guess | game_over)
(reveal | discussion | voting | round_result | mrwhite_guess) → aborted   [départ volontaire de l'hôte, voir §5]
(reveal | discussion | voting | round_result | mrwhite_guess | game_over) → reveal   [game:restart, host only]
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
- **voting** : vote secret simultané. Un joueur vivant vote pour un autre joueur vivant (pas
  pour lui-même). `room:state` expose uniquement qui A voté (booléen), jamais la cible, avant
  le dépouillement. **Pas de minuteur** : le dépouillement se déclenche dès que tous les
  joueurs vivants ont voté.
- **round_result** : dépouillement. Le joueur avec le plus de votes est éliminé. **Égalité au
  sommet → personne n'est éliminé ce round** (règle MVP explicite, pas de second tour). Le
  rôle de l'éliminé est révélé à tous ; son champion n'est révélé que si
  `settings.revealChampionOnElimination === true`. Puis :
  - si l'éliminé est Mr White ET qu'il y a eu élimination : passage à `mrwhite_guess`.
  - sinon on évalue les conditions de victoire (section 4) ; si aucune, host déclenche le
    round suivant (`round:continue`) → retour à `discussion` avec les joueurs restants.
- **mrwhite_guess** : le joueur éliminé (Mr White) a une fenêtre pour proposer un nom de
  champion (`mrwhite:guess`). Comparaison insensible à la casse/accents avec le champion A
  (celui des civils). Bonne réponse → Mr White gagne immédiatement, `game_over`. Mauvaise
  réponse ou timeout → on réévalue les conditions de victoire section 4 comme si Mr White
  n'avait pas deviné.
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
en vie après l'élimination (et après une éventuelle non-élimination sur égalité — dans ce cas
pas de réévaluation, la partie continue).

1. Victoire immédiate de Mr White s'il vient d'être éliminé et devine correctement (cf. §3).
2. **Civils gagnent** si `undercoverAlive === 0 && mrWhiteAlive === 0`.
3. **Undercover gagnent** si `undercoverAlive > 0 && undercoverAlive >= civilsAlive`.
4. **Mr White gagne (survie)** si `undercoverAlive === 0 && mrWhiteAlive > 0 && mrWhiteAlive >= civilsAlive`.
   — Extension au-delà du texte littéral de la spec, ajoutée pour éliminer tout risque de
   partie infinie quand seuls des civils et un Mr White survivant restent ; à documenter comme
   décision de conception dans le rapport final.
5. Sinon la partie continue.

Cette formule est mathématiquement complète (aucun état atteignable ne tombe hors des 4 cas).

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
  `reveal` à `mrwhite_guess`) : contrairement à une déconnexion, il n'y a **pas** de transfert
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

// Univers de contenu choisi au menu principal (voir §0/§7) — même moteur de jeu, deux pools
// de paires indépendants. Aucun asset visuel officiel dans les deux cas.
type Universe = 'lol' | 'smash';

interface ChampionPair {
  id: string;
  champA: string;
  champB: string;
  theme: string;      // ex: "Tanks brutaux", "Duo assassins mêlée"
  lanes?: string[];   // ex: ["Top"], optionnel
}

interface RoomSettings {
  mrWhiteEnabled: boolean;
  revealChampionOnElimination: boolean;
}

type GamePhase = 'lobby' | 'reveal' | 'discussion' | 'voting' | 'round_result'
               | 'mrwhite_guess' | 'game_over' | 'aborted';

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
  phaseDeadline: number | null; // epoch ms, pour le compte à rebours client (reveal / mrwhite_guess uniquement)
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
'vote:submit'   { targetPlayerId: string }                          // joueur vivant, une fois/round
'mrwhite:guess' { championGuess: string }                           // le Mr White éliminé, une fois
'round:continue' {}                                                 // host only
'game:restart'  {}                                                  // host only, toute phase sauf lobby/aborted
'player:leave'  {}                                                  // hôte + partie en cours -> termine la partie (§5), sinon départ normal
'chat:send'     { text: string }                                    // n'importe quel joueur, n'importe quelle phase, texte non vide (300 car. max)

// ---- Serveur -> Client(s) ----
'room:state'    RoomStatePublic                          // PUBLIC, à chaque changement d'état
'role:private'  { role: Role, champion: string | null }  // PRIVATE, envoyé à reveal + à la reconnexion si phase >= reveal
'round:result'  {                                          // PUBLIC
  eliminatedPlayerId: string | null,  // null si égalité = personne éliminé
  eliminatedRole: Role | null,
  eliminatedChampion: string | null,  // selon settings.revealChampionOnElimination, sinon null
  voteCounts: Record<string, number>,
  tie: boolean,
}
'game:ended'    {                                          // PUBLIC — révélation complète, fin de partie uniquement
  winner: 'civils' | 'undercover' | 'mrwhite',
  reveal: { playerId: string, name: string, role: Role, champion: string | null }[],
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

## 7. Contenu — paires de champions/combattants

Le serveur détient **deux pools indépendants**, un par univers (`server/src/content/pairsStore.ts`,
voir §6 `Universe`) — les paires League of Legends et Smash Bros Ultimate ne se mélangent
jamais, et chaque room n'accède qu'au pool de son propre `universe`.

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

Chaque pool est une **liste fixe définie en code**, sans édition possible en cours de partie
(pas d'UI host pour ajouter/désactiver une paire) : à `game:start`/`game:restart`, le serveur
tire une paire au hasard dans le pool entier de l'univers de la room. Décision de conception :
un pool global mutable partagé entre toutes les rooms d'un univers (ancienne mécanique
`pairs:add`/`pairs:toggle`/`pairs:remove`) faisait qu'une action d'un host affectait aussi les
rooms des autres hosts en cours de partie simultanément — contraire à l'exigence que chaque
partie soit indépendante. Le pool étant maintenant immuable, ce risque n'existe plus.

Chaque pool mélange volontairement des paires très proches (undercover difficile à repérer,
ex. Echo Fighters officiels côté `'smash'`, frères/rivaux canon côté `'lol'`) et des paires plus
éloignées (undercover plus facilement repérable) — voir les commentaires en tête de
`championPairs.ts` / `smashPairs.ts`.

---

## 8. Design system (résumé — le détail vit dans /design)

- Palette inspirée Hextech (or, bleu acier, fond sombre) sans aucun asset Riot officiel.
- 2-3 polices max : une display à caractère pour titres, une lisible pour le texte.
- Grille d'espacement 4/8px.
- Icônes custom SVG maison pour rôles (Civil/Undercover/MrWhite) et lanes (Top/Jungle/Mid/ADC/Support).
- Mobile-first, cibles tactiles ≥44px, jamais de :hover comme seule affordance.
- WCAG AA minimum, focus visibles.

---

## 9. Ordre de production (rappel)

Design (maquettes statiques, aucune logique) → Backend + Contenu (en parallèle, zéro
dépendance visuelle) → Frontend (attend les maquettes Design ET le contrat ci-dessus) → QA →
Correction (boucle avec QA).

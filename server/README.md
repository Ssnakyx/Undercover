# lolCover — serveur

Serveur temps réel (Express + Socket.io, TypeScript, état en mémoire process) pour lolCover.
Implémente intégralement `docs/CONTRACT.md` : machine à états de partie, distribution des
rôles, conditions de victoire, reconnexion, et les événements socket exacts de la section 6.

## Installation

```bash
cd server
npm install
```

## Lancer le serveur (dev)

```bash
npm run dev
```

Démarre sur `http://localhost:3001` (variable d'env `PORT` pour changer le port), avec
rechargement automatique (`tsx watch`) et CORS ouvert (`origin: '*'`) pour que le client Vite,
lancé sur un autre port, puisse s'y connecter sans configuration supplémentaire.

Un endpoint `GET /health` renvoie `{ ok: true }` pour vérifier rapidement que le serveur tourne.

Pour lancer sans watch (ex: staging) :

```bash
npm start
```

Pour compiler en JavaScript (`dist/`) :

```bash
npm run build
```

## Déploiement (Render)

Ce serveur maintient l'état des parties **en mémoire dans un seul process** (`Map<roomCode,
Room>`) et garde des connexions Socket.io ouvertes en continu : il lui faut un hébergement à
process Node persistant (pas de serverless/edge functions à froid). Render convient bien
(free tier suffisant pour tester) ; Railway ou Fly.io fonctionnent de la même façon.

1. Pousser le repo sur GitHub (ou GitLab/Bitbucket).
2. Sur [render.com](https://render.com) : **New > Web Service**, connecter le repo.
3. Réglages du service :
   - **Root Directory** : `server`
   - **Runtime** : Node
   - **Build Command** : `npm install && npm run build`
   - **Start Command** : `node dist/index.js`
   - **Health Check Path** : `/health`
4. Aucune variable d'env obligatoire — Render fournit `PORT` automatiquement, déjà lu par
   `src/index.ts`. Render assigne une URL publique du type
   `https://lolcover-server.onrender.com` : c'est cette URL qu'il faut renseigner comme
   `VITE_SERVER_URL` côté client (voir `client/README.md`).

`server/render.yaml` documente ces mêmes réglages (référence/reproductibilité) — le plus
fiable reste de les saisir manuellement dans le dashboard Render tel que décrit ci-dessus, les
Blueprints Render cherchant `render.yaml` à la racine du repo par défaut, pas dans un
sous-dossier.

Le CORS du serveur est ouvert (`origin: '*'`, voir `src/index.ts`) : aucune configuration de
domaine à faire côté serveur pour autoriser le client déployé sur Vercel.

## Lancer les tests unitaires

```bash
npm test
```

Utilise Vitest. Couvre :
- `test/roles.test.ts` — table de répartition des rôles (N=3..12, avec/sans Mr White, y
  compris les cas où Mr White est indisponible même si demandé) et `assignRoles`.
- `test/winConditions.test.ts` — les 4 cas de victoire (section 4 du contrat) + cas limites,
  et la comparaison insensible casse/accents pour la devinette de Mr White.
- `test/reconnection.test.ts` — rejoin valide/invalide, migration de host, expiration du
  délai de grâce de 3 minutes (lobby vs en partie), timers de déconnexion (fake timers).
- `test/engine.test.ts` — retrait d'un joueur de l'ordre de passage affiché, `startVoting`,
  `submitVote`/`tallyVotesAndEliminate` (permissions de phase, auto-vote interdit, cible
  invalide, double vote, égalité, révélation, victoire, entrée en `mrwhite_guess`),
  `resolveMrWhiteTimeout`.

`npm run test:watch` pour le mode watch.

## Décisions de conception au-delà du contrat

Le contrat (`docs/CONTRACT.md`) est la source de vérité et a été suivi à la lettre partout où
il est explicite. Quelques points non couverts littéralement ont nécessité une décision,
documentée ici plutôt qu'improvisée silencieusement :

1. **Timeout de la phase `reveal`** ("...ou après un délai") : le contrat ne définit pas de
   champ `settings` pour ce délai. Constante serveur fixe `REVEAL_ACK_TIMEOUT_MS = 20000`
   (20s) dans `src/game/engine.ts`, plutôt que d'ajouter un champ à `RoomSettings` (qui
   dévierait de l'interface exacte imposée section 6).
2. **Fenêtre de `mrwhite_guess`** : même raisonnement, constante fixe
   `MRWHITE_GUESS_TIMEOUT_MS = 30000` (30s).
3. **Extension de la condition de victoire de Mr White** (section 4, point 4) : déjà
   documentée dans le contrat lui-même comme extension volontaire pour éviter une partie
   infinie ; implémentée telle quelle dans `src/game/winConditions.ts`.
4. **Pas de minuteur en phase `discussion`/`voting`, transition vote déclenchée par l'hôte** :
   `discussion` n'a aucune interaction applicative (juste `turnOrder` affiché à titre
   indicatif — les joueurs parlent à voix haute, hors app, sans saisie d'indice) ; c'est
   l'hôte, via `round:startVoting`, qui juge la discussion close et ouvre le vote. Le vote
   lui-même (`vote:submit`) reste secret et simultané comme dans la version initiale du
   contrat, mais sans `voteTimeSeconds` : le dépouillement se déclenche dès que tous les
   joueurs vivants ont voté, jamais par expiration d'un délai. Décision produit explicite,
   documentée dans `docs/CONTRACT.md` §3.
5. **Migration de host immédiate en cas de déconnexion accidentelle** : le contrat dit "host
   déconnecte → rôle transféré au joueur connecté suivant", sans préciser si c'est immédiat ou
   après le délai de grâce de 3 minutes. Implémenté comme immédiat (dès la déconnexion du
   socket, pas d'attente des 3 minutes) : la room a besoin d'un host actif en permanence pour
   progresser (ex: `round:continue`, réglages). **Exception** : un départ *volontaire* de
   l'hôte (`player:leave`) pendant une partie en cours (phase ≠ `lobby`/`game_over`/`aborted`)
   ne migre pas le host — il termine la partie pour tout le monde (phase `aborted`, voir §5 du
   contrat) via le bouton "Quitter" côté client.
6. **`settings:update` restreint à la phase `lobby`** : cohérent avec le fait que changer les
   timers ou le toggle Mr White en cours de partie serait déroutant. (Les paires de champions
   ne sont plus éditables du tout, en lobby ou ailleurs — voir décision 10.)
7. **Départ hors élimination normale (déconnexion expirée après 3 minutes, ou `player:leave`
   d'un non-host en cours de partie)** : le contrat exige explicitement "rôle révélé" pour le
   cas de la déconnexion expirée. Comme `RoomStatePublic`/`PublicPlayer` n'exposent jamais
   `role`/`champion` d'autrui par construction, cette révélation ciblée réutilise l'événement
   `round:result` existant (avec `eliminatedPlayerId` = le seul joueur concerné) plutôt que
   d'inventer un nouvel événement hors contrat. Le même traitement est appliqué par symétrie à
   `player:leave` d'un non-host en cours de partie (non explicitement spécifié par le contrat
   pour ce cas précis, mais cohérent avec le traitement de la déconnexion expirée). Le départ
   volontaire du *host* en cours de partie suit un chemin distinct (décision 5) : pas de
   révélation ciblée, la partie se termine directement en phase `aborted`.
8. **`game:restart`** : fait repasser directement en phase `reveal` (nouveaux rôles/champions
   tirés) plutôt que de repasser par `lobby`, conformément à l'esprit "nouvelle partie dans la
   même room, mêmes joueurs/paramètres" — le host garde les settings existants et n'a pas à
   relancer `game:start` séparément. Initialement restreint à la phase `game_over`, ouvert
   ensuite à toute phase de partie en cours (`reveal` à `mrwhite_guess`) via un bouton dédié
   côté client (`HostRestartButton`, voir `client/README.md`) — l'hôte peut abandonner et
   redistribuer les rôles à tout moment, pas seulement en fin de partie. Seules `lobby`
   (`game:start` s'en charge déjà) et `aborted` (terminale, voir décision 5) restent exclues.
9. **Ack optionnels sur tous les événements client→serveur** : le contrat ne montre le format
   `-> ack {...}` explicitement que pour `room:create`/`room:join`/`room:rejoin`. Tous les
   autres événements (settings, game:start, vote:submit, etc.) acceptent aussi un
   callback d'ack `{ ok, error? }` en plus de l'événement `error` déjà prévu par le contrat —
   pur ajout de confort côté client, n'entre pas en conflit avec le contrat.
10. **Univers de contenu (`Universe`)** : deux pools de paires totalement indépendants et
    **fixes** (`content/championPairs.ts` / `content/smashPairs.ts`, exposés via
    `content/pairsStore.ts`), choisis une fois pour toutes à la création de la room
    (`room:create.universe`) et jamais modifiables ensuite — rejoindre une room hérite de son
    univers, pas de conversion à la volée. Les pools ne sont plus éditables en cours de partie
    (pas d'UI host, pas d'événements `pairs:*`) : à `game:start`/`game:restart`, le serveur
    tire une paire au hasard dans le pool entier de l'univers. Ce choix élimine par
    construction tout risque qu'une action d'un host affecte les rooms d'autres hosts en cours
    de partie simultanément (l'ancien pool mutable était partagé globalement par univers, pas
    par room).
11. **Chat (`chat:send`/`chat:message`/`chat:history`)** : convenience pure, volontairement hors
    de la machine à états — aucune restriction de phase (fonctionne en lobby comme en pleine
    partie), aucun rôle/permission particulier (n'importe quel joueur de la room). Un tampon
    borné (`CHAT_HISTORY_LIMIT = 50` messages, `Room.chatMessages`) est rejoué une seule fois via
    `chat:history` à `room:create`/`room:join`/`room:rejoin`, pour qu'une reconnexion ne perde
    pas tout le contexte récent — pas d'archivage long terme au-delà de ce tampon, cohérent avec
    le reste du modèle "état en mémoire" de la room (§1).
12. **Score cumulé "mode Soirée"** (`Player.score`, voir `docs/CONTRACT.md` §5ter) : pensé pour
    enchaîner plusieurs parties dans la même room via `game:restart` sans perdre le fil de qui
    devine le mieux. +1 point par partie pour chaque joueur dont le rôle appartenait au camp
    vainqueur (`engine.awardScoreForWinner`, appelé juste avant `enterGameOver`), qu'il ait
    survécu ou non. Jamais réinitialisé par `game:restart` (contrairement à `role`/`champion`/
    `alive`) — seule une nouvelle room repart de zéro, aucun événement `game:resetScores`.

## Sécurité (rappel des invariants vérifiés)

- Aucun événement `room:state` (PUBLIC) ne contient jamais `role`/`champion`, quel que soit le
  joueur — ces champs n'existent tout simplement pas dans `RoomStatePublic`/`PublicPlayer`
  (voir `src/types.ts`), donc structurellement impossibles à leaker par erreur de sérialisation.
- `role:private` n'est émis qu'au socket du joueur concerné (`io.to(player.socketId)`), jamais
  en broadcast room.
- `round:result` ne révèle le rôle/champion que du joueur qui vient d'être éliminé (vote,
  déconnexion expirée, ou départ explicite) — jamais celui des autres.
- `game:ended` révèle tout, volontairement, uniquement en fin de partie.
- Toutes les permissions (host only, joueur vivant only, devineur Mr White only) sont
  vérifiées côté serveur dans `src/socket/handlers.ts` et `src/game/engine.ts` — jamais
  déléguées au client. Ni `discussion` ni `voting` n'ont de minuteur (cf. décision 4
  ci-dessus) ; seuls `reveal` et `mrwhite_guess` gardent un timer serveur (`setTimeout` dans
  `src/socket/handlers.ts`) — `phaseDeadline` n'est qu'une information d'affichage pour le
  client, jamais une source de vérité.

## Structure

```
src/
  types.ts               types partagés (miroir exact du contrat)
  content/
    championPairs.ts     liste de base League of Legends (univers 'lol')
    smashPairs.ts          liste de base Super Smash Bros Ultimate (univers 'smash')
    pairsStore.ts           accès aux pools de paires (fixes), un pool par univers
  game/
    roles.ts              distribution des rôles (pur, testable)
    turnOrder.ts           ordre de passage (pur, testable)
    winConditions.ts       conditions de victoire + comparaison devinette Mr White (pur)
    engine.ts               orchestration de la machine à états (mute Room, sans I/O réseau)
  rooms/
    roomStore.ts           Map<roomCode, Room>, génération de code, expiration
    reconnection.ts         rejoin, migration de host, timers de déconnexion (sans I/O réseau)
  socket/
    events.ts               typage strict des événements (miroir du contrat section 6)
    handlers.ts              tous les handlers socket, permissions, timers, broadcasts
  index.ts                  bootstrap Express + Socket.io
test/
  roles.test.ts
  winConditions.test.ts
  reconnection.test.ts
```

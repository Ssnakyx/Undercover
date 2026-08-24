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
- `test/engine.test.ts` — retrait d'un joueur de l'ordre de passage en cours de round,
  `eliminatePlayer` (permissions de phase, cible invalide, révélation, victoire, entrée en
  `mrwhite_guess`), `resolveMrWhiteTimeout`.

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
4. **Élimination par décision de l'hôte** (remplace le vote de la version initiale du
   contrat) : une fois tous les indices du round donnés (`currentTurnPlayerId === null`),
   l'hôte désigne directement le joueur éliminé via `player:eliminate { targetPlayerId }` —
   pas de vote compté, secret ou chronométré. L'hôte peut cibler n'importe quel joueur vivant,
   lui-même compris. Décision produit explicite, documentée dans `docs/CONTRACT.md` §3.
5. **Migration de host immédiate** : le contrat dit "host quitte/déconnecte → rôle transféré
   au joueur connecté suivant", sans préciser si c'est immédiat ou après le délai de grâce de
   3 minutes. Implémenté comme immédiat (dès la déconnexion du socket, pas d'attente des 3
   minutes) : la room a besoin d'un host actif en permanence pour progresser (ex:
   `round:continue`, réglages).
6. **`settings:update` / `pairs:add` / `pairs:toggle` / `pairs:remove` restreints à la phase
   `lobby`** : le contrat section 7 dit "depuis le lobby" pour l'édition des paires ; étendu
   par cohérence aux réglages de la room (changer les timers ou le toggle Mr White en cours de
   partie serait déroutant et n'est pas couvert par le contrat).
7. **Départ hors élimination normale (déconnexion expirée après 3 minutes, ou `player:leave`
   en cours de partie)** : le contrat exige explicitement "rôle révélé" pour le cas de la
   déconnexion expirée. Comme `RoomStatePublic`/`PublicPlayer` n'exposent jamais
   `role`/`champion` d'autrui par construction, cette révélation ciblée réutilise l'événement
   `round:result` existant (avec `eliminatedPlayerId` = le seul joueur concerné) plutôt que
   d'inventer un nouvel événement hors contrat. Le même traitement est appliqué par symétrie à
   `player:leave` en cours de partie (non explicitement spécifié par le contrat pour ce cas
   précis, mais cohérent avec le traitement de la déconnexion expirée).
8. **`game:restart`** : fait repasser directement en phase `reveal` (nouveaux rôles/champions
   tirés) plutôt que de repasser par `lobby`, conformément à l'esprit "nouvelle partie dans la
   même room, mêmes joueurs/paramètres" — le host garde les settings existants et n'a pas à
   relancer `game:start` séparément.
9. **Ack optionnels sur tous les événements client→serveur** : le contrat ne montre le format
   `-> ack {...}` explicitement que pour `room:create`/`room:join`/`room:rejoin`. Tous les
   autres événements (settings, pairs, game:start, clue:submit, etc.) acceptent aussi un
   callback d'ack `{ ok, error? }` en plus de l'événement `error` déjà prévu par le contrat —
   pur ajout de confort côté client, n'entre pas en conflit avec le contrat.

## Sécurité (rappel des invariants vérifiés)

- Aucun événement `room:state` (PUBLIC) ne contient jamais `role`/`champion`, quel que soit le
  joueur — ces champs n'existent tout simplement pas dans `RoomStatePublic`/`PublicPlayer`
  (voir `src/types.ts`), donc structurellement impossibles à leaker par erreur de sérialisation.
- `role:private` n'est émis qu'au socket du joueur concerné (`io.to(player.socketId)`), jamais
  en broadcast room.
- `round:result` ne révèle le rôle/champion que du joueur qui vient d'être éliminé (décision de
  l'hôte, déconnexion expirée, ou départ explicite) — jamais celui des autres.
- `game:ended` révèle tout, volontairement, uniquement en fin de partie.
- Toutes les permissions (host only, joueur du tour only, devineur Mr White only) sont
  vérifiées côté serveur dans `src/socket/handlers.ts` et `src/game/engine.ts` — jamais
  déléguées au client. La phase `clues` n'a pas de minuteur (cf. décision 4 ci-dessus) ; seuls
  `reveal` et `mrwhite_guess` gardent un timer serveur (`setTimeout` dans
  `src/socket/handlers.ts`) — `phaseDeadline` n'est qu'une information d'affichage pour le
  client, jamais une source de vérité.

## Structure

```
src/
  types.ts               types partagés (miroir exact du contrat)
  content/
    championPairs.ts     liste de base (fournie par l'agent Contenu, non modifiée)
    pairsStore.ts         état mutable global des paires (partagé par toutes les rooms)
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

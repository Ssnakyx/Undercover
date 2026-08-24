# lolCover — client

Client React + TypeScript + Vite pour lolCover. Implémente les écrans du contrat
(`docs/CONTRACT.md`) en suivant les maquettes statiques `/design/*.html` comme source de
vérité visuelle, branchées sur le contrat socket exact (`src/types.ts`, miroir de
`server/src/types.ts` — pas de package partagé, voir CONTRACT.md §1). La phase de discussion
(`Discussion`, ex-`Clues`) n'a plus de saisie d'indice ni de minuteur — juste l'ordre de
passage affiché — et l'hôte déclenche lui-même le passage au vote (voir décision 7 ci-dessous
et `docs/CONTRACT.md` §3).

Un **menu principal** (`MainMenu`, route `/`) précède désormais l'écran `Home` : il choisit
l'**univers** de contenu (`Universe`, voir §6/§7) — **lolCover** (League of Legends,
`/play/lol`) ou **SmashCover** (Super Smash Bros Ultimate, `/play/smash`). Les deux partagent
strictement le même moteur de jeu ; seuls le pool de paires et quelques mots de vocabulaire
("champion" / "combattant", voir `src/lib/universe.ts`) diffèrent.

## Installation

```bash
cd client
npm install
```

## Lancer en dev

```bash
npm run dev
```

Démarre sur `http://localhost:5173`. Le serveur (`/server`, port 3001 par défaut) doit tourner
en parallèle. URL du serveur configurable via la variable d'env Vite `VITE_SERVER_URL`
(défaut `http://localhost:3001`).

```bash
npm run build
```

Build de production (`tsc -b && vite build`).

## Déploiement (Vercel)

Le client est un site statique (build Vite) : Vercel le sert nativement, aucune fonction
serverless nécessaire côté client.

1. Pousser le repo sur GitHub (ou GitLab/Bitbucket).
2. Sur [vercel.com](https://vercel.com) : **Add New > Project**, importer le repo.
3. Réglages du projet :
   - **Root Directory** : `client`
   - **Framework Preset** : Vite (détecté automatiquement — build command `npm run build`,
     output directory `dist`)
   - **Environment Variables** : `VITE_SERVER_URL` = l'URL publique du serveur déployé (voir
     `server/README.md` — ex. `https://lolcover-server.onrender.com`, **sans** slash final)
4. Déployer. `vercel.json` (à la racine de `client/`) ajoute un rewrite SPA
   (`/(.*) → /index.html`) : sans lui, recharger une URL comme `/room/ABCDE` (react-router)
   renverrait un 404 au lieu de laisser React Router prendre la main.

`VITE_SERVER_URL` est une variable **build-time** (Vite l'inline dans le bundle à la
compilation) : tout changement de cette variable nécessite un redéploiement, pas juste un
redémarrage. `.env.example` documente la variable ; ne pas committer de vrai `.env` (déjà
ignoré par `.gitignore`).

## Décisions de conception au-delà du contrat

Le contrat et les maquettes ont été suivis à la lettre partout où ils sont explicites.
Quelques points non couverts ont nécessité une décision, documentée ici plutôt
qu'improvisée silencieusement (même esprit que `server/README.md`) :

1. **Écran `MrWhiteGuess`** : absent de `/design` (le contrat §1 ne liste que 7 maquettes,
   sans la phase `mrwhite_guess`). Construit comme 8ᵉ écran, en réutilisant la grammaire
   visuelle existante (`.eliminated-block` de `round_result.html`, `.role-reveal` en variante
   `mrwhite`) plutôt que d'inventer un nouveau vocabulaire visuel. Le joueur à qui revient la
   devinette est déterminé côté client via `lastRoundResult.eliminatedPlayerId` (donnée déjà
   publique dans l'événement `round:result`) plutôt que via un champ dédié, qui n'existe pas
   dans `RoomStatePublic`.
2. **`round_result` après un `mrwhite_guess` raté** : le serveur repasse en phase
   `round_result` sans réémettre `round:result` (même payload qu'avant la devinette, cf.
   `server/src/game/engine.ts`). L'écran `RoundResult` réaffiche donc simplement la dernière
   valeur mémorisée (`lastRoundResult`) plutôt que d'attendre un nouvel événement — vérifié
   par un test manuel du flux complet contre le vrai serveur.
3. **`round-note` de `round_result.html`** ("X Civils, Y Undercover et Z Mr White restent en
   lice") : ce détail par rôle n'est pas dérivable côté client sans violer la règle de
   confidentialité du contrat §6 (le client ne connaît que son propre rôle + celui des joueurs
   déjà éliminés, jamais la répartition des joueurs encore en vie). Remplacé par un compte
   global de joueurs restants, seule information réellement disponible.
4. **Répartition affichée en lobby** (`computeRoleCounts` dans `src/lib/roles.ts`) : dupliquée
   depuis `server/src/game/roles.ts` à l'identique, uniquement pour l'aperçu avant lancement —
   le serveur reste l'unique source de vérité pour l'assignation réelle des rôles.
5. **Couleurs d'avatar** : les maquettes fixent des paires `--avatar-c1/c2` à la main par
   joueur. Reproduites via une palette fixe + hash déterministe de `avatarSeed`
   (`src/lib/avatar.ts`) pour rester stable par joueur sans dépendre de l'ordre d'affichage.
6. **Routing** : une seule route de jeu `/room/:roomCode` (pas une route par écran) — les
   transitions d'écran sont pilotées par `roomState.phase` (source de vérité serveur), pas par
   l'historique de navigation du navigateur.
7. **`Discussion` sans indice ni minuteur, vote déclenché par l'hôte** : l'écran (ex-`Clues`)
   affiche uniquement `turnOrder` — les joueurs décrivent leur champion à voix haute, hors
   app, dans cet ordre. Aucune saisie, aucun minuteur, aucune notion de "tour courant" côté
   client. L'hôte seul déclenche `round:startVoting` (bouton "Passer au vote") quand il juge la
   discussion terminée ; les autres joueurs voient un message d'attente. L'écran `Voting`
   reste ensuite un vote secret simultané classique (comme la toute première version du
   contrat), simplement sans minuteur — voir `docs/CONTRACT.md` §3.
8. **Menu principal + univers** : `MainMenu` (route `/`) n'a pas de maquette dédiée — réutilise
   `.hero` de `home.html` avec une grille de deux cartes (`.menu-card`, nouvelles classes).
   L'univers choisi vit dans l'URL (`/play/:universe`), pas dans le contexte React ni le
   `localStorage` : une fois dans une room, la source de vérité redevient `roomState.universe`
   (fixé côté serveur à la création, voir `docs/CONTRACT.md` §6). Aucune icône officielle
   Nintendo/Riot sur les cartes — mêmes formes géométriques maison que le reste du design
   system (CONTRACT.md §0).

## Structure

```
src/
  types.ts             types partagés (miroir exact du contrat)
  socket/
    client.ts           instance socket.io-client unique, typée
    RoomProvider.tsx     contexte React : état de room, session, tous les emit typés
  routes/
    GameRoute.tsx        /room/:roomCode — reconnexion + switch d'écran sur roomState.phase
  screens/               MainMenu, Home, Lobby, Reveal, Discussion, Voting, RoundResult,
                         MrWhiteGuess, GameOver
  components/            Avatar, AppBar, ActionBar, LaneIcon, RoleBadge, IconDefs
  lib/                   session (localStorage), roles (aperçu répartition), avatar (couleurs),
                         universe (textes par univers 'lol' / 'smash')
  styles/
    tokens.css           design-system.css porté verbatim depuis /design
    screens.css          styles par écran portés depuis /design/*.html
```

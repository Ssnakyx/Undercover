# Undercover · Gaming Edition

Le jeu d'ambiance **Undercover** version gaming, en temps réel, un joueur par téléphone (3 à 12).
Chacun reçoit en secret un personnage ; les Civils ont tous le même, l'Undercover en a un très
proche. On le décrit à tour de rôle sans le nommer, puis on vote pour éliminer l'intrus.

Quatre univers : **lolCover** (League of Legends), **SmashCover** (Super Smash Bros. Ultimate),
**PokéCover** (Pokémon) et **GameCover** (titres de jeux vidéo), plus des paires maison.
Rôles optionnels : Mr White, Espion, Protecteur, Revenant, Chasseur, Bouffon, Amoureux.

## Lancer en local

```bash
cd server && npm install && npm run dev     # http://localhost:3001
cd client && npm install && npm run dev     # http://localhost:5173
```

## Tests

```bash
cd server && npm test && npx tsc --noEmit -p .
cd client && npm test && npm run lint && npm run build
```

## Structure

- `server/` — Express + Socket.io, état en mémoire. Moteur de jeu pur et testé dans `src/game/`,
  paires par univers dans `src/content/`.
- `client/` — React + Vite. DA "Grimoire" (inspirée de Metaphor: ReFantazio) dans `src/styles/grimoire.css`, images Smash et
  Pokémon dans `public/img/` (régénérables via `scripts/fetch-character-assets.py`).
- `docs/CONTRACT.md` — contrat technique (règles, événements socket).

Projet de fans non commercial, non affilié à Riot Games, Nintendo ou The Pokémon Company.

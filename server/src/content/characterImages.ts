// Image + alias de chaque personnage, par univers. Les images sont des URL que le client
// affiche telles quelles (carte de révélation, éliminations, révélation finale) :
//   - lol     : art "loading screen" de Data Dragon, le CDN public de Riot prévu pour les
//               projets de fans (aucun hébergement local nécessaire)
//   - smash   : portraits servis par le client (client/public/img/smash), voir
//               scripts/fetch-character-assets.py
//   - pokemon : artworks servis par le client (client/public/img/pokemon), idem
//   - games   : jaquette Wikipédia chargée au démarrage (content/gameInfo.ts), sinon le client
//               affiche une jaquette typographique
//   - anime   : pas d'image (carte typographique) ; alias dans content/animeInfo.ts
//   - smash-anime / lol-anime : image de l'univers d'origine du personnage (content/mixPairs.ts)
//   - brawl   : pas d'image (carte typographique)
// Paires personnalisées : pas d'image non plus, même rendu typographique.

import type { Universe } from '../types.js';
import { pokemonAssets, smashAssets, type CharacterAsset } from './characterAssets.generated.js';
import { gameCover } from './gameInfo.js';
import { animeAliases, animeDescription } from './animeInfo.js';
import { isMixUniverse, mixEntry } from './mixPairs.js';

const DDRAGON = 'https://ddragon.leagueoflegends.com/cdn/img/champion/loading';

// Identifiants Data Dragon qui ne se déduisent pas du nom affiché en retirant espaces et
// ponctuation.
const LOL_ID_OVERRIDES: Record<string, string> = {
  Wukong: 'MonkeyKing',
  "Cho'Gath": 'Chogath',
  "Kai'Sa": 'Kaisa',
  "Kha'Zix": 'Khazix',
  "Vel'Koz": 'Velkoz',
  "Bel'Veth": 'Belveth',
  LeBlanc: 'Leblanc',
  'Nunu & Willump': 'Nunu',
  'Renata Glasc': 'Renata',
  "Kog'Maw": 'KogMaw',
  "Rek'Sai": 'RekSai',
};

export function lolChampionId(name: string): string {
  return LOL_ID_OVERRIDES[name] ?? name.replace(/[^A-Za-z0-9]/g, '');
}

function assetFor(universe: Universe, name: string): CharacterAsset | undefined {
  if (universe === 'smash') return smashAssets[name];
  if (universe === 'pokemon') return pokemonAssets[name];
  return undefined;
}

export function characterImage(universe: Universe, name: string | null | undefined): string | null {
  if (!name) return null;
  if (isMixUniverse(universe)) {
    const entry = mixEntry(universe, name);
    return entry && entry.source !== 'anime' ? characterImage(entry.source, entry.base) : null;
  }
  if (universe === 'lol') return `${DDRAGON}/${lolChampionId(name)}_0.jpg`;
  if (universe === 'games') return gameCover(name);
  return assetFor(universe, name)?.file ?? null;
}

/** Autres orthographes acceptées pour la devinette de Mr White (ex. nom anglais). */
export function characterAliases(universe: Universe, name: string): string[] {
  if (universe === 'anime') return animeAliases(name);
  if (isMixUniverse(universe)) {
    const entry = mixEntry(universe, name);
    if (!entry) return [];
    const own = characterAliases(entry.source, entry.base);
    return entry.base === name ? own : [entry.base, ...own];
  }
  return assetFor(universe, name)?.aliases ?? [];
}

/** Petite ligne d'aide sous le nom, sur la carte du joueur (null = rien à afficher). */
export function characterDescription(universe: Universe, name: string | null | undefined): string | null {
  if (!name) return null;
  if (universe === 'anime') return animeDescription(name);
  if (isMixUniverse(universe)) {
    const entry = mixEntry(universe, name);
    if (!entry) return null;
    if (entry.source === 'anime') return animeDescription(entry.base);
    return entry.source === 'smash' ? 'Combattant de « Super Smash Bros. Ultimate »' : 'Champion de « League of Legends »';
  }
  return null;
}

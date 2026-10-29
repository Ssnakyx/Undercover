// Image + alias de chaque personnage, par univers. Les images sont des URL que le client
// affiche telles quelles (carte de révélation, éliminations, révélation finale) :
//   - lol     : art "loading screen" de Data Dragon, le CDN public de Riot prévu pour les
//               projets de fans (aucun hébergement local nécessaire)
//   - smash   : portraits servis par le client (client/public/img/smash), voir
//               scripts/fetch-character-assets.py
//   - pokemon : artworks servis par le client (client/public/img/pokemon), idem
//   - games   : pas d'image (titres de jeux) — le client affiche une jaquette typographique
// Paires personnalisées : pas d'image non plus, même rendu typographique.

import type { Universe } from '../types.js';
import { pokemonAssets, smashAssets, type CharacterAsset } from './characterAssets.generated.js';

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
  if (universe === 'lol') return `${DDRAGON}/${lolChampionId(name)}_0.jpg`;
  return assetFor(universe, name)?.file ?? null;
}

/** Autres orthographes acceptées pour la devinette de Mr White (ex. nom anglais). */
export function characterAliases(universe: Universe, name: string): string[] {
  return assetFor(universe, name)?.aliases ?? [];
}

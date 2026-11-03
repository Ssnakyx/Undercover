// Résout une fois pour toutes les images distantes et les écrit dans
// src/content/remoteImages.generated.ts :
//   - jaquette Wikipédia (en) de chaque jeu de content/gameInfo.ts ;
//   - illustration AniList de chaque personnage de content/animeInfo.ts.
// Lancé par .github/workflows/remote-images.yml (le bac à sable de dev n'a pas accès à ces
// API) ; le fichier généré est affiché dans le journal pour être recopié et versionné.
//
//   npx tsx scripts/resolve-remote-images.ts            -> écrit le fichier
//   npx tsx scripts/resolve-remote-images.ts --print    -> l'affiche aussi dans la sortie

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { GAME_INFO, fetchCover } from '../src/content/gameInfo.js';
import { ANIME_INFO } from '../src/content/animeInfo.js';
import { resolveAnimeImages } from '../src/content/animeImages.js';

const OUT = fileURLToPath(new URL('../src/content/remoteImages.generated.ts', import.meta.url));

async function resolveGames(): Promise<{ found: Record<string, string>; missing: string[] }> {
  const found: Record<string, string> = {};
  const missing: string[] = [];
  for (const [name, info] of Object.entries(GAME_INFO)) {
    try {
      const url = await fetchCover(info.wiki);
      if (url) found[name] = url;
      else missing.push(`${name} (wiki: ${info.wiki})`);
    } catch (e) {
      missing.push(`${name} (wiki: ${info.wiki}, ${(e as Error).message})`);
    }
    await new Promise((r) => setTimeout(r, 150)); // reste poli avec l'API Wikimedia
  }
  return { found, missing };
}

const record = (name: string, map: Record<string, string>): string =>
  `export const ${name}: Record<string, string> = {\n` +
  Object.keys(map)
    .sort((a, b) => a.localeCompare(b, 'fr'))
    .map((k) => `  ${JSON.stringify(k)}: ${JSON.stringify(map[k])},`)
    .join('\n') +
  '\n};\n';

const games = await resolveGames();
const anime = await resolveAnimeImages(Object.keys(ANIME_INFO));

const file =
  `// Fichier généré par scripts/resolve-remote-images.ts — ne pas éditer à la main.\n` +
  `// Images résolues à l'avance (jaquettes Wikipédia des jeux, illustrations AniList des\n` +
  `// personnages d'anime) pour ne plus dépendre des API au démarrage du serveur.\n\n` +
  record('GAME_COVERS', games.found) +
  '\n' +
  record('ANIME_IMAGES', anime.found);
writeFileSync(OUT, file);

console.log(`Jeux : ${Object.keys(games.found).length}/${Object.keys(GAME_INFO).length}`);
console.log(`Anime : ${Object.keys(anime.found).length}/${Object.keys(ANIME_INFO).length}`);
if (games.missing.length) console.log(`JEUX SANS JAQUETTE (${games.missing.length}) :\n  ${games.missing.join('\n  ')}`);
if (anime.missing.length) console.log(`PERSONNAGES SANS IMAGE (${anime.missing.length}) :\n  ${anime.missing.join('\n  ')}`);
if (process.argv.includes('--print')) {
  console.log('----- BEGIN remoteImages.generated.ts -----');
  console.log(file);
  console.log('----- END remoteImages.generated.ts -----');
}

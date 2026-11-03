// Résout une fois pour toutes les images distantes et les écrit dans
// src/content/remoteImages.generated.ts :
//   - jaquette Wikipédia (en) de chaque jeu de content/gameInfo.ts ;
//   - illustration AniList de chaque personnage de content/animeInfo.ts.
// Lancé par .github/workflows/remote-images.yml (le bac à sable de dev n'a pas accès à ces
// API) ; le fichier généré est affiché dans le journal pour être recopié et versionné.
//
// Seules les images absentes du fichier versionné sont cherchées (les autres sont gardées),
// sauf avec --all qui repart de zéro.
//
//   npx tsx scripts/resolve-remote-images.ts            -> écrit le fichier
//   npx tsx scripts/resolve-remote-images.ts --print    -> l'affiche aussi dans la sortie
//   npx tsx scripts/resolve-remote-images.ts --all      -> recherche tout

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { GAME_INFO, findCover } from '../src/content/gameInfo.js';
import { ANIME_INFO } from '../src/content/animeInfo.js';
import { resolveAnimeImages } from '../src/content/animeImages.js';
import { ANIME_IMAGES, GAME_COVERS } from '../src/content/remoteImages.generated.js';

const ALL = process.argv.includes('--all');
const OUT = fileURLToPath(new URL('../src/content/remoteImages.generated.ts', import.meta.url));

async function resolveGames(): Promise<{ found: Record<string, string>; missing: string[] }> {
  const found: Record<string, string> = ALL ? {} : { ...GAME_COVERS };
  const missing: string[] = [];
  for (const [name, info] of Object.entries(GAME_INFO)) {
    if (found[name]) continue;
    const { url, tried } = await findCover(info.wiki, name);
    if (url) found[name] = url;
    else missing.push(`${name} (wiki: ${info.wiki} ; ${tried.join(' ; ')})`);
    await new Promise((r) => setTimeout(r, 150)); // reste poli avec l'API Wikimedia
  }
  // Un jeu retiré de GAME_INFO n'a plus rien à faire dans le fichier.
  for (const name of Object.keys(found)) if (!GAME_INFO[name]) delete found[name];
  return { found, missing };
}

async function resolveAnime(): Promise<{ found: Record<string, string>; missing: string[] }> {
  const kept = ALL ? {} : Object.fromEntries(Object.entries(ANIME_IMAGES).filter(([name]) => ANIME_INFO[name]));
  const { found, missing } = await resolveAnimeImages(Object.keys(ANIME_INFO).filter((name) => !kept[name]));
  return { found: { ...kept, ...found }, missing };
}

const record = (name: string, map: Record<string, string>): string =>
  `export const ${name}: Record<string, string> = {\n` +
  Object.keys(map)
    .sort((a, b) => a.localeCompare(b, 'fr'))
    .map((k) => `  ${JSON.stringify(k)}: ${JSON.stringify(map[k])},`)
    .join('\n') +
  '\n};\n';

const games = await resolveGames();
const anime = await resolveAnime();

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

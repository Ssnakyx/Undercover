// Images des personnages de l'univers 'anime' (et de leur moitié dans les mélanges
// 'smash-anime' / 'lol-anime') : illustration officielle du personnage sur AniList, la base
// communautaire d'anime dont l'API GraphQL est publique et sans clé.
//
// Résolues au démarrage du serveur, en tâche de fond comme les jaquettes des jeux
// (content/gameInfo.ts) : on cherche chaque personnage par son nom et on ne garde que le
// résultat qui apparaît dans SA série (mots-clés ci-dessous, comparés aux titres romaji et
// anglais d'AniList). Pas de correspondance sûre = pas d'image, et le client garde la carte
// typographique, plutôt que d'afficher le mauvais « Law » ou le mauvais « Ray ».

import { ANIME_INFO } from './animeInfo.js';
import { ANIME_IMAGES } from './remoteImages.generated.js';

const ANILIST = 'https://graphql.anilist.co';
// Requêtes groupées (plusieurs recherches par appel) et espacées : AniList limite à
// ~30 requêtes par minute.
const BATCH_SIZE = 5;
const DELAY_MS = 2_500;
const MAX_RETRIES = 3;

// Série (nom FR de animeInfo.ts) -> mots-clés présents dans le titre AniList de l'œuvre.
// Comparaison en minuscules, lettres et chiffres seulement (« Yu☆Gi☆Oh! » -> « yugioh »).
export const SERIES_KEYWORDS: Record<string, string[]> = {
  'Dragon Ball': ['dragonball'],
  Naruto: ['naruto', 'boruto'],
  'One Piece': ['onepiece'],
  'L’Attaque des Titans': ['shingekinokyojin', 'attackontitan'],
  'Demon Slayer': ['kimetsunoyaiba', 'demonslayer'],
  'Jujutsu Kaisen': ['jujutsukaisen'],
  'My Hero Academia': ['bokunoheroacademia', 'myheroacademia'],
  'Death Note': ['deathnote'],
  'Hunter x Hunter': ['hunterxhunter'],
  'Fullmetal Alchemist': ['fullmetalalchemist', 'haganenorenkinjutsushi'],
  'Neon Genesis Evangelion': ['evangelion'],
  Bleach: ['bleach'],
  'Les Chevaliers du Zodiaque': ['saintseiya'],
  'Sailor Moon': ['sailormoon'],
  'JoJo’s Bizarre Adventure': ['jojo'],
  'The Promised Neverland': ['yakusokunoneverland', 'promisedneverland'],
  'Le Voyage de Chihiro': ['sentochihiro', 'spiritedaway'],
  'Kiki la petite sorcière': ['majonotakkyuubin', 'kiki'],
  'Princesse Mononoké': ['mononoke'],
  'Nausicaä de la vallée du vent': ['nausica'],
  'Mon voisin Totoro': ['totoro'],
  'Ponyo sur la falaise': ['ponyo'],
  'Le Château ambulant': ['howl', 'hauru'],
  'Porco Rosso': ['porcorosso', 'kurenainobuta'],
  'Black Clover': ['blackclover'],
  'Dr. Stone': ['drstone'],
  'Haikyu!!': ['haikyu'],
  'Slam Dunk': ['slamdunk'],
  Inuyasha: ['inuyasha'],
  'Re:Zero': ['rezero'],
  KonoSuba: ['konosuba', 'konosubarashii'],
  'Moi, quand je me réincarne en Slime': ['slime'],
  Overlord: ['overlord'],
  'Sword Art Online': ['swordartonline'],
  'Solo Leveling': ['sololeveling', 'oredakelevel'],
  Frieren: ['frieren'],
  'Fairy Tail': ['fairytail'],
  'One Punch Man': ['onepunchman'],
  'Mob Psycho 100': ['mobpsycho'],
  'Chainsaw Man': ['chainsawman'],
  'Tokyo Ghoul': ['tokyoghoul'],
  'Code Geass': ['codegeass'],
  'Spy x Family': ['spyxfamily', 'spyfamily'],
  'Yu-Gi-Oh!': ['yugioh'],
  'Kenshin le vagabond': ['rurounikenshin'],
  'Détective Conan': ['conan', 'caseclosed'],
  'Card Captor Sakura': ['cardcaptor'],
  'Astro Boy': ['tetsuwanatom', 'astroboy'],
  Doraemon: ['doraemon'],
  Hamtaro: ['hamtar'],
  Goldorak: ['grendizer'],
  'Mazinger Z': ['mazinger'],
  'Olive et Tom': ['captaintsubasa'],
  'Ken le Survivant': ['hokutonoken', 'fistofthenorthstar'],
  'Nicky Larson': ['cityhunter'],
  'Lupin III': ['lupin'],
  Albator: ['harlock'],
  Cobra: ['cobra'],
};

// Nom à chercher sur AniList quand ni le nom FR ni le premier alias « Prénom Nom » ne conviennent.
const SEARCH_OVERRIDES: Record<string, string> = {
  Goku: 'Goku Son',
  Végéta: 'Vegeta',
  Gohan: 'Gohan Son',
  Goten: 'Goten Son',
  Trunks: 'Trunks',
  Krilin: 'Kuririn',
  Freezer: 'Frieza',
  Dendé: 'Dende',
  Shanks: 'Shanks',
  Baggy: 'Buggy',
  Livaï: 'Levi',
  Zeke: 'Zeke Yeager',
  Eren: 'Eren Yeager',
  Bertholdt: 'Bertolt Hoover',
  Doma: 'Douma',
  Kokushibo: 'Kokushibou',
  Bakugo: 'Katsuki Bakugou',
  L: 'L Lawliet',
  Near: 'Near',
  Seiya: 'Pegasus Seiya',
  Shiryu: 'Dragon Shiryu',
  Hyoga: 'Cygnus Hyoga',
  Ikki: 'Phoenix Ikki',
  'Sailor Moon': 'Usagi Tsukino',
  'Sailor Mars': 'Rei Hino',
  'Sailor Mercure': 'Ami Mizuno',
  Chihiro: 'Chihiro Ogino',
  'Princesse Mononoké': 'San',
  Nausicaä: 'Nausicaa',
  Howl: 'Howl',
  'Porco Rosso': 'Porco Rosso',
  Kurama: 'Kurama',
  Grey: 'Gray Fullbuster',
  Conan: 'Conan Edogawa',
  Astro: 'Atom',
  Goldorak: 'Duke Fleed',
  'Mazinger Z': 'Koji Kabuto',
  Olive: 'Tsubasa Oozora',
  Tom: 'Tarou Misaki',
  'Ken le Survivant': 'Kenshirou',
  'Nicky Larson': 'Ryo Saeba',
  'Lupin III': 'Lupin III',
  Albator: 'Captain Harlock',
  Cobra: 'Cobra',
  Boo: 'Majin Buu',
  Gaï: 'Might Guy',
  Tsunade: 'Tsunade',
  Pain: 'Pain',
  Giyu: 'Giyuu Tomioka',
  Mello: 'Mello',
};

// Autres noms à essayer quand la recherche principale ne donne rien : AniList écrit les
// voyelles longues en double (« Tanjirou », « Hyuuga », « Yuuji ») et nomme certains
// personnages autrement que nos surnoms FR.
const SEARCH_FALLBACKS: Record<string, string[]> = {
  'Tortue Géniale': ['Muten Roushi', 'Kame Sennin', 'Master Roshi'],
  Hinata: ['Hinata Hyuuga', 'Hinata'],
  Obito: ['Obito Uchiha', 'Tobi', 'Obito'],
  Neji: ['Neji Hyuuga', 'Neji'],
  'Barbe Blanche': ['Edward Newgate', 'Whitebeard'],
  'Barbe Noire': ['Marshall D. Teach', 'Blackbeard', 'Teach'],
  Garp: ['Garp', 'Monkey D. Garp'],
  Zeke: ['Zeke Jaeger', 'Zeke', 'Beast Titan'],
  Tanjiro: ['Tanjirou Kamado', 'Tanjirou'],
  Rengoku: ['Kyoujurou Rengoku', 'Rengoku'],
  Kokushibo: ['Kokushibou', 'Michikatsu Tsugikuni', 'Kokushibo'],
  'Yuji Itadori': ['Yuuji Itadori', 'Itadori'],
  Sukuna: ['Ryoumen Sukuna', 'Sukuna'],
  Dabi: ['Dabi', 'Touya Todoroki'],
  Nausicaä: ['Nausicaä', 'Nausicaa'],
  Senku: ['Senkuu Ishigami', 'Senkuu', 'Senku'],
  Oikawa: ['Tooru Oikawa', 'Oikawa'],
  'Mazinger Z': ['Kouji Kabuto', 'Kabuto Kouji', 'Mazinger Z'],
  'Nicky Larson': ['Ryou Saeba', 'Ryo Saeba', 'Saeba'],
  Boo: ['Majin Buu', 'Buu', 'Majin Boo'],
  Gaï: ['Might Guy', 'Gai Maito', 'Maito Gai', 'Guy'],
  Pain: ['Pain', 'Nagato', 'Tendou Pain'],
  Giyu: ['Giyuu Tomioka', 'Tomioka'],
};

/** Tous les termes à essayer pour ce personnage, le principal d'abord, sans doublon. */
export function animeSearchTerms(name: string): string[] {
  const strip = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
  const terms = [animeSearchTerm(name), ...(SEARCH_FALLBACKS[name] ?? []), ...(ANIME_INFO[name]?.aliases ?? []).map(strip), strip(name)];
  return [...new Set(terms)];
}

const images = new Map<string, string>();

/**
 * Illustration AniList du personnage : d'abord celle résolue à l'avance et versionnée
 * (remoteImages.generated.ts, voir scripts/resolve-remote-images.ts), sinon celle trouvée au
 * démarrage du serveur ; null si introuvable.
 */
export function animeImage(name: string | null | undefined): string | null {
  if (!name) return null;
  return ANIME_IMAGES[name] ?? images.get(name) ?? null;
}

const normalize = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

const isAsciiName = (s: string): boolean => /^[A-Za-z0-9 .'-]+$/.test(s);

/** Ce qu'on tape dans la recherche AniList pour ce personnage. */
export function animeSearchTerm(name: string): string {
  const override = SEARCH_OVERRIDES[name];
  if (override) return override;
  // Un « Prénom Nom » en alphabet latin est plus discriminant que le surnom FR.
  if (name.includes(' ') && isAsciiName(name)) return name;
  const full = ANIME_INFO[name]?.aliases?.find((a) => a.includes(' ') && isAsciiName(a));
  return full ?? name.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

interface AniListCharacter {
  image?: { large?: string | null } | null;
  media?: { nodes?: { title?: { romaji?: string | null; english?: string | null } | null }[] } | null;
}

/** Premier résultat de la recherche qui apparaît dans une œuvre de la bonne série. */
export function pickCharacterImage(series: string, results: AniListCharacter[]): string | null {
  const keywords = SERIES_KEYWORDS[series] ?? [normalize(series)];
  for (const c of results) {
    const titles = (c.media?.nodes ?? []).flatMap((m) => [m.title?.romaji ?? '', m.title?.english ?? '']).map(normalize);
    if (titles.some((t) => keywords.some((k) => t.includes(k)))) {
      const url = c.image?.large;
      // AniList renvoie une image générique (« default.jpg ») pour les fiches sans illustration.
      if (url && !url.includes('/default.')) return url;
    }
  }
  return null;
}

function buildQuery(batch: string[]): string {
  const fields = batch.map(
    (_, i) =>
      `c${i}: Page(perPage: 10) { characters(search: $s${i}, sort: [SEARCH_MATCH, FAVOURITES_DESC]) { image { large } media(perPage: 4, sort: POPULARITY_DESC) { nodes { title { romaji english } } } } }`,
  );
  const vars = batch.map((_, i) => `$s${i}: String`).join(', ');
  return `query (${vars}) { ${fields.join(' ')} }`;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchBatch(terms: string[]): Promise<Record<string, { characters: AniListCharacter[] } | null>> {
  const variables = Object.fromEntries(terms.map((term, i) => [`s${i}`, term]));
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(ANILIST, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ query: buildQuery(terms), variables }),
      signal: AbortSignal.timeout(15_000),
    });
    if (res.status === 429 && attempt < MAX_RETRIES) {
      const wait = Number(res.headers.get('retry-after')) || 60;
      await sleep(wait * 1000);
      continue;
    }
    if (!res.ok) throw new Error(`AniList ${res.status}`);
    const json = (await res.json()) as { data?: Record<string, { characters: AniListCharacter[] } | null> };
    return json.data ?? {};
  }
}

/**
 * Cherche l'illustration de chaque personnage donné sur AniList (requêtes groupées et
 * espacées) : d'abord le terme principal de chacun, puis, pour ceux restés sans image, tous
 * leurs autres noms (SEARCH_FALLBACKS, alias, nom FR) en une requête par personnage.
 */
export async function resolveAnimeImages(names: string[]): Promise<{ found: Record<string, string>; missing: string[] }> {
  const found: Record<string, string> = {};
  const pending: string[] = [];
  for (let i = 0; i < names.length; i += BATCH_SIZE) {
    const batch = names.slice(i, i + BATCH_SIZE);
    try {
      const data = await fetchBatch(batch.map(animeSearchTerm));
      batch.forEach((name, j) => {
        const url = pickCharacterImage(ANIME_INFO[name].series, data[`c${j}`]?.characters ?? []);
        if (url) found[name] = url;
        else pending.push(name);
      });
    } catch {
      pending.push(...batch);
    }
    await sleep(DELAY_MS);
  }
  const missing: string[] = [];
  for (const name of pending) {
    const terms = animeSearchTerms(name).slice(0, BATCH_SIZE);
    try {
      const data = await fetchBatch(terms);
      const url = terms
        .map((_, j) => pickCharacterImage(ANIME_INFO[name].series, data[`c${j}`]?.characters ?? []))
        .find((u): u is string => !!u);
      if (url) found[name] = url;
      else missing.push(`${name} (essayé : ${terms.join(', ')})`);
    } catch (e) {
      missing.push(`${name} (${(e as Error).message})`);
    }
    await sleep(DELAY_MS);
  }
  return { found, missing };
}

/**
 * Au démarrage, en tâche de fond : cherche seulement les personnages qui n'ont pas encore
 * d'image versionnée (un personnage sans image garde la carte typographique côté client).
 */
export async function prefetchAnimeImages(): Promise<void> {
  const names = Object.keys(ANIME_INFO).filter((n) => !images.has(n) && !ANIME_IMAGES[n]);
  if (names.length === 0) return;
  const { found, missing } = await resolveAnimeImages(names);
  for (const [name, url] of Object.entries(found)) images.set(name, url);
  // eslint-disable-next-line no-console
  console.log(
    `[anime] ${images.size} images de personnages chargées en plus des versionnées` +
      (missing.length ? `, ${missing.length} introuvables : ${missing.join(', ')}` : ''),
  );
}

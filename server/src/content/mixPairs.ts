// Univers mixtes 'smash-anime' et 'lol-anime' : le paquet réunit toutes les paires des deux
// univers d'origine, plus des paires croisées (un combattant Smash ou un champion LoL face à
// un personnage d'anime qui lui ressemble). Voir content/pairSeed.ts pour le format.
//
// Chaque nom garde sa source (image Smash/LoL, série et alias de l'anime). Si un même nom
// existe des deux côtés (« Nami » : LoL et One Piece), le personnage d'anime prend sa série
// entre parenthèses pour qu'on ne les confonde pas.

import type { ChampionPair, PairDifficulty, Universe } from '../types.js';
import { buildPairs, type PairSeed } from './pairSeed.js';
import { smashPairs } from './smashPairs.js';
import { lolPairs } from './lolPairs.js';
import { animePairs } from './animePairs.js';
import { ANIME_INFO } from './animeInfo.js';

export type MixSource = 'smash' | 'lol' | 'anime';
export type MixUniverse = 'smash-anime' | 'lol-anime';

export interface MixEntry {
  source: MixSource;
  /** Nom dans l'univers d'origine (sans la série ajoutée en cas d'homonyme). */
  base: string;
}

// [nom Smash, personnage d'anime, thème, difficulté]
const SMASH_ANIME: PairSeed[] = [
  ['Mega Man', 'Astro', 'Garçons robots avec un canon au bras', 'extreme'],
  ['Ness', 'Mob', 'Gamins timides aux pouvoirs psychiques', 'extreme'],
  ['Min Min', 'Luffy', 'Combattants aux bras élastiques', 'extreme'],
  ['Cloud', 'Ichigo', 'Héros aux cheveux en pointe et à l’épée géante', 'hard'],
  ['Séphiroth', 'Sesshomaru', 'Ennemis élégants aux longs cheveux blancs', 'hard'],
  ['Ryu', 'Goku', 'Combattants qui lancent une boule d’énergie à deux mains', 'hard'],
  ['Captain Falcon', 'All Might', 'Héros musclés au coup de poing légendaire', 'hard'],
  ['Bowser', 'Kaido', 'Gros méchants cornus qui crachent du feu', 'hard'],
  ['Mewtwo', 'Cell', 'Créatures nées en laboratoire pour être les plus fortes', 'hard'],
  ['Joker', 'Lelouch', 'Lycéens à la tête d’une rébellion masquée', 'hard'],
  ['Snake', 'Loid', 'Espions infiltrés', 'hard'],
  ['Bayonetta', 'Yor', 'Tueuses élégantes en noir', 'hard'],
  ['Terry', 'Ken le Survivant', 'Bagarreurs cultes des années 90', 'hard'],
  ['Link', 'Zoro', 'Épéistes en vert', 'hard'],
  ['Sheik', 'Kakashi', 'Ninjas au visage masqué', 'hard'],
  ['Amphinobi', 'Naruto', 'Ninjas amis des grenouilles', 'hard'],
  ['Sonic', 'Naruto', 'Héros qui courent les bras en arrière', 'medium'],
  ['Pikachu', 'Zenitsu', 'Électriques en jaune', 'medium'],
  ['Héros', 'Goku', 'Héros dessinés par Akira Toriyama', 'medium'],
  ['Marth', 'Kirito', 'Épéistes au grand cœur', 'medium'],
  ['Little Mac', 'Saitama', 'Petits gabarits qui mettent tout le monde KO', 'medium'],
  ['Samus', 'Asuka', 'Pilotes en armure de combat', 'medium'],
  ['Joker', 'Light Yagami', 'Lycéens à double vie', 'medium'],
  ['Ike', 'Asta', 'Têtes brûlées à l’épée énorme', 'medium'],
  ['Steve', 'Senku', 'Bâtisseurs qui repartent de zéro', 'medium'],
  ['Wario', 'Baggy', 'Méchants bouffons et cupides', 'medium'],
  ['Peach', 'Sailor Moon', 'Princesses blondes', 'medium'],
  ['Corrin', 'Inuyasha', 'Héros à moitié monstre', 'medium'],
  ['Lucas', 'Shinji', 'Garçons timides marqués par un drame', 'medium'],
  ['Meta Knight', 'Mihawk', 'Bretteurs mystérieux qui défient le héros', 'medium'],
  ['Pit', 'Seiya', 'Jeunes guerriers au service d’une déesse', 'medium'],
  ['Kirby', 'Totoro', 'Boules toutes rondes et adorables', 'easy'],
  ['Pac-Man', 'Luffy', 'Gloutons qui avalent tout', 'easy'],
  ['Ganondorf', 'Freezer', 'Seigneurs du mal qui veulent tout dominer', 'easy'],
  ['Villageois', 'Totoro', 'Habitants paisibles de la campagne', 'easy'],
  ['Roi DaDiDou', 'Big Mom', 'Tyrans gourmands', 'easy'],
  ['Zelda', 'Princesse Mononoké', 'Princesses de légende', 'easy'],
  ['Kirby', 'Chopper', 'Mascottes mignonnes qui se transforment', 'easy'],
];

// [champion LoL, personnage d'anime, thème, difficulté]
const LOL_ANIME: PairSeed[] = [
  ['Ahri', 'Kurama', 'Renards à neuf queues', 'extreme'],
  ['Wukong', 'Goku', 'Rois des singes au bâton', 'extreme'],
  ['Shaco', 'Hisoka', 'Clowns tueurs', 'extreme'],
  ['Yasuo', 'Kenshin', 'Épéistes vagabonds qui fuient leur passé', 'hard'],
  ['Zed', 'Itachi', 'Ninjas des ombres qui ont trahi les leurs', 'hard'],
  ['Kayn', 'Yuji Itadori', 'Jeunes hôtes d’un démon qui veut leur corps', 'hard'],
  ['Aatrox', 'Sukuna', 'Démons anciens assoiffés de massacre', 'hard'],
  ['Gangplank', 'Barbe Noire', 'Capitaines pirates sans scrupules', 'hard'],
  ['Rengar', 'Inosuke', 'Chasseurs sauvages à tête de bête', 'hard'],
  ['Swain', 'Erwin', 'Stratèges manchots', 'hard'],
  ['Katarina', 'Yor', 'Assassines aux lames', 'hard'],
  ['Ekko', 'Subaru', 'Garçons qui remontent le temps', 'hard'],
  ['Viego', 'Muzan', 'Rois maudits qui corrompent tout', 'hard'],
  ['Shen', 'Kakashi', 'Ninjas sages et posés', 'medium'],
  ['Master Yi', 'Zoro', 'Bretteurs qui tranchent tout', 'medium'],
  ['Jinx', 'Power', 'Filles complètement folles', 'medium'],
  ['Teemo', 'Chopper', 'Petits mignons… mais dangereux', 'medium'],
  ['Lux', 'Sailor Moon', 'Magical girls de la lumière', 'medium'],
  ['Miss Fortune', 'Robin', 'Femmes pirates', 'medium'],
  ['Blitzcrank', 'Genos', 'Robots au poing propulsé', 'medium'],
  ['Heimerdinger', 'Senku', 'Petits génies inventeurs', 'medium'],
  ['Viktor', 'Edward', 'Scientifiques au bras mécanique', 'medium'],
  ['Brand', 'Ace', 'Hommes de feu', 'medium'],
  ['Warwick', 'Kaneki', 'Monstres nés d’expériences cruelles', 'medium'],
  ['Talon', 'Killua', 'Assassins élevés pour tuer', 'medium'],
  ['Evelynn', 'Makima', 'Démones manipulatrices', 'medium'],
  ['Caitlyn', 'Conan', 'Détectives de génie', 'medium'],
  ['Akali', 'Nobara', 'Rebelles qui n’en font qu’à leur tête', 'medium'],
  ['Sylas', 'Eren', 'Révoltés enchaînés qui veulent la liberté', 'medium'],
  ['Fiora', 'Erza', 'Duellistes fières et invaincues', 'medium'],
  ['Ezreal', 'Luffy', 'Aventuriers chasseurs de trésors', 'easy'],
  ['Illaoi', 'Big Mom', 'Femmes imposantes qui font la loi', 'easy'],
  ['Nautilus', 'Franky', 'Colosses en métal liés à la mer', 'easy'],
  ['Lee Sin', 'Ken le Survivant', 'Maîtres d’arts martiaux', 'easy'],
  ['Annie', 'Nezuko', 'Fillettes adorables… à ne pas énerver', 'easy'],
];

interface MixDef {
  universe: MixUniverse;
  other: { source: 'smash' | 'lol'; pairs: ChampionPair[] };
  cross: PairSeed[];
}

const DEFS: MixDef[] = [
  { universe: 'smash-anime', other: { source: 'smash', pairs: smashPairs }, cross: SMASH_ANIME },
  { universe: 'lol-anime', other: { source: 'lol', pairs: lolPairs }, cross: LOL_ANIME },
];

function namesOf(pairs: ChampionPair[]): Set<string> {
  return new Set(pairs.flatMap((p) => [p.champA, p.champB]));
}

const ANIME_NAMES = namesOf(animePairs);

function build(def: MixDef): { pairs: ChampionPair[]; index: Map<string, MixEntry> } {
  const otherNames = namesOf(def.other.pairs);
  const index = new Map<string, MixEntry>();
  for (const name of otherNames) index.set(name, { source: def.other.source, base: name });
  const animeName = (name: string): string => {
    const display = otherNames.has(name) ? `${name} (${ANIME_INFO[name]?.series ?? 'anime'})` : name;
    index.set(display, { source: 'anime', base: name });
    return display;
  };
  for (const name of ANIME_NAMES) animeName(name);

  const rekey = (pairs: ChampionPair[], rename: (n: string) => string): PairSeed[] =>
    pairs.map((p) => [rename(p.champA), rename(p.champB), p.theme ?? '', p.difficulty as PairDifficulty]);

  const seeds: PairSeed[] = [
    ...def.cross.map(([a, b, theme, d]) => [a, animeName(b), theme, d] as const),
    ...rekey(def.other.pairs, (n) => n),
    ...rekey(animePairs, animeName),
  ];
  return { pairs: buildPairs(def.universe as Universe, seeds), index };
}

const BUILT = new Map(DEFS.map((def) => [def.universe, build(def)]));

export const smashAnimePairs = BUILT.get('smash-anime')!.pairs;
export const lolAnimePairs = BUILT.get('lol-anime')!.pairs;

export function isMixUniverse(universe: Universe): universe is MixUniverse {
  return universe === 'smash-anime' || universe === 'lol-anime';
}

/** Source (et nom d'origine) d'un personnage d'un univers mixte — undefined si inconnu. */
export function mixEntry(universe: MixUniverse, name: string): MixEntry | undefined {
  return BUILT.get(universe)?.index.get(name);
}

/** Noms des paires croisées, pour les tests (chaque nom doit exister dans son univers d'origine). */
export const CROSS_SEEDS: Record<MixUniverse, readonly PairSeed[]> = {
  'smash-anime': SMASH_ANIME,
  'lol-anime': LOL_ANIME,
};

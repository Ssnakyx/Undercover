// Univers mixtes 'smash-anime' et 'lol-anime' : UNIQUEMENT des paires croisées, un combattant
// Smash ou un champion LoL face à un personnage d'anime qui lui ressemble. Voir
// content/pairSeed.ts pour le format.
//
// Chaque nom garde sa source (image Smash/LoL, série et alias de l'anime). Si un même nom
// existe des deux côtés (« Nami » : LoL et One Piece), le personnage d'anime prend sa série
// entre parenthèses pour qu'on ne les confonde pas.

import type { ChampionPair, Universe } from '../types.js';
import { buildPairs, type PairSeed } from './pairSeed.js';
import { smashPairs } from './smashPairs.js';
import { lolPairs } from './lolPairs.js';
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
  ['King K. Rool', 'Crocodile', 'Méchants crocodiles', 'extreme'],
  ['Simon', 'Tanjiro', 'Chasseurs de démons et de vampires', 'hard'],
  ['Daraen', 'Shikamaru', 'Tacticiens de génie', 'hard'],
  ['Richter', 'Rengoku', 'Chasseurs de démons à la cape flamboyante', 'medium'],
  ['Byleth', 'Kakashi', 'Profs qui entraînent les héros', 'medium'],
  ['Roy', 'Ace', 'Jeunes guerriers du feu', 'medium'],
  ['Kazuya', 'Akaza', 'Combattants à moitié démons', 'medium'],
  ['Pyra / Mythra', 'Erza', 'Guerrières aux cheveux rouges et à l’épée', 'medium'],
  ['Dr. Mario', 'Chopper', 'Médecins de l’équipe', 'medium'],
  ['Ken', 'Sanji', 'Blonds qui se battent à coups de pied', 'medium'],
  ['Pit Maléfique', 'Sasuke', 'Rivaux ténébreux du héros', 'medium'],
  ['Luigi', 'Usopp', 'Froussards au grand cœur', 'medium'],
  ['Donkey Kong', 'Franky', 'Colosses aux gros bras', 'easy'],
  ['Mario', 'Goku', 'Héros les plus célèbres du Japon', 'easy'],
  ['Lucario', 'Kurama', 'Bêtes qui maîtrisent l’énergie', 'easy'],

  // --- Ajouts (novembre 2026) ---
  ['Kirby', 'Boo', 'Boules roses qui avalent leurs ennemis', 'extreme'],
  ['Amphinobi', 'Jiraiya', 'Ninjas amis des crapauds', 'extreme'],
  ['Mega Man', 'Genos', 'Robots au canon-bras', 'extreme'],
  ['Terry', 'Jotaro', 'Bagarreurs à casquette', 'extreme'],
  ['Olimar', 'Senku', 'Scientifiques naufragés qui reconstruisent tout', 'extreme'],
  ['Sheik', 'Itachi', 'Ninjas aux yeux rouges', 'hard'],
  ['Séphiroth', 'Byakuya', 'Épéistes froids et élégants aux cheveux longs', 'hard'],
  ['Ike', 'Kenpachi', 'Brutes au gros glaive', 'hard'],
  ['Roy', 'Natsu', 'Jeunes héros aux attaques de feu', 'hard'],
  ['Shulk', 'Eren', 'Héros qui voient l’avenir', 'hard'],
  ['Mewtwo', 'Mob', 'Psychiques surpuissants', 'hard'],
  ['Snake', 'Lupin III', 'Infiltrés de légende', 'hard'],
  ['Bayonetta', 'Makima', 'Femmes fatales surnaturelles', 'hard'],
  ['Ryu', 'Ken le Survivant', 'Maîtres d’arts martiaux taciturnes', 'hard'],
  ['Little Mac', 'Rock Lee', 'Petits gabarits qui ne vivent que pour l’entraînement', 'hard'],
  ['Captain Falcon', 'Endeavor', 'Héros au poing de feu', 'hard'],
  ['Dr. Mario', 'Tsunade', 'Médecins de l’équipe', 'hard'],
  ['Sora', 'Gon', 'Garçons joyeux qui partent à l’aventure', 'hard'],
  ['Daraen', 'Lelouch', 'Stratèges de génie', 'hard'],
  ['Wario', 'Barbe Noire', 'Méchants goinfres et cupides', 'hard'],
  ['Lucina', 'Mikasa', 'Guerrières à l’épée qui protègent les leurs', 'medium'],
  ['Cloud', 'Kirito', 'Épéistes ténébreux en noir', 'medium'],
  ['Pikachu', 'Killua', 'Électriques et rapides', 'medium'],
  ['Samus sans armure', 'Yor', 'Agentes redoutables en combinaison', 'medium'],
  ['Harmonie & Luma', 'Frieren', 'Êtres presque immortels qui veillent seules', 'medium'],
  ['Héros', 'Frieren', 'Héros d’une quête contre le roi démon', 'medium'],
  ['Joker', 'Kaneki', 'Lycéens qui basculent du côté sombre', 'medium'],
  ['Kazuya', 'Végéta', 'Rivaux orgueilleux et diaboliques', 'medium'],
  ['Bowser', 'Freezer', 'Tyrans qui reviennent toujours', 'medium'],
  ['Villageois', 'Chihiro', 'Enfants qui débarquent dans un village étrange', 'medium'],
  ['Steve', 'Rimuru', 'Bâtisseurs de leur propre monde', 'medium'],
  ['Peach', 'Hancock', 'Princesses adulées par leurs sujets', 'medium'],
  ['Corrin', 'Rimuru', 'Héros qui se changent en créature', 'medium'],
  ['Byleth', 'Gojo', 'Profs surpuissants', 'medium'],
  ['Ganondorf', 'Muzan', 'Seigneurs du mal immortels', 'medium'],
  ['Inkling', 'Nezuko', 'Héroïnes de petite taille qui se transforment', 'medium'],
  ['Marth', 'Asta', 'Héros à l’épée qui visent le trône', 'easy'],
  ['Luigi', 'Armin', 'Froussards qui finissent par briller', 'easy'],
  ['Donkey Kong', 'Gaï', 'Gros bras infatigables', 'easy'],
  ['Pac-Man', 'Doraemon', 'Mascottes rondes et gourmandes', 'easy'],
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
  ['Yuumi', 'Luna', 'Chats magiques qui aident l’héroïne', 'extreme'],
  ['Jhin', 'Light Yagami', 'Tueurs qui voient le meurtre comme un art', 'hard'],
  ['Yone', 'Ichigo', 'Épéistes à moitié démons qui portent un masque', 'hard'],
  ['Ryze', 'Frieren', 'Mages qui ont vécu des siècles', 'hard'],
  ['Twisted Fate', 'Lupin III', 'Voleurs charmeurs et joueurs', 'hard'],
  ['Kennen', 'Killua', 'Petits rapides et électriques', 'hard'],
  ['Thresh', 'Orochimaru', 'Méchants qui collectionnent les âmes et les corps', 'medium'],
  ['Irelia', 'Mikasa', 'Lames qui défendent leur patrie', 'medium'],
  ['Vi', 'Bakugo', 'Têtes brûlées qui règlent tout aux poings', 'medium'],
  ['Sett', 'Jotaro', 'Bagarreurs aux poings redoutables', 'medium'],
  ['Graves', 'Nicky Larson', 'Flingueurs au grand cœur', 'medium'],
  ['Draven', 'Baggy', 'Frimeurs qui adorent qu’on parle d’eux', 'medium'],
  ['Garen', 'All Might', 'Héros nationaux pleins de muscles', 'easy'],

  // --- Ajouts (novembre 2026) ---
  ['Jinx', 'Deidara', 'Artificiers fous qui adorent les explosions', 'extreme'],
  ['Pyke', 'Kisame', 'Tueurs à l’allure de poisson', 'extreme'],
  ['Twisted Fate', 'Hisoka', 'Lanceurs de cartes', 'extreme'],
  ['Diana', 'Sailor Moon', 'Guerrières de la Lune', 'extreme'],
  ['Yuumi', 'Jiji', 'Chats magiques compagnons d’une magicienne', 'extreme'],
  ['Ahri', 'Hancock', 'Charmeuses qui envoûtent leurs ennemis', 'hard'],
  ['Yasuo', 'Giyu', 'Épéistes taciturnes', 'hard'],
  ['Lux', 'Sakura Kinomoto', 'Magical girls à baguette', 'hard'],
  ['Zed', 'Sasuke', 'Ninjas des ombres qui ont tourné le dos à leur maître', 'hard'],
  ['Miss Fortune', 'Nami', 'Rousses de la piraterie', 'hard'],
  ['Tahm Kench', 'Boo', 'Gros démons qui avalent tout', 'hard'],
  ['Lee Sin', 'Rock Lee', 'Maîtres du combat à mains nues', 'hard'],
  ['Udyr', 'Inosuke', 'Sauvages aux esprits animaux', 'hard'],
  ['Soraka', 'Tsunade', 'Soigneuses de génie', 'hard'],
  ['Seraphine', 'Misa', 'Idoles de la chanson et de la mode', 'hard'],
  ['Ivern', 'Totoro', 'Gardiens bienveillants de la forêt', 'hard'],
  ['Brand', 'Endeavor', 'Hommes en flammes', 'hard'],
  ['Lulu', 'Kiki', 'Petites sorcières', 'hard'],
  ['Camille', 'Yor', 'Tueuses élégantes aux lames', 'hard'],
  ['Vayne', 'Tanjiro', 'Chasseurs de démons qui ont perdu leur famille', 'hard'],
  ['Briar', 'Inosuke', 'Sauvages qui foncent sans réfléchir', 'hard'],
  ['Karthus', 'Orochimaru', 'Obsédés par la mort et l’immortalité', 'hard'],
  ['Mordekaiser', 'Pain', 'Seigneurs qui règnent sur les morts', 'medium'],
  ['Caitlyn', 'Near', 'Détectives de génie', 'medium'],
  ['Jax', 'Gaï', 'Combattants infatigables', 'medium'],
  ['Leona', 'Sailor Mars', 'Guerrières du soleil et du feu', 'medium'],
  ['Maokai', 'Princesse Mononoké', 'Défenseurs de la nature', 'medium'],
  ['Smolder', 'Natsu', 'Petits dragons du feu', 'medium'],
  ['Blitzcrank', 'Astro', 'Robots attachants', 'medium'],
  ['Akshan', 'Lupin III', 'Voyous charmeurs au grappin', 'medium'],
  ['Kayle', 'Hancock', 'Femmes hautaines qui jugent tout le monde', 'medium'],
  ['Nidalee', 'Princesse Mononoké', 'Sauvageonnes élevées par les bêtes', 'hard'],
  ['Ambessa', 'Big Mom', 'Mères de famille tyranniques', 'medium'],
  ['Viego', 'Inuyasha', 'Héros prêts à tout pour la femme qu’ils aiment', 'medium'],
  ['Sivir', 'Nami', 'Mercenaires qui aiment l’argent', 'medium'],
  ['Kindred', 'Sukuna', 'Entités à deux visages', 'medium'],
  ['Gnar', 'Chopper', 'Petites boules de poils qui deviennent énormes', 'easy'],
  ['Shen', 'Minato', 'Ninjas qui se téléportent auprès de leurs alliés', 'easy'],
  ['Rell', 'Mikasa', 'Guerrières qui ont grandi trop vite', 'easy'],
  ['Garen', 'Livaï', 'Soldats d’élite fidèles à leur royaume', 'easy'],
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

function build(def: MixDef): { pairs: ChampionPair[]; index: Map<string, MixEntry> } {
  const otherNames = namesOf(def.other.pairs);
  const index = new Map<string, MixEntry>();
  const seeds: PairSeed[] = def.cross.map(([name, anime, theme, d]) => {
    index.set(name, { source: def.other.source, base: name });
    const display = otherNames.has(anime) ? `${anime} (${ANIME_INFO[anime]?.series ?? 'anime'})` : anime;
    index.set(display, { source: 'anime', base: anime });
    return [name, display, theme, d] as const;
  });
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

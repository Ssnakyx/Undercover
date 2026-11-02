import type { Universe } from '../types';

// Textes et identité visuelle de chaque univers de contenu — même moteur de jeu, vocabulaire
// et couleur d'accent adaptés (voir styles/grimoire.css, [data-universe]).
export interface UniverseCopy {
  universe: Universe;
  name: string;
  franchise: string; // sous-titre affiché sous le nom
  tagline: string;
  unitLabel: string; // "champion" / "combattant" / "Pokémon" / "jeu" / "personnage" — instructions de jeu
  unitArticle: string; // "ton champion", "ton jeu"...
  nameLabel: string; // libellé du champ pseudo
  namePlaceholder: string;
  /** Personnages mis en avant sur la carte du menu (images servies par le client ou Data Dragon). */
  showcase: string[];
}

const DDRAGON = 'https://ddragon.leagueoflegends.com/cdn/img/champion/loading';

const COPY: Record<Universe, UniverseCopy> = {
  lol: {
    universe: 'lol',
    name: 'lolCover',
    franchise: 'League of Legends',
    tagline: 'Un intrus se cache dans la Faille. Décris ton champion sans le nommer et démasque les Undercover.',
    unitLabel: 'champion',
    unitArticle: 'ton champion',
    nameLabel: "Ton pseudo d'invocateur",
    namePlaceholder: 'ex. NoctaJungle',
    showcase: [`${DDRAGON}/Ahri_0.jpg`, `${DDRAGON}/Garen_0.jpg`, `${DDRAGON}/Jinx_0.jpg`],
  },
  smash: {
    universe: 'smash',
    name: 'SmashCover',
    franchise: 'Super Smash Bros. Ultimate',
    tagline: 'Un imposteur est monté sur le ring. Décris ton combattant sans le nommer et démasque les Undercover.',
    unitLabel: 'combattant',
    unitArticle: 'ton combattant',
    nameLabel: 'Ton pseudo de smasher',
    namePlaceholder: 'ex. FalconPunch_',
    showcase: ['/img/smash/link.webp', '/img/smash/mario.webp', '/img/smash/kirby.webp'],
  },
  pokemon: {
    universe: 'pokemon',
    name: 'PokéCover',
    franchise: 'Pokémon',
    tagline: 'Un dresseur ment sur son équipe. Décris ton Pokémon sans le nommer et démasque les Undercover.',
    unitLabel: 'Pokémon',
    unitArticle: 'ton Pokémon',
    nameLabel: 'Ton pseudo de dresseur',
    namePlaceholder: 'ex. SachaDuBourgPalette',
    showcase: ['/img/pokemon/4.webp', '/img/pokemon/25.webp', '/img/pokemon/7.webp'],
  },
  games: {
    universe: 'games',
    name: 'GameCover',
    franchise: 'Jeux vidéo',
    tagline: "Tout le monde a un jeu en tête… sauf que ce n'est pas le même pour tous. Décris ton jeu sans le nommer.",
    unitLabel: 'jeu',
    unitArticle: 'ton jeu',
    nameLabel: 'Ton pseudo de gamer',
    namePlaceholder: 'ex. xX_Sn1per_Xx',
    showcase: [],
  },
  anime: {
    universe: 'anime',
    name: 'AnimeCover',
    franchise: 'Manga & Anime',
    tagline: "Un intrus s'est glissé dans le manga. Décris ton personnage sans le nommer et démasque les Undercover.",
    unitLabel: 'personnage',
    unitArticle: 'ton personnage',
    nameLabel: "Ton pseudo d'otaku",
    namePlaceholder: 'ex. RoiDesPirates',
    showcase: [],
  },
  'smash-anime': {
    universe: 'smash-anime',
    name: 'Smash × Anime',
    franchise: 'Super Smash Bros. et Manga & Anime',
    tagline: 'Les combattants de Smash croisent les héros de manga. Décris ton personnage sans le nommer et démasque les Undercover.',
    unitLabel: 'personnage',
    unitArticle: 'ton personnage',
    nameLabel: 'Ton pseudo de combattant',
    namePlaceholder: 'ex. FalconKamehameha',
    showcase: [],
  },
  'lol-anime': {
    universe: 'lol-anime',
    name: 'LoL × Anime',
    franchise: 'League of Legends et Manga & Anime',
    tagline: 'Les champions de la Faille croisent les héros de manga. Décris ton personnage sans le nommer et démasque les Undercover.',
    unitLabel: 'personnage',
    unitArticle: 'ton personnage',
    nameLabel: "Ton pseudo d'invocateur",
    namePlaceholder: 'ex. AhriNoKitsune',
    showcase: [],
  },
  brawl: {
    universe: 'brawl',
    name: 'BrawlCover',
    franchise: 'Brawl Stars',
    tagline: 'Un intrus se cache dans ton équipe. Décris ton Brawler sans le nommer et démasque les Undercover.',
    unitLabel: 'Brawler',
    unitArticle: 'ton Brawler',
    nameLabel: 'Ton pseudo de brawler',
    namePlaceholder: 'ex. ShellyMain',
    showcase: [],
  },
};

export const UNIVERSES: Universe[] = ['lol', 'smash', 'pokemon', 'games', 'anime', 'smash-anime', 'lol-anime', 'brawl'];

export function universeCopy(universe: Universe): UniverseCopy {
  return COPY[universe];
}

export function isUniverse(value: string | undefined): value is Universe {
  return (UNIVERSES as (string | undefined)[]).includes(value);
}

// Source de vérité serveur pour les paires de combattants Super Smash Bros Ultimate (univers
// 'smash', voir docs/CONTRACT.md section 6 & 7 et content/pairsStore.ts).
// champA = combattant attribué aux civils (la "majorité").
// champB = combattant attribué aux undercover (la version "proche" thématiquement — souvent
// un Echo Fighter officiel, un clone de moveset, ou un rival de lore explicite).
// Toutes les entrées ci-dessous sont la liste de base : enabled = true, isCustom = false.

import type { ChampionPair } from '../types.js';

export const smashPairs: ChampionPair[] = [
  { id: 'mario-luigi', champA: 'Mario', champB: 'Luigi', theme: 'Frères plombiers au moveset quasi identique', enabled: true, isCustom: false },
  { id: 'peach-daisy', champA: 'Peach', champB: 'Daisy', theme: 'Princesses quasi-clones (Echo Fighter officiel)', enabled: true, isCustom: false },
  { id: 'fox-falco', champA: 'Fox', champB: 'Falco', theme: "Pilotes Star Fox quasi-clones, dits \"spacies\"", enabled: true, isCustom: false },
  { id: 'marth-lucina', champA: 'Marth', champB: 'Lucina', theme: 'Ancêtre et descendante, clone quasi parfait (Echo Fighter)', enabled: true, isCustom: false },
  { id: 'roy-chrom', champA: 'Roy', champB: 'Chrom', theme: "Seigneurs Fire Emblem à l'épée sans pointe affaiblie (Echo Fighter)", enabled: true, isCustom: false },
  { id: 'ike-cloud', champA: 'Ike', champB: 'Cloud', theme: 'Épéistes taciturnes au grand glaive surpuissant', enabled: true, isCustom: false },
  { id: 'ness-lucas', champA: 'Ness', champB: 'Lucas', theme: 'Enfants psychiques à la batte et aux pouvoirs PK', enabled: true, isCustom: false },
  { id: 'pit-darkpit', champA: 'Pit', champB: 'Dark Pit', theme: 'Ange et clone des ténèbres, littéralement identiques (Echo Fighter)', enabled: true, isCustom: false },
  { id: 'simon-richter', champA: 'Simon', champB: 'Richter', theme: 'Chasseurs de vampires Belmont, quasi-clones (Echo Fighter)', enabled: true, isCustom: false },
  { id: 'pikachu-pichu', champA: 'Pikachu', champB: 'Pichu', theme: 'Évolution Pokémon au moveset quasi identique', enabled: true, isCustom: false },
  { id: 'samus-darksamus', champA: 'Samus', champB: 'Dark Samus', theme: 'Chasseuse de primes et son clone corrompu (Echo Fighter)', enabled: true, isCustom: false },
  { id: 'zelda-sheik', champA: 'Zelda', champB: 'Sheik', theme: 'Princesse et son alter-ego ninja', enabled: true, isCustom: false },
  { id: 'link-younglink', champA: 'Link', champB: 'Young Link', theme: 'Le même héros à travers deux époques', enabled: true, isCustom: false },
  { id: 'ganondorf-captainfalcon', champA: 'Ganondorf', champB: 'Captain Falcon', theme: 'Le seigneur des ténèbres au moveset calqué sur le pilote de F-Zero', enabled: true, isCustom: false },
  { id: 'donkeykong-diddykong', champA: 'Donkey Kong', champB: 'Diddy Kong', theme: 'Duo de gorille et de singe de la jungle DK', enabled: true, isCustom: false },
  { id: 'kirby-jigglypuff', champA: 'Kirby', champB: 'Jigglypuff', theme: 'Boules roses volantes à multi-saut', enabled: true, isCustom: false },
  { id: 'metaknight-kingdedede', champA: 'Meta Knight', champB: 'King Dedede', theme: 'Rivaux historiques de Kirby à Dream Land', enabled: true, isCustom: false },
  { id: 'ryu-ken', champA: 'Ryu', champB: 'Ken', theme: 'Rivaux Street Fighter au moveset quasi identique', enabled: true, isCustom: false },
  { id: 'cloud-sephiroth', champA: 'Cloud', champB: 'Sephiroth', theme: 'Héros et némésis emblématiques de Final Fantasy VII', enabled: true, isCustom: false },
  { id: 'snake-sonic', champA: 'Snake', champB: 'Sonic', theme: 'Icônes tierces historiques, rivales de Nintendo dans les années 90', enabled: true, isCustom: false },
  { id: 'megaman-pacman', champA: 'Mega Man', champB: 'Pac-Man', theme: 'Icônes tierces rétro emblématiques du jeu vidéo classique', enabled: true, isCustom: false },
  { id: 'bayonetta-palutena', champA: 'Bayonetta', champB: 'Palutena', theme: 'Déesses élégantes au combat magique aérien', enabled: true, isCustom: false },
  { id: 'isabelle-villager', champA: 'Isabelle', champB: 'Villager', theme: 'Duo Animal Crossing au même arsenal (hache, canne à pêche, lance-pierre)', enabled: true, isCustom: false },
  { id: 'duckhunt-gamewatch', champA: 'Duck Hunt', champB: 'Mr. Game & Watch', theme: 'Antiquités jouables rétro NES / Game & Watch', enabled: true, isCustom: false },
  { id: 'zerosuitsamus-sheik', champA: 'Zero Suit Samus', champB: 'Sheik', theme: 'Formes secondes révélées par transformation', enabled: true, isCustom: false },
  { id: 'incineroar-charizard', champA: 'Incineroar', champB: 'Charizard', theme: 'Pokémon de type Feu emblématiques', enabled: true, isCustom: false },
  { id: 'lucario-mewtwo', champA: 'Lucario', champB: 'Mewtwo', theme: "Pokémon psychiques à l'aura surpuissante", enabled: true, isCustom: false },
  { id: 'robin-corrin', champA: 'Robin', champB: 'Corrin', theme: 'Fire Emblem : tacticien et dragon royal au combat hybride épée/magie', enabled: true, isCustom: false },
  { id: 'wolf-fox', champA: 'Wolf', champB: 'Fox', theme: "Mercenaires rivaux de l'espace Lylat, chef de meute contre capitaine", enabled: true, isCustom: false },
  { id: 'kingkrool-donkeykong', champA: 'King K. Rool', champB: 'Donkey Kong', theme: 'Némésis crocodile historique du royaume Kong', enabled: true, isCustom: false },
];

// Source de vérité serveur pour les paires de combattants Super Smash Bros Ultimate (univers
// 'smash', voir docs/CONTRACT.md section 6 & 7 et content/pairsStore.ts).
// champA = combattant attribué aux civils (la "majorité").
// champB = combattant attribué aux undercover (la version "proche" thématiquement — souvent
// un Echo Fighter officiel, un clone de moveset, ou un rival de lore explicite).
// Liste fixe, tirée aléatoirement à chaque partie — pas d'édition en cours de partie.
//
// La difficulté n'est pas un champ à part : elle vient de la proximité champA/champB. Ce pool
// mélange volontairement des Echo Fighters quasi identiques (undercover très difficile à
// repérer) et des rivaux plus éloignés visuellement/mécaniquement (undercover plus repérable).

import type { ChampionPair } from '../types.js';

export const smashPairs: ChampionPair[] = [
  { id: 'mario-luigi', champA: 'Mario', champB: 'Luigi', theme: 'Frères plombiers au moveset quasi identique' },
  { id: 'peach-daisy', champA: 'Peach', champB: 'Daisy', theme: 'Princesses quasi-clones (Echo Fighter officiel)' },
  { id: 'fox-falco', champA: 'Fox', champB: 'Falco', theme: "Pilotes Star Fox quasi-clones, dits \"spacies\"" },
  { id: 'marth-lucina', champA: 'Marth', champB: 'Lucina', theme: 'Ancêtre et descendante, clone quasi parfait (Echo Fighter)' },
  { id: 'roy-chrom', champA: 'Roy', champB: 'Chrom', theme: "Seigneurs Fire Emblem à l'épée sans pointe affaiblie (Echo Fighter)" },
  { id: 'ike-cloud', champA: 'Ike', champB: 'Cloud', theme: 'Épéistes taciturnes au grand glaive surpuissant' },
  { id: 'ness-lucas', champA: 'Ness', champB: 'Lucas', theme: 'Enfants psychiques à la batte et aux pouvoirs PK' },
  { id: 'pit-darkpit', champA: 'Pit', champB: 'Dark Pit', theme: 'Ange et clone des ténèbres, littéralement identiques (Echo Fighter)' },
  { id: 'simon-richter', champA: 'Simon', champB: 'Richter', theme: 'Chasseurs de vampires Belmont, quasi-clones (Echo Fighter)' },
  { id: 'pikachu-pichu', champA: 'Pikachu', champB: 'Pichu', theme: 'Évolution Pokémon au moveset quasi identique' },
  { id: 'samus-darksamus', champA: 'Samus', champB: 'Dark Samus', theme: 'Chasseuse de primes et son clone corrompu (Echo Fighter)' },
  { id: 'zelda-sheik', champA: 'Zelda', champB: 'Sheik', theme: 'Princesse et son alter-ego ninja' },
  { id: 'link-younglink', champA: 'Link', champB: 'Young Link', theme: 'Le même héros à travers deux époques' },
  { id: 'ganondorf-captainfalcon', champA: 'Ganondorf', champB: 'Captain Falcon', theme: 'Le seigneur des ténèbres au moveset calqué sur le pilote de F-Zero' },
  { id: 'donkeykong-diddykong', champA: 'Donkey Kong', champB: 'Diddy Kong', theme: 'Duo de gorille et de singe de la jungle DK' },
  { id: 'kirby-jigglypuff', champA: 'Kirby', champB: 'Jigglypuff', theme: 'Boules roses volantes à multi-saut' },
  { id: 'metaknight-kingdedede', champA: 'Meta Knight', champB: 'King Dedede', theme: 'Rivaux historiques de Kirby à Dream Land' },
  { id: 'ryu-ken', champA: 'Ryu', champB: 'Ken', theme: 'Rivaux Street Fighter au moveset quasi identique' },
  { id: 'cloud-sephiroth', champA: 'Cloud', champB: 'Sephiroth', theme: 'Héros et némésis emblématiques de Final Fantasy VII' },
  { id: 'snake-sonic', champA: 'Snake', champB: 'Sonic', theme: 'Icônes tierces historiques, rivales de Nintendo dans les années 90' },
  { id: 'megaman-pacman', champA: 'Mega Man', champB: 'Pac-Man', theme: 'Icônes tierces rétro emblématiques du jeu vidéo classique' },
  { id: 'bayonetta-palutena', champA: 'Bayonetta', champB: 'Palutena', theme: 'Déesses élégantes au combat magique aérien' },
  { id: 'isabelle-villager', champA: 'Isabelle', champB: 'Villager', theme: 'Duo Animal Crossing au même arsenal (hache, canne à pêche, lance-pierre)' },
  { id: 'duckhunt-gamewatch', champA: 'Duck Hunt', champB: 'Mr. Game & Watch', theme: 'Antiquités jouables rétro NES / Game & Watch' },
  { id: 'zerosuitsamus-sheik', champA: 'Zero Suit Samus', champB: 'Sheik', theme: 'Formes secondes révélées par transformation' },
  { id: 'incineroar-charizard', champA: 'Incineroar', champB: 'Charizard', theme: 'Pokémon de type Feu emblématiques' },
  { id: 'lucario-mewtwo', champA: 'Lucario', champB: 'Mewtwo', theme: "Pokémon psychiques à l'aura surpuissante" },
  { id: 'robin-corrin', champA: 'Robin', champB: 'Corrin', theme: 'Fire Emblem : tacticien et dragon royal au combat hybride épée/magie' },
  { id: 'wolf-fox', champA: 'Wolf', champB: 'Fox', theme: "Mercenaires rivaux de l'espace Lylat, chef de meute contre capitaine" },
  { id: 'kingkrool-donkeykong', champA: 'King K. Rool', champB: 'Donkey Kong', theme: 'Némésis crocodile historique du royaume Kong' },
  // --- Paire très proche (undercover difficile à repérer) ---
  { id: 'terry-kazuya', champA: 'Terry', champB: 'Kazuya', theme: 'Invités combattants au commandes façon jeu de combat classique' },
  // --- Paires plus éloignées (undercover plus facile à repérer) ---
  { id: 'littlemac-captainfalcon', champA: 'Little Mac', champB: 'Captain Falcon', theme: 'Combattants au poing, styles radicalement opposés' },
  { id: 'rosalina-olimar', champA: 'Rosalina', champB: 'Olimar', theme: 'Duos avec compagnons, allure totalement différente (Luma vs Pikmin)' },
];

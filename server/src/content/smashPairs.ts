// Univers 'smash' — Super Smash Bros. Ultimate. Noms français officiels du roster (ceux de
// l'écran de sélection FR), uniquement des combattants jouables : chacun a son portrait
// (voir content/characterImages.ts). Les noms anglais restent acceptés pour la devinette de
// Mr White (alias). Voir content/pairSeed.ts pour le format et les règles de qualité.

import { buildPairs, type PairSeed } from './pairSeed.js';

const SEEDS: PairSeed[] = [
  // --- Difficiles : Echo Fighters, clones de moveset, duos inséparables ---
  ['Mario', 'Luigi', 'Frères plombiers', 'hard'],
  ['Peach', 'Daisy', 'Princesses du Royaume Champignon', 'hard'],
  ['Fox', 'Falco', 'Pilotes de Star Fox', 'hard'],
  ['Fox', 'Wolf', 'Pilotes rivaux de l’espace', 'hard'],
  ['Marth', 'Lucina', 'Épéistes Fire Emblem ancêtre et descendante', 'hard'],
  ['Roy', 'Chrom', 'Seigneurs Fire Emblem à l’épée enflammée', 'hard'],
  ['Ryu', 'Ken', 'Rivaux de Street Fighter', 'hard'],
  ['Simon', 'Richter', 'Chasseurs de vampires Belmont', 'hard'],
  ['Ness', 'Lucas', 'Enfants psychiques de Mother', 'hard'],
  ['Pikachu', 'Pichu', 'Souris électriques', 'hard'],
  ['Zelda', 'Sheik', 'Princesse et son alter ego ninja', 'hard'],
  ['Captain Falcon', 'Ganondorf', 'Colosses au même moveset', 'hard'],
  ['Donkey Kong', 'Diddy Kong', 'Duo de la jungle DK', 'hard'],
  ['Bowser', 'King K. Rool', 'Rois reptiles ennemis jurés', 'hard'],
  ['Villageois', 'Marie', 'Habitants d’Animal Crossing', 'hard'],
  ['Shulk', 'Pyra / Mythra', 'Héros de Xenoblade Chronicles', 'hard'],
  ['Cloud', 'Séphiroth', 'Héros et némésis de Final Fantasy VII', 'hard'],
  ['Lucario', 'Amphinobi', 'Pokémon combattants agiles', 'hard'],
  ['Palutena', 'Harmonie & Luma', 'Déesses et protectrices célestes', 'hard'],
  ['Roi DaDiDou', 'Meta Knight', 'Rivaux de Kirby à Dream Land', 'hard'],
  ['Kirby', 'Rondoudou', 'Boules roses volantes', 'hard'],
  ['Ike', 'Byleth', 'Mercenaires de Fire Emblem', 'hard'],
  ['Corrin', 'Daraen', 'Tacticiens de Fire Emblem', 'hard'],
  ['Pit', 'Palutena', 'Ange et déesse de Kid Icarus', 'hard'],
  ['Terry', 'Kazuya', 'Combattants venus des jeux de baston', 'hard'],

  // --- Moyennes : même univers ou même archétype ---
  ['Mario', 'Wario', 'Moustachus rivaux', 'medium'],
  ['Wario', 'Bowser Jr.', 'Petits teigneux de l’univers Mario', 'medium'],
  ['Bowser', 'Ridley', 'Grands méchants à écailles', 'medium'],
  ['Samus', 'Mega Man', 'Héros au canon-bras', 'medium'],
  ['Link', 'Héros', 'Aventuriers à l’épée et au bouclier', 'medium'],
  ['Link', 'Shulk', 'Héros silencieux à épée légendaire', 'medium'],
  ['Sora', 'Héros', 'Jeunes héros à la Keyblade et à l’épée', 'medium'],
  ['Cloud', 'Ike', 'Épéistes au grand glaive', 'medium'],
  ['Snake', 'Joker', 'Infiltrateurs à la tenue sombre', 'medium'],
  ['Bayonetta', 'Joker', 'Héros stylés aux armes à feu', 'medium'],
  ['Steve', 'Villageois', 'Bâtisseurs qui récoltent tout', 'medium'],
  ['Inkling', 'Villageois', 'Mascottes récentes de Nintendo', 'medium'],
  ['Little Mac', 'Terry', 'Combattants aux poings', 'medium'],
  ['Ganondorf', 'Séphiroth', 'Seigneurs du mal', 'medium'],
  ['Kazuya', 'Ryu', 'Karatékas des jeux de baston', 'medium'],
  ['Yoshi', 'Kirby', 'Mascottes qui avalent leurs ennemis', 'medium'],
  ['R.O.B.', 'Mr. Game & Watch', 'Combattants rétro de Nintendo', 'medium'],
  ['Duo Duck Hunt', 'R.O.B.', 'Accessoires rétro de la NES', 'medium'],
  ['Ice Climbers', 'Duo Duck Hunt', 'Duos inséparables', 'medium'],
  ['Olimar', 'Villageois', 'Petits héros aux grandes armées', 'medium'],
  ['Félinferno', 'Lucario', 'Pokémon du roster', 'medium'],
  ['Mewtwo', 'Lucario', 'Pokémon psy et aura', 'medium'],
  ['Dresseur de Pokémon', 'Pikachu', 'Icônes de l’univers Pokémon', 'medium'],
  ['Plante Piranha', 'Bowser Jr.', 'Sbires de l’armée Koopa', 'medium'],
  ['Min Min', 'Little Mac', 'Boxeurs à longue portée', 'medium'],
  ['Banjo & Kazooie', 'Donkey Kong', 'Héros des jeux Rare', 'medium'],
  ['Entraîneuse Wii Fit', 'Little Mac', 'Sportifs de Nintendo', 'medium'],

  // --- Faciles : icônes du jeu vidéo ---
  ['Mario', 'Sonic', 'Mascottes rivales des années 90', 'easy'],
  ['Pac-Man', 'Mega Man', 'Icônes rétro du jeu vidéo', 'easy'],
  ['Link', 'Marth', 'Héros légendaires à l’épée', 'easy'],
  ['Pikachu', 'Kirby', 'Mascottes adorables', 'easy'],
  ['Steve', 'Sora', 'Invités venus d’ailleurs', 'easy'],
  ['Mr. Game & Watch', 'Pac-Man', 'Pionniers du jeu vidéo', 'easy'],
];

export const smashPairs = buildPairs('smash', SEEDS);

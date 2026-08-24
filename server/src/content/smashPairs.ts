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
// Au-delà du roster jouable de base, le pool inclut aussi des combattants DLC (Fighters Pass 1
// & 2 : Piranha Plant, Joker, Hero, Banjo & Kazooie, Terry, Byleth, Min Min, Steve, Pyra/Mythra,
// Kazuya, Sephiroth, Sora) et des personnages de trophées d'aide (non jouables en combat, mais
// utilisés ici comme identité à décrire, exactement comme un combattant) — signalés dans le
// champ `theme` de chaque paire concernée.

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
  // --- Nouvelles paires difficiles (combattants DLC + trophées d'aide, undercover très
  //     difficile à repérer) ---
  { id: 'pyra-mythra', champA: 'Pyra', champB: 'Mythra', theme: 'Deux aspects d\'une seule et même Lame, littéralement la même personne (DLC)' },
  { id: 'springman-minmin', champA: 'Spring Man', champB: 'Min Min', theme: 'Combattants ARMS aux bras extensibles du même jeu d\'origine (trophée d\'aide + DLC)' },
  { id: 'zero-megaman', champA: 'Zero', champB: 'Mega Man', theme: 'Robots héros de la saga Mega Man, rivaux devenus alliés (trophée d\'aide)' },
  { id: 'peteypiranha-piranhaplant', champA: 'Petey Piranha', champB: 'Piranha Plant', theme: 'Plantes carnivores emblématiques de l\'univers Mario (trophée d\'aide + DLC)' },
  { id: 'devil-gamewatch', champA: 'Devil', champB: 'Mr. Game & Watch', theme: 'Figures plates monochromes de l\'univers Game & Watch (trophée d\'aide)' },
  { id: 'alucard-richter', champA: 'Alucard', champB: 'Richter', theme: 'Chasseurs de vampires liés au château de Dracula (trophée d\'aide)' },
  // --- Nouvelles paires moyennes (combattants DLC + trophées d'aide, undercover repérable
  //     avec attention) ---
  { id: 'joker-hero', champA: 'Joker', champB: 'Hero', theme: 'Protagonistes JRPG masqués/aventuriers menant leur groupe (DLC)' },
  { id: 'waluigi-wario', champA: 'Waluigi', champB: 'Wario', theme: 'Duo de vilains excentriques de l\'univers Mario (trophée d\'aide)' },
  { id: 'byleth-chrom', champA: 'Byleth', champB: 'Chrom', theme: 'Seigneurs Fire Emblem maniant l\'épée avec charisme (DLC)' },
  { id: 'steve-villager', champA: 'Steve', champB: 'Villager', theme: 'Icônes voxel/pixel de la construction et de la vie simulée (DLC)' },
  { id: 'sora-cloud', champA: 'Sora', champB: 'Cloud', theme: 'Héros emblématiques Square Enix à l\'arme signature imposante (DLC)' },
  { id: 'midna-zelda', champA: 'Midna', champB: 'Zelda', theme: 'Figures féminines clés de Twilight Princess, liées par la transformation (trophée d\'aide)' },
  { id: 'krystal-fox', champA: 'Krystal', champB: 'Fox', theme: 'Membres de l\'équipe Star Fox de Lylat (trophée d\'aide)' },
  { id: 'skullkid-younglink', champA: 'Skull Kid', champB: 'Young Link', theme: 'Figures emblématiques de Majora\'s Mask, masque et ocarina (trophée d\'aide)' },
  { id: 'knuckles-sonic', champA: 'Knuckles', champB: 'Sonic', theme: 'Rivaux devenus alliés de l\'univers Sonic (trophée d\'aide)' },
  { id: 'banjokazooie-donkeykong', champA: 'Banjo & Kazooie', champB: 'Donkey Kong', theme: 'Duos platformer 3D emblématiques signés Rare (DLC)' },
  // --- Encore plus de paires difficiles (roster de base + trophées d'aide) ---
  { id: 'bowser-bowserjr', champA: 'Bowser', champB: 'Bowser Jr.', theme: 'Père et fils Koopa, plus grandes menaces du royaume Champignon' },
  { id: 'yoshi-kirby', champA: 'Yoshi', champB: 'Kirby', theme: "Mascottes rondes de plateforme au pouvoir d'absorption (langue contre inhalation)" },
  { id: 'rob-gamewatch', champA: 'R.O.B.', champB: 'Mr. Game & Watch', theme: 'Antiquités Nintendo littéralement ramenées à la vie' },
  { id: 'drmario-mario', champA: 'Dr. Mario', champB: 'Mario', theme: 'Le même plombier, juste une blouse de médecin en plus' },
  { id: 'toonlink-younglink', champA: 'Toon Link', champB: 'Young Link', theme: 'Deux incarnations enfantines de Link à des époques différentes' },
  { id: 'squirtle-ivysaur', champA: 'Squirtle', champB: 'Ivysaur', theme: 'Deux membres de la même équipe Pokémon Trainer' },
  { id: 'ridley-darksamus', champA: 'Ridley', champB: 'Dark Samus', theme: 'Antagonistes emblématiques de la saga Metroid' },
  { id: 'shulk-pyra', champA: 'Shulk', champB: 'Pyra', theme: 'Héros liés à une lame vivante (Monado/Aegis), même saga Xenoblade Chronicles (DLC)' },
  { id: 'katana-wario', champA: 'Kat & Ana', champB: 'Wario', theme: "Ninjas jumelles de la même série WarioWare que Wario (trophée d'aide)" },
  { id: 'samuraigoroh-captainfalcon', champA: 'Samurai Goroh', champB: 'Captain Falcon', theme: "Pilotes rivaux du même circuit F-Zero (trophée d'aide)" },
  // --- Encore plus de paires moyennes (roster de base + trophées d'aide) ---
  { id: 'lyn-marth', champA: 'Lyn', champB: 'Marth', theme: "Héros Fire Emblem maniant l'épée avec grâce (trophée d'aide)" },
  { id: 'nightmare-metaknight', champA: 'Nightmare', champB: 'Meta Knight', theme: "Grandes figures mystérieuses de l'univers Kirby (trophée d'aide)" },
  { id: 'riki-shulk', champA: 'Riki', champB: 'Shulk', theme: "Compagnons de la même équipe dans Xenoblade Chronicles (trophée d'aide)" },
  { id: 'klaptrap-kingkrool', champA: 'Klaptrap', champB: 'King K. Rool', theme: "Ennemis emblématiques du royaume Kong (trophée d'aide)" },
  { id: 'iceclimbers-duckhunt', champA: 'Ice Climbers', champB: 'Duck Hunt', theme: 'Duos rétro NES ressuscités par Smash' },
  { id: 'wiifittrainer-littlemac', champA: 'Wii Fit Trainer', champB: 'Little Mac', theme: 'Icônes sportives que tout oppose, yoga contre boxe' },
  { id: 'greninja-incineroar', champA: 'Greninja', champB: 'Incineroar', theme: 'Formes finales de starters Pokémon' },
  { id: 'inkling-isabelle', champA: 'Inkling', champB: 'Isabelle', theme: 'Icônes modernes Nintendo Switch au style haut en couleur' },
];

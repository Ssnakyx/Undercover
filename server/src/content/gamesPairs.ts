// Univers 'games' — des jeux vidéo plutôt que des personnages : chacun décrit SON jeu sans le
// nommer. Titres tels qu'on les dit en France. Voir content/pairSeed.ts pour le format et les
// règles de qualité.

import { buildPairs, type PairSeed } from './pairSeed.js';

const SEEDS: PairSeed[] = [
  // --- Difficiles : concurrents directs du même genre ---
  ['Valorant', 'Counter-Strike 2', 'FPS tactiques 5 contre 5', 'hard'],
  ['League of Legends', 'Dota 2', 'MOBA', 'hard'],
  ['Fortnite', 'Apex Legends', 'Battle royale', 'hard'],
  ['PUBG', 'Warzone', 'Battle royale réalistes', 'hard'],
  ['Call of Duty', 'Battlefield', 'FPS militaires', 'hard'],
  ['EA Sports FC', 'eFootball', 'Simulations de foot', 'hard'],
  ['Elden Ring', 'Dark Souls', 'Souls-like de FromSoftware', 'hard'],
  ['Skyrim', 'The Witcher 3', 'RPG en monde ouvert', 'hard'],
  ['GTA V', 'Red Dead Redemption 2', 'Mondes ouverts de Rockstar', 'hard'],
  ['Animal Crossing', 'Stardew Valley', 'Jeux cosy de village', 'hard'],
  ['Mario Kart', 'Crash Team Racing', 'Courses de karts', 'hard'],
  ['Street Fighter 6', 'Tekken 8', 'Jeux de combat', 'hard'],
  ['Clash Royale', 'Brawl Stars', 'Jeux mobiles de Supercell', 'hard'],
  ['Hearthstone', 'Marvel Snap', 'Jeux de cartes en ligne', 'hard'],
  ['Zelda : Breath of the Wild', 'Genshin Impact', 'Aventures en monde ouvert', 'hard'],
  ['Halo', 'Destiny', 'FPS de science-fiction de Bungie', 'hard'],
  ['Resident Evil', 'Silent Hill', 'Survival horror', 'hard'],
  ['Uncharted', 'Tomb Raider', 'Aventuriers chasseurs de trésors', 'hard'],
  ['Roblox', 'Minecraft', 'Bacs à sable créatifs', 'hard'],
  ['Subway Surfers', 'Temple Run', 'Runners sur mobile', 'hard'],
  ['Phasmophobia', 'Lethal Company', 'Horreur en coop entre potes', 'hard'],
  ["Baldur's Gate 3", 'Divinity : Original Sin 2', 'RPG tactiques de Larian', 'hard'],
  ['Diablo IV', 'Path of Exile', 'Hack’n’slash', 'hard'],
  ['World of Warcraft', 'Final Fantasy XIV', 'MMORPG', 'hard'],
  ['Cities : Skylines', 'SimCity', 'Gestion de ville', 'hard'],
  ['Gran Turismo', 'Forza Motorsport', 'Simulations de course', 'hard'],
  ['Overcooked', 'Moving Out', 'Coop chaotique sur canapé', 'hard'],
  ['Hades', 'Dead Cells', 'Rogue-lite d’action', 'hard'],
  ['Undertale', 'Deltarune', 'RPG de Toby Fox', 'hard'],
  ['It Takes Two', 'A Way Out', 'Aventures en coop obligatoire', 'hard'],

  // --- Moyennes : même famille de jeux ---
  ['Minecraft', 'Terraria', 'Jeux de construction et de minage', 'medium'],
  ['Overwatch 2', 'Valorant', 'Shooters à héros', 'medium'],
  ['Rainbow Six Siege', 'Valorant', 'FPS tactiques', 'medium'],
  ['Super Smash Bros.', 'Brawlhalla', 'Jeux de combat de plateforme', 'medium'],
  ['Among Us', 'Fall Guys', 'Jeux de soirée en ligne', 'medium'],
  ['Hollow Knight', 'Celeste', 'Plateformes indé exigeantes', 'medium'],
  ['Les Sims', 'Animal Crossing', 'Simulations de vie', 'medium'],
  ['Doom', 'Wolfenstein', 'FPS rétro bourrins', 'medium'],
  ['Pac-Man', 'Space Invaders', 'Classiques de l’arcade', 'medium'],
  ['Assassin’s Creed', 'Ghost of Tsushima', 'Infiltration historique', 'medium'],
  ['Far Cry', 'Just Cause', 'Mondes ouverts explosifs', 'medium'],
  ['Crash Bandicoot', 'Spyro', 'Plateformes PlayStation des années 90', 'medium'],
  ['Super Mario Odyssey', 'Sonic Frontiers', 'Mascottes en 3D', 'medium'],
  ['Angry Birds', 'Cut the Rope', 'Puzzles physiques sur mobile', 'medium'],
  ['Dead by Daylight', 'Friday the 13th', 'Asymétriques tueur contre survivants', 'medium'],
  ['Age of Empires', 'Civilization', 'Stratégie historique', 'medium'],
  ['StarCraft', 'Warcraft III', 'Stratégie en temps réel de Blizzard', 'medium'],
  ['Euro Truck Simulator', 'Farming Simulator', 'Simulateurs de métier', 'medium'],
  ['Just Dance', 'Guitar Hero', 'Jeux musicaux', 'medium'],
  ['Wii Sports', 'Mario Party', 'Jeux de soirée Nintendo', 'medium'],
  ['God of War', 'Devil May Cry', 'Beat’em all épiques', 'medium'],
  ['Metroid', 'Castlevania', 'Metroidvania historiques', 'medium'],
  ['Slay the Spire', 'Balatro', 'Rogue-like de cartes', 'medium'],
  ['Mortal Kombat', 'Street Fighter 6', 'Jeux de combat', 'medium'],
  ['Pokémon Écarlate', 'Palworld', 'Attraper des créatures', 'medium'],
  ['Tetris', 'Candy Crush', 'Puzzles addictifs', 'medium'],

  // --- Faciles ---
  ['Rocket League', 'EA Sports FC', 'Jeux de foot (avec ou sans voitures)', 'easy'],
  ['Minecraft', 'Fortnite', 'Phénomènes chez les ados', 'easy'],
  ['The Last of Us', 'Resident Evil', 'Survie face aux infectés', 'easy'],
  ['Portal', 'Half-Life', 'Classiques de Valve', 'easy'],
  ['Geometry Dash', 'Flappy Bird', 'Jeux rageants à un bouton', 'easy'],
  ['Zelda : Breath of the Wild', 'Elden Ring', 'Mondes ouverts à explorer', 'easy'],
];

export const gamesPairs = buildPairs('games', SEEDS);

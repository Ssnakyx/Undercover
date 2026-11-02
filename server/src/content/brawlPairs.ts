// Univers 'brawl' — Brawlers de Brawl Stars, noms officiels (identiques en jeu FR). Pas
// d'image : le client affiche une carte typographique. Voir content/pairSeed.ts pour le format
// et les règles de qualité.

import { buildPairs, type PairSeed } from './pairSeed.js';

const SEEDS: PairSeed[] = [
  // --- Ultra : même rôle, même style de tir ; seuls des détails les séparent ---
  ['Bull', 'Darryl', 'Tanks au fusil à pompe qui foncent dans le tas', 'extreme'],
  ['Barley', 'Dynamike', 'Lanceurs par-dessus les murs', 'extreme'],
  ['Jessie', 'Penny', 'Brawlers qui posent une tourelle', 'extreme'],
  ['Mortis', 'Edgar', 'Assassins qui bondissent sur leur cible', 'extreme'],
  ['Crow', 'Leon', 'Assassins légendaires', 'extreme'],
  ['Piper', 'Belle', 'Tireuses d’élite à très longue portée', 'extreme'],
  ['Poco', 'Pam', 'Soigneurs de l’équipe', 'extreme'],
  ['Janet', 'Bonnie', 'Sœurs qui s’envolent', 'extreme'],
  ['Spike', 'Sprout', 'Brawlers plantes', 'extreme'],
  ['Sandy', 'Gale', 'Contrôleurs du vent et du sable', 'extreme'],
  ['Rico', '8-Bit', 'Robots tireurs', 'extreme'],
  ['Tick', 'Grom', 'Lanceurs de bombes', 'extreme'],
  ['Mandy', 'Belle', 'Tireuses d’élite', 'extreme'],
  ['Shelly', 'Bull', 'Brawlers au fusil à pompe', 'extreme'],
  ['Nita', 'Jessie', 'Brawlers qui invoquent un compagnon', 'extreme'],
  ['Max', 'Stu', 'Brawlers ultra rapides', 'extreme'],
  ['Colt', 'Rico', 'Tireurs en rafale', 'extreme'],
  ['Byron', 'Poco', 'Soigneurs à distance', 'extreme'],

  // --- Difficile : quasi-jumeaux (même rôle ou même look) ---
  ['El Primo', 'Rosa', 'Tanks bagarreurs au corps à corps', 'hard'],
  ['El Primo', 'Bull', 'Tanks qui sautent ou foncent sur l’ennemi', 'hard'],
  ['Brock', 'Piper', 'Tireurs à longue portée', 'hard'],
  ['Tara', 'Gene', 'Brawlers mythiques et mystiques', 'hard'],
  ['8-Bit', 'Surge', 'Robots qui s’améliorent', 'hard'],
  ['Bibi', 'Jacky', 'Bagarreuses au corps à corps', 'hard'],
  ['Amber', 'Lou', 'Brawlers du feu et de la glace', 'hard'],
  ['Fang', 'Kenji', 'Artistes martiaux qui enchaînent les coups', 'hard'],
  ['Buzz', 'Fang', 'Brawlers qui bondissent et étourdissent', 'hard'],
  ['R-T', '8-Bit', 'Robots qui changent de forme', 'hard'],
  ['Emz', 'Lola', 'Stars qui ne pensent qu’à leur image', 'hard'],
  ['Frank', 'Ash', 'Tanks colossaux et énervés', 'hard'],
  ['Meg', 'Surge', 'Brawlers qui montent en puissance', 'hard'],
  ['Nani', 'Belle', 'Tireuses précises à longue portée', 'hard'],
  ['Carl', 'Bo', 'Brawlers qui lancent à distance', 'hard'],
  ['Gus', 'Byron', 'Soutiens qui protègent ou soignent', 'hard'],
  ['Gray', 'Max', 'Soutiens qui déplacent leur équipe', 'hard'],
  ['Squeak', 'Tick', 'Brawlers qui collent des bombes', 'hard'],
  ['Willow', 'Gene', 'Brawlers qui manipulent les ennemis', 'hard'],
  ['Chester', 'Gray', 'Brawlers du cirque et du spectacle', 'hard'],

  // --- Moyen : clairement liés, mais des indices précis les distinguent ---
  ['Shelly', 'Colt', 'Premiers Brawlers du jeu', 'medium'],
  ['Spike', 'Crow', 'Légendaires historiques', 'medium'],
  ['Leon', 'Sandy', 'Brawlers qui rendent invisible', 'medium'],
  ['Pam', 'Jessie', 'Mère et fille ingénieures', 'medium'],
  ['Penny', 'Darryl', 'Pirates de Brawl Stars', 'medium'],
  ['Mortis', 'Gus', 'Brawlers de la nuit et des fantômes', 'medium'],
  ['Mr. P', 'Barley', 'Serveurs de l’hôtel… et du bar', 'medium'],
  ['Poco', 'Melodie', 'Musiciens de Brawl Stars', 'medium'],
  ['Ruffs', 'Colt', 'Tireurs qui renforcent l’équipe', 'medium'],
  ['Edgar', 'Kit', 'Brawlers qui sautent sur leur cible', 'medium'],
  ['Otis', 'Gale', 'Brawlers qui bloquent les ennemis', 'medium'],
  ['Bea', 'Mandy', 'Tireuses dont le tir se recharge en puissance', 'medium'],
  ['Hank', 'Meg', 'Brawlers dans une machine ou un aquarium', 'medium'],
  ['Doug', 'Poco', 'Soigneurs qui sauvent leurs alliés', 'medium'],
  ['Cordelius', 'Willow', 'Brawlers sombres et magiques', 'medium'],
  ['Draco', 'Melodie', 'Rockeurs de Brawl Stars', 'medium'],
  ['Mico', 'Edgar', 'Brawlers qui sautent partout', 'medium'],
  ['Charlie', 'Squeak', 'Brawlers gluants ou piégeurs', 'medium'],
  ['Griff', 'Belle', 'Brawlers qui adorent l’argent', 'medium'],
  ['Sam', 'Bibi', 'Bagarreurs au corps à corps', 'medium'],
  ['Pearl', 'Amber', 'Brawlers qui chauffent', 'medium'],
  ['Chuck', 'Gray', 'Brawlers qui se téléportent', 'medium'],
  ['Moe', 'Jacky', 'Brawlers foreurs', 'medium'],

  // --- Facile : lien plus lâche, idéal pour découvrir le jeu ---
  ['Shelly', 'Spike', 'Brawlers emblématiques', 'easy'],
  ['Nita', 'Bo', 'Brawlers de la nature', 'easy'],
  ['El Primo', 'Frank', 'Gros bras de Brawl Stars', 'easy'],
  ['Colt', 'Belle', 'Cow-boys du Far West', 'easy'],
  ['Tara', 'Willow', 'Brawlers mystiques', 'easy'],
  ['Dynamike', 'Carl', 'Mineurs de la Mine', 'easy'],
  ['Lou', 'Mr. P', 'Brawlers tout mignons', 'easy'],
  ['Leon', 'Colt', 'Brawlers que tout le monde a joués', 'easy'],
  ['Bea', 'Sprout', 'Brawlers du jardin', 'easy'],
  ['Gene', 'Mr. P', 'Brawlers qui attirent ou envoient des sbires', 'easy'],
];

export const brawlPairs = buildPairs('brawl', SEEDS);

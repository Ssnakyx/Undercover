// Univers 'games' : jaquette + petite description de chaque jeu, pour aider le joueur qui ne
// connaît pas (ou mal) le jeu qu'il a reçu. Affichées uniquement sur SA carte (role:private).
//
// Jaquettes : image principale de l'article Wikipédia anglais du jeu (le wiki FR n'héberge
// pas les jaquettes), récupérée au démarrage du serveur via l'API REST publique de Wikimedia
// (voir prefetchGameCovers). Si l'API ne répond pas, le client garde sa jaquette typographique.
// `wiki` vise un jeu précis quand le nom de la paire désigne une série (ex. "Halo").

export interface GameInfo {
  /** Titre exact de l'article sur en.wikipedia.org. */
  wiki: string;
  /** Une phrase, en français, qui dit de quoi parle le jeu et comment on y joue. */
  description: string;
}

export const GAME_INFO: Record<string, GameInfo> = {
  Valorant: { wiki: 'Valorant', description: 'FPS tactique de Riot Games : deux équipes de cinq agents aux pouvoirs uniques s’affrontent pour poser ou désamorcer une bombe (le « Spike »).' },
  'Counter-Strike 2': { wiki: 'Counter-Strike 2', description: 'FPS tactique de Valve où terroristes et antiterroristes s’opposent en manches courtes : on achète ses armes et on pose ou désamorce une bombe.' },
  'League of Legends': { wiki: 'League of Legends', description: 'MOBA de Riot Games : deux équipes de cinq champions détruisent tourelles et Nexus adverse sur la Faille de l’invocateur.' },
  'Dota 2': { wiki: 'Dota 2', description: 'MOBA de Valve : deux équipes de cinq héros cherchent à détruire l’Ancien de l’autre camp, réputé très exigeant.' },
  Fortnite: { wiki: 'Fortnite Battle Royale', description: 'Battle royale cartoon d’Epic Games : 100 joueurs sautent d’un bus volant, construisent des murs et le dernier debout gagne.' },
  'Apex Legends': { wiki: 'Apex Legends', description: 'Battle royale futuriste en escouades de trois, avec des « Légendes » aux capacités spéciales et beaucoup de mobilité.' },
  PUBG: { wiki: 'PUBG: Battlegrounds', description: 'Battle royale réaliste : 100 joueurs parachutés sur une île ramassent des armes pendant que la zone jouable rétrécit.' },
  Warzone: { wiki: 'Call of Duty: Warzone', description: 'Le battle royale gratuit de Call of Duty, avec le Goulag où l’on se bat en 1 contre 1 pour revenir en jeu.' },
  'Call of Duty': { wiki: 'Call of Duty: Modern Warfare (2019 video game)', description: 'Série de FPS militaires d’Activision : campagnes spectaculaires et multijoueur nerveux, un nouvel épisode chaque année.' },
  Battlefield: { wiki: 'Battlefield 2042', description: 'Série de FPS militaires d’EA réputée pour ses immenses batailles à 64 joueurs et plus, ses véhicules et ses décors destructibles.' },
  'EA Sports FC': { wiki: 'EA Sports FC 24', description: 'La simulation de foot d’EA (l’ex-FIFA), avec le mode Ultimate Team où l’on collectionne des cartes de joueurs.' },
  eFootball: { wiki: 'eFootball 2022', description: 'Le jeu de foot gratuit de Konami (l’ex-PES), rival historique de FIFA.' },
  'Elden Ring': { wiki: 'Elden Ring', description: 'Action-RPG de FromSoftware en monde ouvert, écrit avec George R. R. Martin : des boss très durs dans l’Entre-terre.' },
  'Dark Souls': { wiki: 'Dark Souls (video game)', description: 'Action-RPG de FromSoftware célèbre pour sa difficulté : on meurt, on apprend, on recommence depuis un feu de camp.' },
  Skyrim: { wiki: 'The Elder Scrolls V: Skyrim', description: 'RPG en monde ouvert de Bethesda : on incarne l’Enfant de dragon, qui crie des sorts et chasse les dragons dans une région nordique.' },
  'The Witcher 3': { wiki: 'The Witcher 3: Wild Hunt', description: 'RPG en monde ouvert où l’on incarne Geralt de Riv, chasseur de monstres aux cheveux blancs, à la recherche de sa fille adoptive Ciri.' },
  'GTA V': { wiki: 'Grand Theft Auto V', description: 'Monde ouvert de Rockstar à Los Santos (inspirée de Los Angeles) : braquages, courses-poursuites et trois héros jouables.' },
  'Red Dead Redemption 2': { wiki: 'Red Dead Redemption 2', description: 'Western en monde ouvert de Rockstar : on suit Arthur Morgan, hors-la-loi d’une bande en fuite à la fin du Far West.' },
  'Animal Crossing': { wiki: 'Animal Crossing: New Horizons', description: 'Jeu cosy de Nintendo : on aménage son île, on pêche, on décore sa maison et on rembourse son prêt à Tom Nook.' },
  'Stardew Valley': { wiki: 'Stardew Valley', description: 'Jeu de ferme en pixel art : on reprend la ferme de son grand-père, on cultive, on pêche et on se lie avec les villageois.' },
  'Mario Kart': { wiki: 'Mario Kart 8', description: 'Courses de karts de Nintendo avec Mario et ses amis, où les objets (carapaces, bananes…) peuvent tout renverser.' },
  'Crash Team Racing': { wiki: 'Crash Team Racing Nitro-Fueled', description: 'Courses de karts avec Crash Bandicoot et sa bande, où l’on enchaîne les dérapages pour obtenir des turbos.' },
  'Street Fighter 6': { wiki: 'Street Fighter 6', description: 'Jeu de combat en 1 contre 1 de Capcom avec Ryu, Chun-Li et compagnie : enchaînements de coups et attaques spéciales.' },
  'Tekken 8': { wiki: 'Tekken 8', description: 'Jeu de combat en 3D de Bandai Namco, centré sur la famille Mishima : chaque bouton contrôle un bras ou une jambe.' },
  'Clash Royale': { wiki: 'Clash Royale', description: 'Jeu mobile de Supercell : on pose des cartes de troupes en temps réel pour détruire les tours du rival en 3 minutes.' },
  'Brawl Stars': { wiki: 'Brawl Stars', description: 'Jeu mobile de Supercell : des combats rapides en équipe de trois, vus de dessus, avec des personnages appelés Brawlers.' },
  Hearthstone: { wiki: 'Hearthstone', description: 'Jeu de cartes en ligne de Blizzard dans l’univers de Warcraft : on pose des serviteurs et des sorts pour vaincre le héros adverse.' },
  'Marvel Snap': { wiki: 'Marvel Snap', description: 'Jeu de cartes rapide avec les héros Marvel : on gagne deux lieux sur trois en six tours, et on peut « snapper » pour doubler la mise.' },
  'Zelda : Breath of the Wild': { wiki: 'The Legend of Zelda: Breath of the Wild', description: 'Aventure en monde ouvert de Nintendo : Link se réveille et explore librement Hyrule pour vaincre Ganon, en grimpant et planant partout.' },
  'Genshin Impact': { wiki: 'Genshin Impact', description: 'Action-RPG gratuit en monde ouvert au style manga : on explore Teyvat avec une équipe de personnages élémentaires obtenus au tirage.' },
  Halo: { wiki: 'Halo: Combat Evolved', description: 'FPS de science-fiction sur Xbox : le Master Chief, super-soldat en armure verte, combat l’alliance extraterrestre Covenant.' },
  Destiny: { wiki: 'Destiny 2', description: 'FPS de science-fiction en ligne de Bungie : des Gardiens protègent la dernière ville humaine, en raids et en coop.' },
  'Resident Evil': { wiki: 'Resident Evil 2 (2019 video game)', description: 'Série de survival horror de Capcom : zombies, munitions comptées et l’entreprise maléfique Umbrella.' },
  'Silent Hill': { wiki: 'Silent Hill 2', description: 'Survival horror psychologique de Konami : une ville noyée dans le brouillard, des monstres dérangeants et le terrible Pyramid Head.' },
  Uncharted: { wiki: "Uncharted 4: A Thief's End", description: 'Aventures façon Indiana Jones sur PlayStation : Nathan Drake, chasseur de trésors bavard, escalade et fusillades.' },
  'Tomb Raider': { wiki: 'Tomb Raider (2013 video game)', description: 'Aventures de Lara Croft, archéologue qui explore des tombeaux piégés, résout des énigmes et survit en milieu hostile.' },
  Roblox: { wiki: 'Roblox', description: 'Plateforme où les joueurs créent et jouent à des millions de mini-jeux faits par la communauté, avec des avatars en blocs.' },
  Minecraft: { wiki: 'Minecraft', description: 'Bac à sable en cubes : on mine, on récolte, on construit tout ce qu’on veut et on survit aux creepers la nuit.' },
  'Subway Surfers': { wiki: 'Subway Surfers', description: 'Runner mobile sans fin : un tagueur fuit l’inspecteur et son chien en sautant entre les trains sur les voies.' },
  'Temple Run': { wiki: 'Temple Run', description: 'Runner mobile sans fin : un explorateur s’enfuit d’un temple avec une idole volée, poursuivi par des singes démoniaques.' },
  Phasmophobia: { wiki: 'Phasmophobia (video game)', description: 'Horreur en coop jusqu’à quatre : on enquête dans des maisons hantées avec du matériel (EMF, caméras…) pour identifier le fantôme.' },
  'Lethal Company': { wiki: 'Lethal Company', description: 'Horreur comique en coop : des employés récupèrent de la ferraille sur des lunes abandonnées remplies de monstres pour atteindre un quota.' },
  "Baldur's Gate 3": { wiki: "Baldur's Gate 3", description: 'RPG au tour par tour de Larian dans l’univers de Donjons & Dragons : choix énormes, lancers de dés et compagnons à séduire.' },
  'Divinity : Original Sin 2': { wiki: 'Divinity: Original Sin II', description: 'RPG au tour par tour de Larian, très libre, où l’on combine les éléments (feu, poison, eau…) en combat.' },
  'Diablo IV': { wiki: 'Diablo IV', description: 'Hack’n’slash sombre de Blizzard vu de dessus : on massacre des hordes de démons pour obtenir du meilleur équipement.' },
  'Path of Exile': { wiki: 'Path of Exile', description: 'Hack’n’slash gratuit, réputé pour son arbre de compétences gigantesque et ses builds très poussés.' },
  'World of Warcraft': { wiki: 'World of Warcraft', description: 'MMORPG de Blizzard : des millions de joueurs de l’Alliance et de la Horde font des quêtes, des donjons et des raids en Azeroth.' },
  'Final Fantasy XIV': { wiki: 'Final Fantasy XIV', description: 'MMORPG de Square Enix dans l’univers Final Fantasy, salué pour son histoire et ses donjons en groupe.' },
  'Cities : Skylines': { wiki: 'Cities: Skylines', description: 'Jeu de gestion où l’on construit une ville entière : routes, quartiers, transports, et surtout gérer les bouchons.' },
  SimCity: { wiki: 'SimCity 4', description: 'Série culte de gestion de ville de Maxis : on est le maire, on trace les zones et on gère budget, pollution et catastrophes.' },
  'Gran Turismo': { wiki: 'Gran Turismo 7', description: 'Simulation automobile de PlayStation : des centaines de vraies voitures, des permis à passer et une conduite très réaliste.' },
  'Forza Motorsport': { wiki: 'Forza Motorsport 7', description: 'Simulation de course de Xbox sur de vrais circuits, avec des voitures réelles très détaillées.' },
  Overcooked: { wiki: 'Overcooked! 2', description: 'Jeu de cuisine en coop sur canapé : on coupe, cuit et sert les commandes à toute vitesse dans des cuisines qui bougent.' },
  'Moving Out': { wiki: 'Moving Out (video game)', description: 'Jeu de déménagement en coop : on balance meubles et cartons par les fenêtres pour remplir le camion avant la fin du chrono.' },
  Hades: { wiki: 'Hades (video game)', description: 'Rogue-lite d’action de Supergiant : Zagreus, fils d’Hadès, tente encore et encore de s’échapper des Enfers, aidé par les dieux de l’Olympe.' },
  'Dead Cells': { wiki: 'Dead Cells', description: 'Rogue-lite d’action en 2D : un amas de cellules prend possession d’un corps et explore un château qui change à chaque mort.' },
  Undertale: { wiki: 'Undertale', description: 'RPG indé de Toby Fox où l’on peut épargner tous les monstres au lieu de les combattre, avec des combats façon jeu de tir.' },
  Deltarune: { wiki: 'Deltarune', description: 'Le second RPG de Toby Fox (créateur d’Undertale) : Kris et ses amis plongent dans un « Monde des Ténèbres », chapitre par chapitre.' },
  'It Takes Two': { wiki: 'It Takes Two (video game)', description: 'Aventure en coop obligatoire à deux : un couple en instance de divorce, transformé en poupées, doit coopérer pour redevenir humain.' },
  'A Way Out': { wiki: 'A Way Out (video game)', description: 'Aventure en coop obligatoire à deux en écran partagé : deux prisonniers s’évadent de prison et fuient ensemble.' },
  Terraria: { wiki: 'Terraria', description: 'Bac à sable en 2D : on creuse, on construit, et on affronte des boss de plus en plus puissants.' },
  'Overwatch 2': { wiki: 'Overwatch 2', description: 'Shooter à héros de Blizzard en équipes de cinq : tanks, dégâts et soigneurs aux pouvoirs très différents pour capturer des objectifs.' },
  'Rainbow Six Siege': { wiki: "Tom Clancy's Rainbow Six Siege", description: 'FPS tactique d’Ubisoft : attaquants et défenseurs s’affrontent dans des bâtiments où l’on peut détruire murs et plafonds.' },
  'Super Smash Bros.': { wiki: 'Super Smash Bros. Ultimate', description: 'Jeu de combat de plateforme de Nintendo qui réunit Mario, Link, Pikachu et bien d’autres : on éjecte ses adversaires hors de l’arène.' },
  Brawlhalla: { wiki: 'Brawlhalla', description: 'Jeu de combat de plateforme gratuit : comme Smash, on éjecte les autres hors de l’arène, avec des armes à ramasser.' },
  'Among Us': { wiki: 'Among Us', description: 'Jeu de soirée en ligne dans un vaisseau : l’équipage fait des tâches pendant que des imposteurs sabotent et éliminent en cachette.' },
  'Fall Guys': { wiki: 'Fall Guys', description: 'Battle royale de mini-jeux : des petits personnages en forme de haricot traversent des parcours d’obstacles façon jeu télé.' },
  'Hollow Knight': { wiki: 'Hollow Knight', description: 'Metroidvania indé dessiné à la main : un petit chevalier insecte explore un royaume souterrain en ruines, aux boss coriaces.' },
  Celeste: { wiki: 'Celeste (video game)', description: 'Plateformes indé très exigeant : Madeline gravit la montagne Celeste, une ascension qui parle aussi d’anxiété.' },
  'Les Sims': { wiki: 'The Sims 4', description: 'Simulation de vie : on crée des personnages, on construit leur maison et on contrôle leur quotidien (travail, amour, besoins…).' },
  Doom: { wiki: 'Doom (2016 video game)', description: 'FPS ultra-nerveux : le Doom Slayer massacre des démons venus de l’Enfer sur fond de metal.' },
  Wolfenstein: { wiki: 'Wolfenstein: The New Order', description: 'FPS où B.J. Blazkowicz combat les nazis dans une uchronie où ils ont gagné la Seconde Guerre mondiale.' },
  'Pac-Man': { wiki: 'Pac-Man', description: 'Classique de l’arcade (1980) : une boule jaune mange des pac-gommes dans un labyrinthe en fuyant quatre fantômes.' },
  'Space Invaders': { wiki: 'Space Invaders', description: 'Classique de l’arcade (1978) : on tire depuis le bas de l’écran sur des rangées d’extraterrestres qui descendent.' },
  'Assassin’s Creed': { wiki: "Assassin's Creed (video game)", description: 'Série d’Ubisoft : des assassins encapuchonnés s’infiltrent dans des villes historiques, grimpent partout et sautent dans des bottes de foin.' },
  'Ghost of Tsushima': { wiki: 'Ghost of Tsushima', description: 'Monde ouvert dans le Japon féodal : le samouraï Jin Sakai défend l’île de Tsushima contre l’invasion mongole.' },
  'Far Cry': { wiki: 'Far Cry 3', description: 'Série de FPS en monde ouvert d’Ubisoft : un héros perdu dans une région exotique affronte un méchant charismatique et dérangé.' },
  'Just Cause': { wiki: 'Just Cause 3', description: 'Monde ouvert explosif : Rico Rodriguez renverse des dictateurs avec un grappin, un parachute et beaucoup d’explosions.' },
  'Crash Bandicoot': { wiki: 'Crash Bandicoot N. Sane Trilogy', description: 'Plateformes de la PlayStation : un bandicoot orange casse des caisses et ramasse des fruits Wumpa pour arrêter le docteur Cortex.' },
  Spyro: { wiki: 'Spyro Reignited Trilogy', description: 'Plateformes de la PlayStation : un petit dragon violet crache du feu, plane et libère ses amis dragons.' },
  'Super Mario Odyssey': { wiki: 'Super Mario Odyssey', description: 'Plateformes en 3D de Nintendo : Mario voyage de royaume en royaume avec Cappy, une casquette qui lui permet de posséder les ennemis.' },
  'Sonic Frontiers': { wiki: 'Sonic Frontiers', description: 'Sonic, le hérisson bleu ultra-rapide, explore pour la première fois un monde ouvert sur les mystérieuses îles Starfall.' },
  'Angry Birds': { wiki: 'Angry Birds (video game)', description: 'Jeu mobile de physique : on lance des oiseaux avec un lance-pierre pour faire s’écrouler les constructions des cochons verts.' },
  'Cut the Rope': { wiki: 'Cut the Rope', description: 'Puzzle mobile : on coupe des cordes au bon moment pour faire tomber un bonbon dans la bouche du petit monstre Om Nom.' },
  'Dead by Daylight': { wiki: 'Dead by Daylight', description: 'Jeu asymétrique : un tueur traque quatre survivants qui doivent réparer des générateurs pour s’échapper.' },
  'Friday the 13th': { wiki: 'Friday the 13th: The Game', description: 'Jeu asymétrique inspiré des films d’horreur : un joueur incarne Jason Voorhees et chasse les moniteurs d’un camp de vacances.' },
  'Age of Empires': { wiki: 'Age of Empires II', description: 'Stratégie en temps réel historique : on récolte des ressources, on fait évoluer sa civilisation d’âge en âge et on lève des armées.' },
  Civilization: { wiki: 'Civilization VI', description: 'Stratégie au tour par tour : on guide une civilisation de la préhistoire à l’ère spatiale, par la guerre, la science ou la culture.' },
  StarCraft: { wiki: 'StarCraft (video game)', description: 'Stratégie en temps réel de Blizzard dans l’espace : trois races (Terrans, Zergs, Protoss) s’affrontent. Monument de l’e-sport coréen.' },
  'Warcraft III': { wiki: 'Warcraft III: Reign of Chaos', description: 'Stratégie en temps réel de Blizzard avec humains, orcs, morts-vivants et elfes ; berceau du mode qui a donné naissance aux MOBA.' },
  'Euro Truck Simulator': { wiki: 'Euro Truck Simulator 2', description: 'Simulation de routier : on livre des marchandises en camion à travers les routes d’Europe, tranquillement.' },
  'Farming Simulator': { wiki: 'Farming Simulator 22', description: 'Simulation agricole : on conduit de vrais tracteurs et moissonneuses, on cultive ses champs et on élève des animaux.' },
  'Just Dance': { wiki: 'Just Dance 2024 Edition', description: 'Jeu de danse d’Ubisoft : on imite les chorégraphies d’un danseur à l’écran sur des tubes, en tenant manette ou téléphone.' },
  'Guitar Hero': { wiki: 'Guitar Hero III: Legends of Rock', description: 'Jeu musical avec une manette en forme de guitare : on appuie sur les bonnes touches de couleur en rythme sur des morceaux rock.' },
  'Wii Sports': { wiki: 'Wii Sports', description: 'Le jeu fourni avec la Wii : tennis, bowling, boxe… on mime les gestes avec la Wiimote, avec son Mii.' },
  'Mario Party': { wiki: 'Super Mario Party', description: 'Jeu de plateau de Nintendo entre amis : on lance un dé, on joue des mini-jeux et on collectionne des étoiles (et on se trahit).' },
  'God of War': { wiki: 'God of War (2018 video game)', description: 'Action épique : Kratos, ancien dieu de la guerre grec, voyage avec son fils Atreus dans la mythologie nordique.' },
  'Devil May Cry': { wiki: 'Devil May Cry 5', description: 'Beat’em all stylé de Capcom : Dante, chasseur de démons à manteau rouge, enchaîne combos à l’épée et au pistolet.' },
  Metroid: { wiki: 'Metroid Dread', description: 'Série de Nintendo : la chasseuse de primes Samus Aran, en armure, explore des planètes hostiles et y gagne de nouveaux pouvoirs.' },
  Castlevania: { wiki: 'Castlevania: Symphony of the Night', description: 'Série de Konami : on explore le château de Dracula pour le vaincre, souvent avec un fouet de la famille Belmont.' },
  'Slay the Spire': { wiki: 'Slay the Spire', description: 'Rogue-like de cartes : on gravit une tour en combattant avec un deck qu’on améliore à chaque étage.' },
  Balatro: { wiki: 'Balatro (video game)', description: 'Rogue-like inspiré du poker : on fait des mains (paire, couleur, full…) et des cartes jokers multiplient les scores de façon délirante.' },
  'Mortal Kombat': { wiki: 'Mortal Kombat 11', description: 'Jeu de combat ultra-violent avec Scorpion et Sub-Zero, célèbre pour ses « Fatalities » sanglantes.' },
  'Pokémon Écarlate': { wiki: 'Pokémon Scarlet and Violet', description: 'Le premier Pokémon en monde ouvert, dans la région de Paldea (inspirée de l’Espagne) : capture, combats et académie de dresseurs.' },
  Palworld: { wiki: 'Palworld', description: 'Jeu de survie où l’on capture des créatures (les « Pals ») pour qu’elles combattent, travaillent à la base… ou portent des armes.' },
  Tetris: { wiki: 'Tetris', description: 'Puzzle culte venu d’URSS : on empile des pièces qui tombent pour compléter des lignes avant que l’écran se remplisse.' },
  'Candy Crush': { wiki: 'Candy Crush Saga', description: 'Puzzle mobile : on aligne au moins trois bonbons de la même couleur pour les faire exploser, niveau après niveau.' },
  'Rocket League': { wiki: 'Rocket League', description: 'Du foot avec des voitures à turbo : on saute, on vole et on pousse un ballon géant dans le but adverse.' },
  'The Last of Us': { wiki: 'The Last of Us', description: 'Aventure post-apocalyptique : Joel escorte la jeune Ellie à travers des États-Unis ravagés par un champignon qui transforme les gens.' },
  Portal: { wiki: 'Portal (video game)', description: 'Jeu de réflexion de Valve : avec un pistolet à portails, on résout des salles de test sous l’œil d’une IA sarcastique, GLaDOS.' },
  'Half-Life': { wiki: 'Half-Life (video game)', description: 'FPS culte de Valve : le scientifique Gordon Freeman, pied-de-biche en main, survit à l’invasion extraterrestre de Black Mesa.' },
  'Geometry Dash': { wiki: 'Geometry Dash', description: 'Jeu de rythme rageant : un petit cube saute en musique au-dessus de pics, et la moindre erreur renvoie au début.' },
  'Flappy Bird': { wiki: 'Flappy Bird', description: 'Jeu mobile à un bouton : on tape pour faire voleter un oiseau entre des tuyaux verts, presque impossible à maîtriser.' },
  'Zelda : Tears of the Kingdom': { wiki: 'The Legend of Zelda: Tears of the Kingdom', description: 'Suite de Breath of the Wild : Link explore Hyrule, ses îles célestes et ses profondeurs, et construit des véhicules avec la capacité Emprise.' },
  'Super Mario Galaxy': { wiki: 'Super Mario Galaxy', description: 'Plateformes 3D de Nintendo sur Wii : Mario saute de planète en planète en jouant avec la gravité pour sauver Peach et Harmonie.' },
  'GTA San Andreas': { wiki: 'Grand Theft Auto: San Andreas', description: 'Monde ouvert culte de Rockstar (2004) : CJ revient dans son quartier de Los Santos et reprend en main son gang, les Grove Street Families.' },
  'American Truck Simulator': { wiki: 'American Truck Simulator', description: 'Simulation de routier aux États-Unis : on livre des marchandises en camion américain à travers les États de l’Ouest.' },
  'Stumble Guys': { wiki: 'Stumble Guys', description: 'Battle royale mobile de courses d’obstacles : des petits personnages trébuchent sur des parcours délirants, le dernier qualifié gagne.' },
  'Split Fiction': { wiki: 'Split Fiction', description: 'Aventure en coop obligatoire à deux : deux écrivaines coincées dans leurs propres histoires, l’une de science-fiction, l’autre de fantasy.' },
  Silksong: { wiki: 'Hollow Knight: Silksong', description: 'Suite de Hollow Knight : on joue Hornet, princesse guerrière à l’aiguille, dans un nouveau royaume d’insectes.' },
  Bloodborne: { wiki: 'Bloodborne', description: 'Action-RPG de FromSoftware dans une ville gothique victorienne : un chasseur affronte des bêtes avec une arme à transformation et un pistolet.' },
  Sekiro: { wiki: 'Sekiro: Shadows Die Twice', description: 'Action de FromSoftware dans le Japon féodal : un shinobi au bras prothétique duel au sabre, basé sur les parades parfaites.' },
  'Honkai : Star Rail': { wiki: 'Honkai: Star Rail', description: 'RPG au tour par tour de HoYoverse (créateurs de Genshin) : on voyage de planète en planète à bord d’un train spatial.' },
  'Wuthering Waves': { wiki: 'Wuthering Waves', description: 'Action-RPG gratuit en monde ouvert au style manga, avec des personnages à collectionner et des combats rapides.' },
  'Clash of Clans': { wiki: 'Clash of Clans', description: 'Jeu mobile de Supercell : on construit son village, on forme des troupes et on attaque les villages des autres joueurs.' },
  'Titanfall 2': { wiki: 'Titanfall 2', description: 'FPS de science-fiction : un pilote court sur les murs et fait équipe avec un robot géant, un Titan.' },
  Paladins: { wiki: 'Paladins (video game)', description: 'Shooter à héros gratuit en équipes de cinq, de style fantasy, où l’on personnalise son champion avec des cartes.' },
  Quake: { wiki: 'Quake (video game)', description: 'FPS culte d’id Software (1996) en 3D : action ultra-rapide, sauts à la roquette et ambiance gothique.' },
  Starbound: { wiki: 'Starbound', description: 'Bac à sable en 2D pixel art dans l’espace : on explore des planètes générées, on construit et on mine.' },
  'Content Warning': { wiki: 'Content Warning', description: 'Horreur comique en coop : on filme des monstres dans un monde étrange pour devenir viral sur « SpookTube ».' },
  'Super Meat Boy': { wiki: 'Super Meat Boy', description: 'Plateformes indé très dur : un cube de viande sauve sa copine des scies circulaires, et meurt beaucoup.' },
  Inscryption: { wiki: 'Inscryption', description: 'Jeu de cartes rogue-like horrifique : un mystérieux personnage nous fait jouer dans une cabane sombre… et rien n’est ce qu’il paraît.' },
  Injustice: { wiki: 'Injustice 2', description: 'Jeu de combat de NetherRealm avec les super-héros DC : Batman, Superman, Wonder Woman…' },
  MultiVersus: { wiki: 'MultiVersus', description: 'Jeu de combat de plateforme gratuit avec les stars Warner : Bugs Bunny, Batman, Shaggy, Arya Stark…' },
  'Legends of Runeterra': { wiki: 'Legends of Runeterra', description: 'Jeu de cartes en ligne de Riot dans l’univers de League of Legends, avec les champions de Runeterra.' },
  'Guild Wars 2': { wiki: 'Guild Wars 2', description: 'MMORPG de fantasy sans abonnement, connu pour ses événements dynamiques et ses grandes batailles monde contre monde.' },
  'Lost Ark': { wiki: 'Lost Ark', description: 'MMO hack’n’slash coréen vu de dessus : combats très spectaculaires, raids et grosses sessions de farm.' },
  Humankind: { wiki: 'Humankind (video game)', description: 'Stratégie au tour par tour : on traverse l’Histoire en changeant de culture à chaque ère (Égyptiens, Romains, etc.).' },
  'Age of Mythology': { wiki: 'Age of Mythology', description: 'Stratégie en temps réel avec les mythologies grecque, égyptienne et nordique : héros, dieux et monstres légendaires.' },
  Bejeweled: { wiki: 'Bejeweled', description: 'Puzzle culte : on échange deux pierres précieuses pour en aligner trois de la même couleur.' },
  'Puyo Puyo': { wiki: 'Puyo Puyo', description: 'Puzzle de Sega : on empile des blobs colorés qui éclatent par quatre et envoient des déchets chez l’adversaire.' },
  'Fallout 4': { wiki: 'Fallout 4', description: 'RPG post-apocalyptique de Bethesda : on sort d’un abri antiatomique dans un Boston ravagé par la guerre nucléaire.' },
  Starfield: { wiki: 'Starfield', description: 'RPG spatial de Bethesda : on explore des centaines de planètes, on construit son vaisseau et on rejoint des factions.' },
  'Mass Effect': { wiki: 'Mass Effect 2', description: 'RPG de science-fiction de BioWare : le commandant Shepard réunit un équipage pour sauver la galaxie, avec des choix lourds de conséquences.' },
  'Dragon Age': { wiki: 'Dragon Age: Inquisition', description: 'RPG de fantasy de BioWare : on mène une Inquisition pour refermer une brèche dans le ciel, avec des compagnons à recruter.' },
  'Cyberpunk 2077': { wiki: 'Cyberpunk 2077', description: 'RPG en monde ouvert à Night City : V, mercenaire bourré d’implants, partage sa tête avec Johnny Silverhand (Keanu Reeves).' },
  'Deus Ex': { wiki: 'Deus Ex: Human Revolution', description: 'RPG cyberpunk : Adam Jensen, agent de sécurité augmenté, enquête dans un monde où l’on modifie son corps avec des implants.' },
  'Persona 5': { wiki: 'Persona 5', description: 'JRPG d’Atlus : des lycéens de Tokyo deviennent les « Voleurs fantômes » et volent les cœurs des adultes corrompus.' },
  'Metaphor : ReFantazio': { wiki: 'Metaphor: ReFantazio', description: 'JRPG d’Atlus (créateurs de Persona) dans un royaume de fantasy : on concourt pour devenir roi et sauver le prince maudit.' },
  'Final Fantasy VII Remake': { wiki: 'Final Fantasy VII Remake', description: 'Remake du FF VII culte : Cloud, ex-soldat à l’épée géante, rejoint des rebelles contre la corporation Shinra à Midgar.' },
  'Monster Hunter : World': { wiki: 'Monster Hunter: World', description: 'Action en coop de Capcom : on traque et chasse des monstres géants pour fabriquer armes et armures avec leurs morceaux.' },
  'Wild Hearts': { wiki: 'Wild Hearts', description: 'Chasse aux monstres géants dans un Japon féodal fantastique, avec des constructions mécaniques à poser en plein combat.' },
  Warframe: { wiki: 'Warframe', description: 'Shooter gratuit en ligne : on incarne des ninjas spatiaux en armure biomécanique, très mobiles, en coop.' },
  'Days Gone': { wiki: 'Days Gone', description: 'Monde ouvert post-apocalyptique : un motard survit dans l’Oregon envahi par des hordes d’infectés, les « Freakers ».' },
  'Dead Space': { wiki: 'Dead Space (2023 video game)', description: 'Survival horror dans l’espace : l’ingénieur Isaac Clarke découpe des monstres (Nécromorphes) membre par membre dans un vaisseau.' },
  'Texas Chain Saw Massacre': { wiki: 'The Texas Chain Saw Massacre (video game)', description: 'Jeu asymétrique tiré du film d’horreur : une famille de tueurs traque des victimes qui tentent de s’échapper.' },
  'PlateUp!': { wiki: 'PlateUp!', description: 'Gestion de restaurant en coop : on cuisine, sert et améliore son restaurant journée après journée, de plus en plus vite.' },
  'Légendes Pokémon : Arceus': { wiki: 'Pokémon Legends: Arceus', description: 'Pokémon dans la région de Hisui (ancienne Sinnoh) : on capture des Pokémon en pleine nature pour créer le premier Pokédex.' },
  'Story of Seasons': { wiki: 'Story of Seasons: Pioneers of Olive Town', description: 'Jeu de ferme japonais (ex-Harvest Moon) : cultures, animaux, et mariage avec un villageois.' },
  'The Talos Principle': { wiki: 'The Talos Principle', description: 'Jeu de réflexion philosophique : un robot résout des énigmes de lasers et de blocs dans des ruines antiques.' },
  BioShock: { wiki: 'BioShock', description: 'FPS narratif dans Rapture, une ville sous-marine en ruine : on y combat avec des armes et des pouvoirs génétiques (plasmides).' },
};

export function gameDescription(name: string | null | undefined): string | null {
  if (!name) return null;
  return GAME_INFO[name]?.description ?? null;
}

const covers = new Map<string, string>();

export function gameCover(name: string | null | undefined): string | null {
  if (!name) return null;
  return covers.get(name) ?? null;
}

const WIKI_SUMMARY = 'https://en.wikipedia.org/api/rest_v1/page/summary';
// Wikimedia demande un User-Agent identifiable pour les appels automatisés.
const USER_AGENT = 'UndercoverGame/1.0 (https://github.com/Ssnakyx/Undercover)';
const FETCH_CONCURRENCY = 4;

interface WikiSummary {
  thumbnail?: { source: string; width: number };
  originalimage?: { source: string; width: number };
}

async function fetchCover(wikiTitle: string): Promise<string | null> {
  const res = await fetch(`${WIKI_SUMMARY}/${encodeURIComponent(wikiTitle.replace(/ /g, '_'))}`, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as WikiSummary;
  // Les jaquettes (images non libres) sont petites : l'originale suffit et reste nette.
  const original = data.originalimage;
  if (original && original.width <= 800) return original.source;
  return data.thumbnail?.source ?? original?.source ?? null;
}

/**
 * Récupère les jaquettes de tous les jeux au démarrage (en tâche de fond : le serveur répond
 * déjà pendant ce temps, et un jeu sans jaquette garde le rendu typographique côté client).
 */
export async function prefetchGameCovers(): Promise<void> {
  const queue = Object.entries(GAME_INFO).filter(([name]) => !covers.has(name));
  let missing = 0;
  async function worker(): Promise<void> {
    for (let next = queue.shift(); next; next = queue.shift()) {
      const [name, info] = next;
      try {
        const cover = await fetchCover(info.wiki);
        if (cover) covers.set(name, cover);
        else missing++;
      } catch {
        missing++;
      }
    }
  }
  await Promise.all(Array.from({ length: FETCH_CONCURRENCY }, worker));
  // eslint-disable-next-line no-console
  console.log(`[games] ${covers.size} jaquettes chargées${missing ? `, ${missing} introuvables` : ''}`);
}

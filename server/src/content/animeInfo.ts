// Univers 'anime' : série d'origine de chaque personnage (affichée sur SA carte pour qui ne le
// connaît pas, comme la description des jeux de l'univers 'games') et autres orthographes
// acceptées pour la devinette de Mr White (nom complet, nom japonais, nom anglais...).
// Pas d'image : le client affiche une carte typographique.

export interface AnimeCharacter {
  series: string;
  aliases?: string[];
}

const DB = 'Dragon Ball';
const NARUTO = 'Naruto';
const OP = 'One Piece';
const SNK = 'L’Attaque des Titans';
const KNY = 'Demon Slayer';
const JJK = 'Jujutsu Kaisen';
const MHA = 'My Hero Academia';
const DN = 'Death Note';
const HXH = 'Hunter x Hunter';
const FMA = 'Fullmetal Alchemist';
const EVA = 'Neon Genesis Evangelion';
const BLEACH = 'Bleach';
const CDZ = 'Les Chevaliers du Zodiaque';
const SAILOR = 'Sailor Moon';
const JOJO = 'JoJo’s Bizarre Adventure';
const TPN = 'The Promised Neverland';

export const ANIME_INFO: Record<string, AnimeCharacter> = {
  // Dragon Ball
  Goku: { series: DB, aliases: ['Sangoku', 'Son Goku', 'Kakarot'] },
  Végéta: { series: DB, aliases: ['Vegeta'] },
  Gohan: { series: DB, aliases: ['Son Gohan', 'Sangohan'] },
  Goten: { series: DB, aliases: ['Son Goten', 'Sangoten'] },
  Trunks: { series: DB },
  'C-17': { series: DB, aliases: ['C17', 'Android 17', 'Cyborg 17', 'Numéro 17'] },
  'C-18': { series: DB, aliases: ['C18', 'Android 18', 'Cyborg 18', 'Numéro 18'] },
  Krilin: { series: DB, aliases: ['Krillin', 'Kuririn'] },
  Yamcha: { series: DB },
  Piccolo: { series: DB },
  Dendé: { series: DB, aliases: ['Dende'] },
  Freezer: { series: DB, aliases: ['Frieza', 'Freeza'] },
  Cell: { series: DB },
  Bulma: { series: DB },
  'Tortue Géniale': { series: DB, aliases: ['Muten Roshi', 'Kame Sennin', 'Maître Roshi'] },

  // Naruto
  Naruto: { series: NARUTO, aliases: ['Naruto Uzumaki', 'Uzumaki Naruto'] },
  Sasuke: { series: NARUTO, aliases: ['Sasuke Uchiha', 'Uchiha Sasuke'] },
  Itachi: { series: NARUTO, aliases: ['Itachi Uchiha', 'Uchiha Itachi'] },
  Kakashi: { series: NARUTO, aliases: ['Kakashi Hatake', 'Hatake Kakashi'] },
  'Sakura Haruno': { series: NARUTO, aliases: ['Sakura', 'Haruno Sakura'] },
  Hinata: { series: NARUTO, aliases: ['Hinata Hyuga', 'Hinata Hyûga'] },
  Gaara: { series: NARUTO },
  Minato: { series: NARUTO, aliases: ['Minato Namikaze', 'Namikaze Minato'] },
  Hashirama: { series: NARUTO, aliases: ['Hashirama Senju', 'Senju Hashirama'] },
  Tobirama: { series: NARUTO, aliases: ['Tobirama Senju', 'Senju Tobirama'] },
  Madara: { series: NARUTO, aliases: ['Madara Uchiha', 'Uchiha Madara'] },
  Obito: { series: NARUTO, aliases: ['Obito Uchiha', 'Uchiha Obito', 'Tobi'] },
  Jiraiya: { series: NARUTO, aliases: ['Jiraya'] },
  Orochimaru: { series: NARUTO },
  Shikamaru: { series: NARUTO, aliases: ['Shikamaru Nara', 'Nara Shikamaru'] },
  Neji: { series: NARUTO, aliases: ['Neji Hyuga', 'Neji Hyûga'] },
  Kisame: { series: NARUTO, aliases: ['Kisame Hoshigaki'] },
  Kurama: { series: NARUTO, aliases: ['Kyubi', 'Kyûbi', 'Démon renard à neuf queues'] },

  // One Piece
  Luffy: { series: OP, aliases: ['Monkey D. Luffy'] },
  Zoro: { series: OP, aliases: ['Roronoa Zoro'] },
  Sanji: { series: OP },
  Nami: { series: OP },
  Robin: { series: OP, aliases: ['Nico Robin'] },
  Usopp: { series: OP, aliases: ['Ussop'] },
  Chopper: { series: OP, aliases: ['Tony Tony Chopper'] },
  Franky: { series: OP },
  Brook: { series: OP },
  Ace: { series: OP, aliases: ['Portgas D. Ace'] },
  Sabo: { series: OP },
  Shanks: { series: OP, aliases: ['Le Roux'] },
  Baggy: { series: OP, aliases: ['Buggy'] },
  Mihawk: { series: OP, aliases: ['Dracule Mihawk', 'Œil de faucon'] },
  Kaido: { series: OP, aliases: ['Kaidou'] },
  'Big Mom': { series: OP, aliases: ['Charlotte Linlin'] },
  Akainu: { series: OP, aliases: ['Sakazuki'] },
  Kizaru: { series: OP, aliases: ['Borsalino'] },
  Aokiji: { series: OP, aliases: ['Kuzan'] },
  'Barbe Blanche': { series: OP, aliases: ['Whitebeard', 'Edward Newgate'] },
  'Barbe Noire': { series: OP, aliases: ['Blackbeard', 'Marshall D. Teach'] },
  Law: { series: OP, aliases: ['Trafalgar Law', 'Trafalgar D. Water Law'] },
  Kid: { series: OP, aliases: ['Eustass Kid', 'Eustass Kidd', 'Kidd'] },
  Garp: { series: OP, aliases: ['Monkey D. Garp'] },
  Sengoku: { series: OP },
  Doflamingo: { series: OP, aliases: ['Donquixote Doflamingo'] },
  Crocodile: { series: OP, aliases: ['Sir Crocodile'] },

  // L'Attaque des Titans
  Eren: { series: SNK, aliases: ['Eren Jäger', 'Eren Jaeger', 'Eren Yeager'] },
  Zeke: { series: SNK, aliases: ['Zeke Jäger', 'Sieg', 'Titan Bestial'] },
  Mikasa: { series: SNK, aliases: ['Mikasa Ackerman'] },
  Livaï: { series: SNK, aliases: ['Levi', 'Livai Ackerman', 'Levi Ackerman'] },
  Erwin: { series: SNK, aliases: ['Erwin Smith'] },
  Reiner: { series: SNK, aliases: ['Reiner Braun'] },
  Bertholdt: { series: SNK, aliases: ['Bertolt', 'Berthold'] },

  // Demon Slayer
  Tanjiro: { series: KNY, aliases: ['Tanjiro Kamado', 'Tanjirō'] },
  Nezuko: { series: KNY, aliases: ['Nezuko Kamado'] },
  Zenitsu: { series: KNY, aliases: ['Zenitsu Agatsuma'] },
  Inosuke: { series: KNY, aliases: ['Inosuke Hashibira'] },
  Rengoku: { series: KNY, aliases: ['Kyojuro Rengoku'] },
  Tengen: { series: KNY, aliases: ['Tengen Uzui', 'Uzui'] },
  Shinobu: { series: KNY, aliases: ['Shinobu Kocho'] },
  Mitsuri: { series: KNY, aliases: ['Mitsuri Kanroji'] },
  Muzan: { series: KNY, aliases: ['Muzan Kibutsuji'] },
  Akaza: { series: KNY },
  Doma: { series: KNY, aliases: ['Douma'] },
  Kokushibo: { series: KNY, aliases: ['Kokushibō'] },

  // Jujutsu Kaisen
  Gojo: { series: JJK, aliases: ['Satoru Gojo', 'Gojo Satoru'] },
  Geto: { series: JJK, aliases: ['Suguru Geto', 'Getō'] },
  'Yuji Itadori': { series: JJK, aliases: ['Itadori', 'Yuji'] },
  Megumi: { series: JJK, aliases: ['Megumi Fushiguro', 'Fushiguro'] },
  Nobara: { series: JJK, aliases: ['Nobara Kugisaki'] },
  Maki: { series: JJK, aliases: ['Maki Zenin'] },
  Sukuna: { series: JJK, aliases: ['Ryomen Sukuna'] },

  // My Hero Academia
  Deku: { series: MHA, aliases: ['Izuku Midoriya', 'Midoriya', 'Izuku'] },
  Bakugo: { series: MHA, aliases: ['Bakugou', 'Katsuki Bakugo', 'Kacchan'] },
  'All Might': { series: MHA, aliases: ['Toshinori Yagi'] },
  Endeavor: { series: MHA, aliases: ['Enji Todoroki'] },
  Shoto: { series: MHA, aliases: ['Shoto Todoroki', 'Todoroki'] },
  Dabi: { series: MHA, aliases: ['Toya Todoroki'] },
  Shigaraki: { series: MHA, aliases: ['Tomura Shigaraki'] },

  // Death Note
  'Light Yagami': { series: DN, aliases: ['Light', 'Kira'] },
  L: { series: DN, aliases: ['Lawliet', 'L Lawliet', 'Ryuzaki'] },
  Near: { series: DN },
  Misa: { series: DN, aliases: ['Misa Amane'] },

  // Hunter x Hunter
  Gon: { series: HXH, aliases: ['Gon Freecss'] },
  Killua: { series: HXH, aliases: ['Killua Zoldyck'] },
  Kurapika: { series: HXH },
  Hisoka: { series: HXH },
  Illumi: { series: HXH, aliases: ['Illumi Zoldyck'] },

  // Fullmetal Alchemist
  Edward: { series: FMA, aliases: ['Edward Elric', 'Ed'] },
  Alphonse: { series: FMA, aliases: ['Alphonse Elric', 'Al'] },
  'Roy Mustang': { series: FMA, aliases: ['Mustang'] },

  // Bleach
  Ichigo: { series: BLEACH, aliases: ['Ichigo Kurosaki'] },
  Rukia: { series: BLEACH, aliases: ['Rukia Kuchiki'] },
  Renji: { series: BLEACH, aliases: ['Renji Abarai'] },
  Byakuya: { series: BLEACH, aliases: ['Byakuya Kuchiki'] },
  Kenpachi: { series: BLEACH, aliases: ['Kenpachi Zaraki'] },

  // Evangelion
  Shinji: { series: EVA, aliases: ['Shinji Ikari'] },
  Rei: { series: EVA, aliases: ['Rei Ayanami'] },
  Asuka: { series: EVA, aliases: ['Asuka Langley'] },

  // Chevaliers du Zodiaque
  Seiya: { series: CDZ, aliases: ['Pégase'] },
  Shiryu: { series: CDZ, aliases: ['Dragon'] },
  Hyoga: { series: CDZ, aliases: ['Cygne'] },
  Ikki: { series: CDZ, aliases: ['Phénix'] },

  // Sailor Moon
  'Sailor Moon': { series: SAILOR, aliases: ['Bunny', 'Usagi'] },
  'Sailor Mars': { series: SAILOR, aliases: ['Raya', 'Rei Hino'] },
  'Sailor Mercure': { series: SAILOR, aliases: ['Sailor Mercury', 'Molly', 'Ami Mizuno'] },
  Luna: { series: SAILOR },

  // JoJo
  Jotaro: { series: JOJO, aliases: ['Jotaro Kujo'] },
  Dio: { series: JOJO, aliases: ['Dio Brando'] },
  'Jonathan Joestar': { series: JOJO, aliases: ['Jonathan'] },
  'Joseph Joestar': { series: JOJO, aliases: ['Joseph'] },

  // The Promised Neverland
  Emma: { series: TPN },
  Norman: { series: TPN },
  Ray: { series: TPN },

  // Ghibli
  Chihiro: { series: 'Le Voyage de Chihiro', aliases: ['Sen'] },
  Kiki: { series: 'Kiki la petite sorcière' },
  Jiji: { series: 'Kiki la petite sorcière' },
  'Princesse Mononoké': { series: 'Princesse Mononoké', aliases: ['San', 'Mononoke'] },
  Nausicaä: { series: 'Nausicaä de la vallée du vent', aliases: ['Nausicaa'] },
  Totoro: { series: 'Mon voisin Totoro' },
  Ponyo: { series: 'Ponyo sur la falaise' },
  Howl: { series: 'Le Château ambulant', aliases: ['Hauru'] },
  'Porco Rosso': { series: 'Porco Rosso', aliases: ['Marco'] },

  // Autres séries
  Asta: { series: 'Black Clover' },
  Yuno: { series: 'Black Clover' },
  Senku: { series: 'Dr. Stone', aliases: ['Senku Ishigami'] },
  Chrome: { series: 'Dr. Stone' },
  Kageyama: { series: 'Haikyu!!', aliases: ['Tobio Kageyama'] },
  Oikawa: { series: 'Haikyu!!', aliases: ['Toru Oikawa'] },
  Sakuragi: { series: 'Slam Dunk', aliases: ['Hanamichi Sakuragi'] },
  Rukawa: { series: 'Slam Dunk', aliases: ['Kaede Rukawa'] },
  Inuyasha: { series: 'Inuyasha' },
  Sesshomaru: { series: 'Inuyasha', aliases: ['Sesshōmaru'] },
  Rem: { series: 'Re:Zero' },
  Ram: { series: 'Re:Zero' },
  Subaru: { series: 'Re:Zero', aliases: ['Subaru Natsuki'] },
  Kazuma: { series: 'KonoSuba', aliases: ['Kazuma Sato'] },
  Rimuru: { series: 'Moi, quand je me réincarne en Slime', aliases: ['Rimuru Tempest'] },
  Ainz: { series: 'Overlord', aliases: ['Ainz Ooal Gown', 'Momonga'] },
  Kirito: { series: 'Sword Art Online', aliases: ['Kazuto Kirigaya'] },
  Asuna: { series: 'Sword Art Online', aliases: ['Asuna Yuuki'] },
  'Sung Jin-woo': { series: 'Solo Leveling', aliases: ['Jin-woo', 'Sung Jinwoo', 'Jinwoo'] },
  Frieren: { series: 'Frieren' },
  Fern: { series: 'Frieren' },
  Natsu: { series: 'Fairy Tail', aliases: ['Natsu Dragneel'] },
  Grey: { series: 'Fairy Tail', aliases: ['Gray', 'Grey Fullbuster'] },
  Erza: { series: 'Fairy Tail', aliases: ['Erza Scarlet'] },
  Saitama: { series: 'One Punch Man' },
  Genos: { series: 'One Punch Man' },
  Mob: { series: 'Mob Psycho 100', aliases: ['Shigeo Kageyama'] },
  Reigen: { series: 'Mob Psycho 100', aliases: ['Arataka Reigen'] },
  Denji: { series: 'Chainsaw Man' },
  Aki: { series: 'Chainsaw Man', aliases: ['Aki Hayakawa'] },
  Power: { series: 'Chainsaw Man' },
  Makima: { series: 'Chainsaw Man' },
  Kaneki: { series: 'Tokyo Ghoul', aliases: ['Ken Kaneki'] },
  Touka: { series: 'Tokyo Ghoul', aliases: ['Touka Kirishima'] },
  Lelouch: { series: 'Code Geass', aliases: ['Lelouch Lamperouge', 'Zero'] },
  Loid: { series: 'Spy x Family', aliases: ['Loid Forger', 'Twilight'] },
  Yor: { series: 'Spy x Family', aliases: ['Yor Forger'] },
  Yugi: { series: 'Yu-Gi-Oh!', aliases: ['Yugi Muto', 'Yugi Mouto'] },
  Kaiba: { series: 'Yu-Gi-Oh!', aliases: ['Seto Kaiba'] },
  Kenshin: { series: 'Kenshin le vagabond', aliases: ['Kenshin Himura', 'Battosai'] },
  Conan: { series: 'Détective Conan', aliases: ['Shinichi Kudo', 'Conan Edogawa'] },
  'Sakura Kinomoto': { series: 'Card Captor Sakura', aliases: ['Sakura chasseuse de cartes'] },
  Astro: { series: 'Astro Boy', aliases: ['Astro le petit robot', 'Astro Boy'] },
  Doraemon: { series: 'Doraemon' },
  Hamtaro: { series: 'Hamtaro' },
  Goldorak: { series: 'Goldorak', aliases: ['Grendizer', 'Actarus'] },
  'Mazinger Z': { series: 'Mazinger Z', aliases: ['Mazinger'] },
  Olive: { series: 'Olive et Tom', aliases: ['Olivier Atton', 'Tsubasa', 'Tsubasa Ozora'] },
  Tom: { series: 'Olive et Tom', aliases: ['Thomas Price', 'Misaki', 'Taro Misaki'] },
  'Ken le Survivant': { series: 'Ken le Survivant', aliases: ['Kenshiro'] },
  'Nicky Larson': { series: 'Nicky Larson', aliases: ['City Hunter', 'Ryo Saeba'] },
  'Lupin III': { series: 'Lupin III', aliases: ['Lupin', 'Edgar de la Cambriole'] },
  Albator: { series: 'Albator', aliases: ['Harlock', 'Capitaine Albator'] },
  Cobra: { series: 'Cobra', aliases: ['Space Adventure Cobra'] },
};

/** « Personnage de « One Piece » », pour qui ne connaît pas le personnage — null si inconnu. Montré uniquement sur SA carte. */
export function animeDescription(name: string | null | undefined): string | null {
  const series = name ? ANIME_INFO[name]?.series : undefined;
  if (!series) return null;
  return series === name ? 'Le héros qui donne son titre à l’œuvre' : `Personnage de « ${series} »`;
}

export function animeAliases(name: string): string[] {
  return ANIME_INFO[name]?.aliases ?? [];
}

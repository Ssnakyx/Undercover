// Couleurs d'avatar déterministes à partir de avatarSeed. Chaque joueur est un jeton de poker
// (voir .avatar dans styles/table.css) : c1 pour le centre, c2 pour le liseré et les rayures,
// text pour l'initiale.

const PALETTE: [string, string, string][] = [
  ['#d8392b', '#9e2117', '#fff6e8'], // rouge
  ['#2a5bd7', '#173a94', '#fff6e8'], // bleu
  ['#2f8f4e', '#1b5c30', '#fff6e8'], // vert
  ['#25221c', '#0f0d0a', '#e9b949'], // noir
  ['#7b3fb8', '#4f2380', '#fff6e8'], // violet
  ['#e9b949', '#b48419', '#2a1d05'], // or
  ['#ef7d2a', '#b4561a', '#2a1405'], // orange
  ['#f4efe2', '#2f8f9c', '#1d1b16'], // blanc
];

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function avatarColors(seed: string): { c1: string; c2: string; text: string } {
  const [c1, c2, text] = PALETTE[hashString(seed) % PALETTE.length];
  return { c1, c2, text };
}

export function avatarInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?';
}

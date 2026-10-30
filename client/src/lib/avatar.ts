// Couleurs d'avatar déterministes à partir de avatarSeed. Chaque joueur est une gemme taillée
// en losange (voir .avatar dans styles/grimoire.css) : dégradé de c1 vers c2, text pour l'initiale.

const PALETTE: [string, string, string][] = [
  ['#e0424a', '#7d0f17', '#fff3df'], // rubis
  ['#4a7be0', '#16307a', '#fff3df'], // saphir
  ['#3fae6a', '#11502b', '#fff3df'], // émeraude
  ['#4a4440', '#120f0d', '#e2c272'], // onyx
  ['#a066e0', '#3f1a72', '#fff3df'], // améthyste
  ['#ffd36a', '#a8701a', '#2a1d05'], // topaze
  ['#ff9248', '#9a3f0e', '#2a1405'], // ambre
  ['#e6f0f0', '#6f9aa8', '#1a1410'], // opale
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

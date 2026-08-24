// Couleurs d'avatar déterministes à partir de avatarSeed — palette reprise des
// maquettes /design (paires de tons proches, lisibles sur fond sombre).

const PALETTE: [string, string][] = [
  ['#6e93c2', '#284a6e'],
  ['#d8a94e', '#7a5620'],
  ['#6fbe90', '#1f4430'],
  ['#c68a6e', '#5a3626'],
  ['#8ea6c9', '#34506e'],
  ['#9a8bc4', '#423a66'],
  ['#b3986e', '#5a4726'],
  ['#7fa0b0', '#2c4450'],
  ['#dd6b5c', '#4a2018'],
  ['#4f8fcb', '#1f3552'],
];

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function avatarColors(seed: string): { c1: string; c2: string } {
  const [c1, c2] = PALETTE[hashString(seed) % PALETTE.length];
  return { c1, c2 };
}

export function avatarInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?';
}

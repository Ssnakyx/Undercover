// Couleurs d'avatar déterministes à partir de avatarSeed — palette néon de la DA "Character
// Select" (voir styles/arcade.css) : un dégradé vif par joueur et une initiale sombre lisible
// sur chaque dégradé.

const PALETTE: [string, string, string][] = [
  ['#ff5fa2', '#c2185b', '#1a0612'], // rose
  ['#4fd1ff', '#1f6fe0', '#06121f'], // cyan
  ['#7dffb2', '#16a565', '#04170d'], // vert
  ['#c79bff', '#7a3fe0', '#140a24'], // violet
  ['#ffd25e', '#ff8a1f', '#1f1004'], // or
  ['#ff7a6b', '#e0263e', '#1f0507'], // rouge
  ['#9ef0ff', '#14b3c7', '#04181b'], // turquoise
  ['#e5ff7a', '#8fbf1a', '#141a03'], // citron
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

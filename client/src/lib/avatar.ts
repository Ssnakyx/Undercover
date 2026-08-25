// Couleurs d'avatar déterministes à partir de avatarSeed — palette reprise de la refonte
// "Cérémonie douce" (5 tons chauds/froids alternés, initiale en texte sombre lisible sur
// chaque dégradé — jamais une seule couleur de texte fixe, voir design/Cover - Nouveau design).

const PALETTE: [string, string, string][] = [
  ['#f5c58a', '#e3a45f', '#2b1533'], // or
  ['#8fb6f5', '#4f74c4', '#101a2b'], // bleu
  ['#8ddcb4', '#3f9d72', '#0e2419'], // vert
  ['#cdb0f0', '#8a5fb0', '#1c1026'], // violet
  ['#e0c7b3', '#a3765c', '#2b1a10'], // ambre
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

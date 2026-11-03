import type { CSSProperties } from 'react';

// Personnages qui défilent en bandes dans le fond (images hébergées dans public/img).
const SMASH = ['mario', 'link', 'kirby', 'pikachu', 'samus', 'cloud', 'sonic', 'inkling', 'fox', 'bayonetta', 'snake', 'ryu', 'koopa', 'pacman'];
const POKEMON = [25, 6, 150, 133, 94, 448, 143, 658, 384, 1, 4, 7, 39, 197, 282, 445];
const BRAWL = Array.from({ length: 14 }, (_, i) => 16000000 + i);

const ROWS: { images: string[]; duration: string; reverse?: boolean }[] = [
  { images: SMASH.map((n) => `/img/smash/${n}.webp`), duration: '90s' },
  { images: POKEMON.map((n) => `/img/pokemon/${n}.webp`), duration: '110s', reverse: true },
  { images: BRAWL.map((n) => `/img/brawl/${n}.webp`), duration: '100s' },
];

/**
 * Fond commun à tous les écrans (DA "Grimoire" peinte, voir styles/metaphor.css) : encre noire,
 * trois grands coups de pinceau en biais, bandes de personnages qui défilent en biais (Smash,
 * Pokémon, Brawl Stars), arcs de compas blancs, grain et vignette. Monté une seule fois dans App,
 * en position fixe derrière tout le reste ; la teinte de l'univers vient de [data-universe] sur
 * l'écran courant (.screen::before).
 */
export function Backdrop() {
  return (
    <div className="backdrop" aria-hidden="true">
      <div className="backdrop__stroke backdrop__stroke--1" />
      <div className="backdrop__stroke backdrop__stroke--2" />
      <div className="backdrop__stroke backdrop__stroke--3" />
      <div className="parade">
        {ROWS.map((row, r) => (
          <div key={r} className={`parade__row${row.reverse ? ' parade__row--reverse' : ''}`} style={{ '--d': row.duration } as CSSProperties}>
            {/* Deux copies de la bande : la piste glisse d'une demi-longueur puis recommence, sans saut */}
            {[0, 1].map((copy) =>
              row.images.map((src) => <img key={`${copy}-${src}`} src={src} alt="" loading="lazy" decoding="async" draggable={false} />),
            )}
          </div>
        ))}
      </div>
      <svg className="backdrop__arcs" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice">
        <g fill="none" stroke="currentColor">
          <circle cx="760" cy="420" r="430" strokeOpacity="0.32" strokeWidth="1.2" strokeDasharray="980 60 220 40" />
          <circle cx="760" cy="420" r="300" strokeOpacity="0.18" strokeWidth="1" strokeDasharray="300 30 6 30" />
          <path d="M-40 980 L1040 -20" strokeOpacity="0.22" strokeWidth="1" />
          <path d="M120 -20 L820 1040" strokeOpacity="0.12" strokeWidth="1" />
          <path d="M0 640 H1000" strokeOpacity="0.1" strokeWidth="1" />
        </g>
      </svg>
      <div className="backdrop__grain" />
      <div className="backdrop__vignette" />
    </div>
  );
}

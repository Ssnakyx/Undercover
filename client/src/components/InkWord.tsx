import type { CSSProperties } from 'react';

// Petit hasard déterministe : chaque lettre garde la même place d'un rendu à l'autre.
function jitter(seed: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Mot de menu composé lettre par lettre, chaque lettre posée un peu de travers (hauteur,
 * angle), comme des caractères d'imprimerie collés à la main. Les variables --sx/--sy/--sr
 * servent à l'éparpillement quand on valide le choix (styles/metaphor.css, .is-leaving).
 */
export function InkWord({ text, seed = 0 }: { text: string; seed?: number }) {
  return (
    <span className="ink-word" aria-label={text}>
      {Array.from(text).map((ch, i) => {
        const r = (k: number) => jitter(seed * 31 + i * 7 + k);
        const style = {
          '--ly': `${((r(1) - 0.5) * 0.14).toFixed(3)}em`,
          '--lr': `${((r(2) - 0.5) * 7).toFixed(1)}deg`,
          '--sx': `${((r(3) - 0.3) * 260).toFixed(0)}px`,
          '--sy': `${((r(4) - 0.5) * 220).toFixed(0)}px`,
          '--sr': `${((r(5) - 0.5) * 140).toFixed(0)}deg`,
          '--li': i,
        } as CSSProperties;
        return (
          <span key={i} className={ch === ' ' ? 'ink-word__space' : 'ink-word__l'} style={style} aria-hidden="true">
            {ch}
          </span>
        );
      })}
    </span>
  );
}

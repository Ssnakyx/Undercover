import type { CSSProperties } from 'react';

// Braises qui montent du bas de l'écran. Positions fixes pour que le fond ne "saute" pas
// d'un écran à l'autre.
const EMBERS = [
  { left: '12%', d: '8s', delay: '0s', dx: '30px' },
  { left: '27%', d: '10s', delay: '2.4s', dx: '-24px' },
  { left: '41%', d: '7s', delay: '4.1s', dx: '18px' },
  { left: '58%', d: '9s', delay: '1.2s', dx: '42px' },
  { left: '71%', d: '11s', delay: '5.6s', dx: '-36px' },
  { left: '84%', d: '8.5s', delay: '3.3s', dx: '22px' },
  { left: '93%', d: '9.5s', delay: '6.8s', dx: '-14px' },
];

function Astrolabe({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 400 400" aria-hidden="true">
      <circle cx="200" cy="200" r="196" fill="none" stroke="currentColor" strokeOpacity="0.45" strokeWidth="0.8" />
      <circle cx="200" cy="200" r="188" fill="none" stroke="currentColor" strokeOpacity="0.45" strokeWidth="7" strokeDasharray="0.8 8.04" />
      <circle cx="200" cy="200" r="180" fill="none" stroke="currentColor" strokeOpacity="0.3" strokeWidth="0.8" />
      <circle cx="200" cy="200" r="150" fill="none" stroke="currentColor" strokeOpacity="0.28" strokeWidth="0.8" strokeDasharray="46 6 3 6" />
      <circle cx="200" cy="200" r="104" fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="0.8" />
      <path
        d="M200 4 V396 M4 200 H396 M61 61 L339 339 M339 61 L61 339 M125 19 L275 381 M275 19 L125 381 M19 125 L381 275 M19 275 L381 125"
        stroke="currentColor"
        strokeOpacity="0.1"
        strokeWidth="0.8"
      />
      <polygon points="200,58 228,172 342,200 228,228 200,342 172,228 58,200 172,172" fill="none" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1" />
      <circle cx="200" cy="12" r="4" fill="currentColor" fillOpacity="0.5" />
      <circle cx="388" cy="200" r="3" fill="currentColor" fillOpacity="0.4" />
      <circle cx="200" cy="388" r="4" fill="currentColor" fillOpacity="0.5" />
      <circle cx="12" cy="200" r="3" fill="currentColor" fillOpacity="0.4" />
    </svg>
  );
}

/**
 * Fond commun à tous les écrans (DA "Grimoire", voir styles/grimoire.css) : lueurs, rayons de
 * lumière, astrolabes gravés qui tournent, hachures, grain de papier, braises, vignette et
 * cadre doré. Monté une seule fois dans App, en position fixe derrière tout le reste ; la
 * lueur froide prend la couleur de l'univers via [data-universe] sur l'écran courant.
 */
export function Backdrop() {
  return (
    <div className="backdrop" aria-hidden="true">
      <div className="backdrop__glow" />
      <div className="backdrop__rays" />
      <Astrolabe className="backdrop__astrolabe backdrop__astrolabe--big" />
      <Astrolabe className="backdrop__astrolabe backdrop__astrolabe--small" />
      <div className="backdrop__hatch" />
      <div className="backdrop__grain" />
      {EMBERS.map((e) => (
        <span key={e.left} className="backdrop__ember" style={{ left: e.left, '--d': e.d, '--delay': e.delay, '--dx': e.dx } as CSSProperties} />
      ))}
      <div className="backdrop__vignette" />
      <div className="backdrop__frame" />
      <span className="backdrop__corner backdrop__corner--tl" />
      <span className="backdrop__corner backdrop__corner--tr" />
      <span className="backdrop__corner backdrop__corner--bl" />
      <span className="backdrop__corner backdrop__corner--br" />
    </div>
  );
}

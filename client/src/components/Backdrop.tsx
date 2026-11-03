/**
 * Fond commun à tous les écrans (DA "Grimoire" peinte, voir styles/metaphor.css) : encre noire
 * recouverte de peinture turquoise et rouge passée au pinceau sec (public/paint/grunge.svg en
 * masque), arcs de compas blancs qui tournent lentement, traits de règle, grain et vignette.
 * Monté une seule fois dans App, en position fixe derrière tout le reste ; la teinte de
 * l'univers vient de [data-universe] sur l'écran courant (.screen::before).
 */
export function Backdrop() {
  return (
    <div className="backdrop" aria-hidden="true">
      <div className="backdrop__paint backdrop__paint--teal" />
      <div className="backdrop__paint backdrop__paint--deep" />
      <div className="backdrop__paint backdrop__paint--red" />
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

// Bibliothèque d'icônes SVG maison (aucun asset Riot) — montée une fois dans
// App, réutilisée partout via <use href="#id"/>. Symboles portés depuis
// /design/lobby.html, reveal.html, round_result.html, gameover.html, plus un
// symbole Mr White ajouté (absent des maquettes — cf. CONTRACT.md §0).
export function IconDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        <symbol id="lane-top" viewBox="0 0 24 24">
          <path
            d="M6 10 L6 7 L8 7 L8 9 L10 9 L10 7 L12 7 L12 9 L14 9 L14 7 L16 7 L16 10 L16 18 L6 18 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </symbol>
        <symbol id="lane-jungle" viewBox="0 0 24 24">
          <line x1="6" y1="6" x2="10" y2="18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="10" y1="5" x2="14" y2="19" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="14" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </symbol>
        <symbol id="lane-mid" viewBox="0 0 24 24">
          <polygon points="12,4 20,12 12,20 4,12" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <polygon points="12,8.5 15.5,12 12,15.5 8.5,12" fill="none" stroke="currentColor" strokeWidth="1.4" />
        </symbol>
        <symbol id="lane-adc" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <line x1="12" y1="1" x2="12" y2="5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="1" y1="12" x2="5" y2="12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="19" y1="12" x2="23" y2="12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </symbol>
        <symbol id="lane-support" viewBox="0 0 24 24">
          <polygon points="12,3 19,12 12,21 5,12" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="12" cy="12" r="2.2" fill="currentColor" />
          <line x1="12" y1="0.5" x2="12" y2="3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="12" y1="21" x2="12" y2="23.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </symbol>

        <symbol id="role-civil" viewBox="0 0 40 40">
          <polygon points="10,0 30,0 40,20 30,40 10,40 0,20" fill="none" stroke="currentColor" strokeWidth="2" />
          <polygon points="20,10 26,20 20,30 14,20" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <line x1="20" y1="10" x2="20" y2="30" stroke="currentColor" strokeWidth="1.1" opacity="0.7" />
        </symbol>
        <symbol id="role-undercover" viewBox="0 0 40 40">
          <polygon points="10,0 30,0 40,20 30,40 10,40 0,20" fill="none" stroke="currentColor" strokeWidth="2" />
          <polygon points="10,17 17,15 17,19 10,21" fill="currentColor" opacity="0.9" />
          <polygon points="30,17 23,15 23,19 30,21" fill="currentColor" opacity="0.9" />
          <line x1="11" y1="29" x2="29" y2="11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </symbol>
        <symbol id="role-mrwhite" viewBox="0 0 40 40">
          <polygon points="10,0 30,0 40,20 30,40 10,40 0,20" fill="none" stroke="currentColor" strokeWidth="2" />
          <path
            d="M15 15 a5 5 0 1 1 8 4 c-2 1.5 -3 2.5 -3 5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="20" cy="29" r="1.6" fill="currentColor" />
        </symbol>
      </defs>
    </svg>
  );
}

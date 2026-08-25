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
        <symbol id="role-spy" viewBox="0 0 40 40">
          <polygon points="10,0 30,0 40,20 30,40 10,40 0,20" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M8 20 C13 12, 27 12, 32 20 C27 28, 13 28, 8 20 Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <circle cx="20" cy="20" r="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="20" cy="20" r="1.4" fill="currentColor" />
        </symbol>
        <symbol id="role-protector" viewBox="0 0 40 40">
          <polygon points="10,0 30,0 40,20 30,40 10,40 0,20" fill="none" stroke="currentColor" strokeWidth="2" />
          <path
            d="M20 9 L28 12.5 V21 C28 27 24.5 30.5 20 32 C15.5 30.5 12 27 12 21 V12.5 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path d="M16.5 20.5 L19 23 L24 17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </symbol>
        <symbol id="role-ghost" viewBox="0 0 40 40">
          <polygon points="10,0 30,0 40,20 30,40 10,40 0,20" fill="none" stroke="currentColor" strokeWidth="2" />
          <path
            d="M13 29 V19 a7 7 0 0 1 14 0 V29 l-2.3 -2.3 L22.3 29 L20 26.7 L17.7 29 L15.3 26.7 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <circle cx="17" cy="18.5" r="1.2" fill="currentColor" />
          <circle cx="23" cy="18.5" r="1.2" fill="currentColor" />
        </symbol>
        <symbol id="role-jester" viewBox="0 0 40 40">
          <polygon points="10,0 30,0 40,20 30,40 10,40 0,20" fill="none" stroke="currentColor" strokeWidth="2" />
          <path
            d="M12 26 L14 13 L20 20 L26 13 L28 26 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <circle cx="14" cy="11" r="1.4" fill="currentColor" />
          <circle cx="26" cy="11" r="1.4" fill="currentColor" />
          <circle cx="20" cy="17.5" r="1.2" fill="currentColor" />
          <path d="M15 29 Q20 32 25 29" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </symbol>
        <symbol id="role-hunter" viewBox="0 0 40 40">
          <polygon points="10,0 30,0 40,20 30,40 10,40 0,20" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="20" cy="20" r="8" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="20" cy="20" r="1.6" fill="currentColor" />
          <line x1="20" y1="8" x2="20" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="20" y1="27" x2="20" y2="32" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="8" y1="20" x2="13" y2="20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="27" y1="20" x2="32" y2="20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </symbol>
      </defs>
    </svg>
  );
}

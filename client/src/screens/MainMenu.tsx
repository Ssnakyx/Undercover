import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getLastRoomCode } from '../lib/session';

// Menu principal : choix de l'univers de contenu (CONTRACT.md §0/§7). Aucune icône/logo
// officiel — simples formes géométriques maison, cohérentes avec le design system.
export function MainMenu() {
  const navigate = useNavigate();
  // Quitter une partie (bouton, fermeture d'onglet, navigation ailleurs) ne doit pas être un
  // cul-de-sac : toute room avec une session encore valide en localStorage (voir lib/session.ts)
  // est proposée en reprise ici, l'unique point d'entrée commun à toute navigation "de zéro".
  const [lastRoomCode] = useState(() => getLastRoomCode());

  return (
    <div className="screen">
      <main className="main">
        <div className="container">
          <div className="hero">
            <svg className="hero__crest" viewBox="0 0 40 40" fill="none" aria-hidden="true">
              <polygon points="10,0 30,0 40,20 30,40 10,40 0,20" stroke="currentColor" strokeWidth="2" />
              <polygon points="20,9 31,20 20,31 9,20" stroke="currentColor" strokeWidth="1.4" opacity="0.75" />
              <circle cx="20" cy="20" r="2.2" fill="currentColor" />
            </svg>
            <h1 className="hero__title font-display">Cover</h1>
            <p className="hero__tagline">
              Un traître se cache dans l'équipe. Choisis ton univers pour commencer.
            </p>
          </div>

          {lastRoomCode && (
            <section aria-labelledby="resume-title" className="resume-section">
              <div className="section-title">
                <h2 id="resume-title" className="font-display">
                  Reprendre une partie
                </h2>
              </div>
              <div className="panel resume-panel">
                <button type="button" className="resume-row" onClick={() => navigate(`/room/${lastRoomCode}`)}>
                  <span className="resume-row__code font-mono">{lastRoomCode.split('').join(' ')}</span>
                  <span className="resume-row__cta">
                    Reprendre
                    <svg viewBox="0 0 24 24" fill="none" width={16} height={16}>
                      <path d="M9 6 L15 12 L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </button>
              </div>
            </section>
          )}

          <div className="menu-grid">
            <Link to="/play/lol" className="menu-card frame-cut">
              <svg className="menu-card__icon" viewBox="0 0 40 40" fill="none" aria-hidden="true">
                <polygon points="20,3 35,12 35,28 20,37 5,28 5,12" stroke="currentColor" strokeWidth="2" />
                <path d="M13 27 L20 13 L27 27 M16 21 L24 21" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              </svg>
              <div className="menu-card__title font-display">lolCover</div>
              <div className="menu-card__sub">League of Legends</div>
            </Link>

            <Link to="/play/smash" className="menu-card frame-cut">
              <svg className="menu-card__icon" viewBox="0 0 40 40" fill="none" aria-hidden="true">
                <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="2" />
                <path d="M12 20 L18 26 L29 13" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="menu-card__title font-display">SmashCover</div>
              <div className="menu-card__sub">Super Smash Bros Ultimate</div>
            </Link>

            <Link to="/play/pokemon" className="menu-card frame-cut">
              <svg className="menu-card__icon" viewBox="0 0 40 40" fill="none" aria-hidden="true">
                <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="2" />
                <path d="M4 20 L36 20" stroke="currentColor" strokeWidth="2" />
                <circle cx="20" cy="20" r="5" fill="var(--color-surface)" stroke="currentColor" strokeWidth="2" />
              </svg>
              <div className="menu-card__title font-display">PokéCover</div>
              <div className="menu-card__sub">Pokémon</div>
            </Link>
          </div>

          <p className="footnote">Aucun compte requis — un pseudo suffit. Jouable à 3–12, sur mobile comme sur ordinateur.</p>
        </div>
      </main>
    </div>
  );
}

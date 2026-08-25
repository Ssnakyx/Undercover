import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getLastRoomCode } from '../lib/session';
import { RoleEmblem, roleDescription, roleLabel } from '../components/RoleBadge';
import {
  GHOST_MIN_PLAYERS,
  HUNTER_MIN_PLAYERS,
  JESTER_MIN_PLAYERS,
  LOVERS_MIN_PLAYERS,
  MR_WHITE_MIN_PLAYERS,
  PROTECTOR_MIN_PLAYERS,
  SPY_MIN_PLAYERS,
} from '../lib/roles';
import type { Role } from '../types';

// Rôles de base (civil/undercover) toujours actifs, puis rôles optionnels dans l'ordre du
// Lobby, puis Amoureux en dernier (relation entre 2 joueurs, pas un Role à part entière —
// voir types.ts#Role).
const ROLE_ROWS: { role: Role; minPlayers?: number }[] = [
  { role: 'civil' },
  { role: 'undercover' },
  { role: 'mrwhite', minPlayers: MR_WHITE_MIN_PLAYERS },
  { role: 'spy', minPlayers: SPY_MIN_PLAYERS },
  { role: 'protector', minPlayers: PROTECTOR_MIN_PLAYERS },
  { role: 'ghost', minPlayers: GHOST_MIN_PLAYERS },
  { role: 'hunter', minPlayers: HUNTER_MIN_PLAYERS },
  { role: 'jester', minPlayers: JESTER_MIN_PLAYERS },
];

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

          <details className="roles-info panel frame-cut frame-cut--flat">
            <summary className="roles-info__summary font-display">Les rôles</summary>
            <div className="roles-info__list">
              {ROLE_ROWS.map(({ role, minPlayers }) => (
                <div key={role} className="roles-info__row">
                  <RoleEmblem role={role} className="roles-info__icon" />
                  <div>
                    <div className="roles-info__name">
                      {roleLabel(role)}
                      {minPlayers && <span className="roles-info__min"> — dès {minPlayers} joueurs</span>}
                    </div>
                    <div className="roles-info__desc">{roleDescription(role)}</div>
                  </div>
                </div>
              ))}
              <div className="roles-info__row">
                <span className="roles-info__icon roles-info__icon--emoji" aria-hidden="true">
                  💘
                </span>
                <div>
                  <div className="roles-info__name">
                    Amoureux<span className="roles-info__min"> — dès {LOVERS_MIN_PLAYERS} joueurs</span>
                  </div>
                  <div className="roles-info__desc">
                    2 joueurs (de n'importe quel rôle) liés en secret. Si l'un meurt, l'autre le suit aussitôt.
                  </div>
                </div>
              </div>
            </div>
          </details>

          <p className="footnote">Aucun compte requis — un pseudo suffit. Jouable à 3–12, sur mobile comme sur ordinateur.</p>
        </div>
      </main>
    </div>
  );
}

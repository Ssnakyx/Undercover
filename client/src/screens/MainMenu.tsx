import { useState, type CSSProperties, type MouseEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getLastRoomCode } from '../lib/session';
import { RoleEmblem } from '../components/RoleBadge';
import { CharacterArt } from '../components/CharacterArt';
import { roleDescription, roleLabel } from '../lib/roleInfo';
import { UNIVERSES, universeCopy } from '../lib/universe';
import {
  GHOST_MIN_PLAYERS,
  HUNTER_MIN_PLAYERS,
  JESTER_MIN_PLAYERS,
  LOVERS_MIN_PLAYERS,
  MR_WHITE_MIN_PLAYERS,
  PROTECTOR_MIN_PLAYERS,
  SPY_MIN_PLAYERS,
} from '../lib/roles';
import type { Role, Universe } from '../types';

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

// La main de cartes de l'écran titre : un personnage de chaque univers, et une carte retournée
// au milieu pour l'intrus.
const HAND: ({ src: string; name: string } | null)[] = [
  { src: universeCopy('smash').showcase[1], name: 'Mario' },
  { src: universeCopy('lol').showcase[0], name: 'Ahri' },
  null,
  { src: universeCopy('pokemon').showcase[1], name: 'Pikachu' },
  { src: universeCopy('smash').showcase[0], name: 'Link' },
];
const SPREAD = 11; // degrés entre deux cartes

function TitleHand() {
  const mid = (HAND.length - 1) / 2;
  return (
    <div className="title-hand" aria-hidden="true">
      {HAND.map((card, i) => {
        const style = {
          '--rot': `${(i - mid) * SPREAD}deg`,
          '--x': `${(i - mid) * 36}px`,
          animationDelay: `${120 + Math.abs(i - mid) * 110}ms`,
          zIndex: card ? 1 : 2,
        } as CSSProperties;
        return card ? (
          <div key={card.name} className="title-hand__card" style={style}>
            <CharacterArt name={card.name} image={card.src} universe="games" />
          </div>
        ) : (
          <div key="back" className="title-hand__card title-hand__card--back" style={style}>
            <span>?</span>
          </div>
        );
      })}
    </div>
  );
}

const OPEN_PACK_MS = 420; // durée de l'animation pack-rip (styles/table.css)

function UniverseCard({ universe }: { universe: Universe }) {
  const copy = universeCopy(universe);
  const navigate = useNavigate();
  const [opening, setOpening] = useState(false);

  function open(e: MouseEvent<HTMLAnchorElement>) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    if (opening) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      navigate(`/play/${universe}`);
      return;
    }
    setOpening(true);
    navigator.vibrate?.(20);
    window.setTimeout(() => navigate(`/play/${universe}`), OPEN_PACK_MS);
  }

  return (
    <Link to={`/play/${universe}`} className={`universe-card${opening ? ' is-opening' : ''}`} data-universe={universe} onClick={open}>
      {copy.showcase.length > 0 ? (
        <div className={`universe-card__art universe-card__art--${universe}`} aria-hidden="true">
          {copy.showcase.map((src) => (
            <img key={src} src={src} alt="" loading="lazy" onError={(e) => (e.currentTarget.style.visibility = 'hidden')} />
          ))}
        </div>
      ) : (
        <div className="universe-card__pad" aria-hidden="true">
          <svg viewBox="0 0 64 40" fill="none">
            <use href="#gamepad" />
          </svg>
        </div>
      )}
      <span className="universe-card__name">{copy.name}</span>
      <span className="universe-card__franchise">{copy.franchise}</span>
    </Link>
  );
}

// Écran titre : choix de l'univers, reprise de partie, règles.
export function MainMenu() {
  const navigate = useNavigate();
  // Toute room avec une session encore valide en localStorage est proposée en reprise ici (voir
  // lib/session.ts) — quitter un onglet ne doit pas être un cul-de-sac.
  const [lastRoomCode] = useState(() => getLastRoomCode());

  return (
    <div className="screen" data-universe="games">
      <main className="main">
        <div className="container">
          <div className="logo">
            <TitleHand />
            <h1 className="logo__title">Undercover</h1>
            <div className="logo__sub">Gaming edition</div>
            <p className="logo__tagline">
              Tout le monde a le même personnage en tête… sauf un intrus. Décris le tien sans le nommer, et démasque l'Undercover.
            </p>
          </div>

          {lastRoomCode && (
            <button type="button" className="resume-card" onClick={() => navigate(`/room/${lastRoomCode}`)}>
              <span style={{ flex: 1 }}>
                <span className="eyebrow">Partie en cours</span>
                <br />
                <span className="small text-mid">Reprendre la partie</span>
              </span>
              <span className="resume-card__code">{lastRoomCode}</span>
            </button>
          )}

          <div className="universe-grid">
            {UNIVERSES.map((u) => (
              <UniverseCard key={u} universe={u} />
            ))}
          </div>

          <details className="howto panel">
            <summary>Comment jouer</summary>
            <ol className="howto__steps">
              <li>Un joueur crée la partie et partage le code. 3 à 12 joueurs, chacun sur son téléphone.</li>
              <li>Chacun reçoit en secret un personnage. Les Civils ont tous le même, l'Undercover en a un proche.</li>
              <li>À tour de rôle, chacun le décrit en un mot ou une phrase, à voix haute, sans jamais le nommer.</li>
              <li>Tout le monde vote pour éliminer le joueur le plus suspect. Son rôle est révélé.</li>
              <li>Les Civils gagnent s'ils éliminent tous les intrus. Les Undercover gagnent s'ils deviennent aussi nombreux que les Civils.</li>
            </ol>
          </details>

          <details className="howto panel mt-4">
            <summary>Les rôles</summary>
            <div className="role-list">
              {ROLE_ROWS.map(({ role, minPlayers }) => (
                <div key={role} className="role-line" style={{ '--role-color': `var(--role-${role})` } as CSSProperties}>
                  <RoleEmblem role={role} className="role-line__icon" />
                  <div>
                    <div className="role-line__name">
                      {roleLabel(role)}
                      {minPlayers && <span className="text-low small">, dès {minPlayers} joueurs</span>}
                    </div>
                    <div className="role-line__desc">{roleDescription(role)}</div>
                  </div>
                </div>
              ))}
              <div className="role-line">
                <span className="role-line__icon" style={{ fontSize: 26, textAlign: 'center' }} aria-hidden="true">
                  💘
                </span>
                <div>
                  <div className="role-line__name">
                    Amoureux<span className="text-low small">, dès {LOVERS_MIN_PLAYERS} joueurs</span>
                  </div>
                  <div className="role-line__desc">2 joueurs liés en secret, quel que soit leur rôle. Si l'un est éliminé, l'autre le suit.</div>
                </div>
              </div>
            </div>
          </details>

          <p className="footnote">Aucun compte requis, un pseudo suffit. Projet de fans, non affilié à Riot Games, Nintendo ou The Pokémon Company.</p>
        </div>
      </main>
    </div>
  );
}

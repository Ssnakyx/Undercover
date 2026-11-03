import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getLastRoomCode } from '../lib/session';
import { RoleEmblem } from '../components/RoleBadge';
import { InkWord } from '../components/InkWord';
import { roleDescription, roleLabel } from '../lib/roleInfo';
import { UNIVERSES, universeCopy } from '../lib/universe';
import { isWikiRef, resolveWikiImage } from '../lib/wikiImage';
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

// Image du portrait : URL directe, ou "wiki:Titre" résolu via Wikipédia (lib/wikiImage).
function ShowcaseImage({ src }: { src: string }) {
  const [url, setUrl] = useState<string | null>(isWikiRef(src) ? null : src);
  useEffect(() => {
    if (!isWikiRef(src)) return;
    let alive = true;
    void resolveWikiImage(src).then((resolved) => alive && setUrl(resolved));
    return () => {
      alive = false;
    };
  }, [src]);
  if (!url) return <span className="menu-portrait__slot" />;
  return <img src={url} alt="" loading="lazy" onError={(e) => (e.currentTarget.style.visibility = 'hidden')} />;
}

// Décalage horizontal et taille de chaque ligne de la cascade : volontairement irrégulier.
const CASCADE_LAYOUT = [
  { x: 0.4, size: 1 },
  { x: 1.6, size: 0.92 },
  { x: 0, size: 1.06 },
  { x: 1.1, size: 0.96 },
  { x: 0.2, size: 1.02 },
  { x: 1.9, size: 0.8 },
  { x: 0.9, size: 0.86 },
  { x: 2.3, size: 0.98 },
];

const LEAVE_MS = 560; // éparpillement des lettres + volet blanc (styles/metaphor.css)

// Écran titre : cascade des univers façon menu de RPG, reprise de partie, règles.
// Écran titre : choix de l'univers, reprise de partie, règles.
export function MainMenu() {
  const navigate = useNavigate();
  // Toute room avec une session encore valide en localStorage est proposée en reprise ici (voir
  // lib/session.ts) — quitter un onglet ne doit pas être un cul-de-sac.
  const [lastRoomCode] = useState(() => getLastRoomCode());
  const [active, setActive] = useState(0);
  const [leaving, setLeaving] = useState<number | null>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const activeUniverse = UNIVERSES[active];
  const activeCopy = universeCopy(activeUniverse);

  function confirm(index: number, e?: MouseEvent<HTMLAnchorElement>) {
    if (e && (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0)) return;
    e?.preventDefault();
    if (leaving !== null) return;
    const target = `/play/${UNIVERSES[index]}`;
    setActive(index);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      navigate(target);
      return;
    }
    setLeaving(index);
    navigator.vibrate?.(20);
    window.setTimeout(() => navigate(target, { state: { wipe: true } }), LEAVE_MS);
  }

  // Flèches haut/bas : on parcourt la cascade comme un menu de jeu (le focus suit la sélection).
  function onKeyDown(e: KeyboardEvent<HTMLElement>) {
    const delta = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = (active + delta + UNIVERSES.length) % UNIVERSES.length;
    setActive(next);
    itemRefs.current[next]?.focus();
  }

  return (
    <div className={`screen menu${leaving !== null ? ' is-leaving' : ''}`} data-universe={activeUniverse}>
      <main className="main menu__main">
        <header className="menu-title">
          <span className="paint paint--blot menu-title__splash" aria-hidden="true" />
          <h1 className="menu-title__word">
            <InkWord text="Undercover" seed={3} />
          </h1>
          <span className="ink-tag menu-title__tag">Gaming edition</span>
        </header>

        <p className="menu-tagline">
          Tout le monde a le même personnage en tête… sauf un intrus. Décris le tien sans le nommer, et démasque l'Undercover.
        </p>

        {lastRoomCode && (
          <button type="button" className="resume-card" onClick={() => navigate(`/room/${lastRoomCode}`, { viewTransition: true })}>
            <span style={{ flex: 1 }}>
              <span className="eyebrow">Partie en cours</span>
              <br />
              <span className="small text-mid">Reprendre la partie</span>
            </span>
            <span className="resume-card__code">{lastRoomCode}</span>
          </button>
        )}

        <section className="menu-stage" aria-label="Choisir un univers">
          <div className="menu-numeral" aria-hidden="true">
            <span key={active} className="menu-numeral__digit">
              {active + 1}
            </span>
            <span className="menu-numeral__label">Univers</span>
          </div>

          <div key={activeUniverse} className={`menu-portrait${activeCopy.framed ? ' menu-portrait--framed' : ''}`} aria-hidden="true">
            {activeCopy.showcase.map((src) => (
              <ShowcaseImage key={src} src={src} />
            ))}
          </div>

          <nav className="cascade" onKeyDown={onKeyDown}>
            {UNIVERSES.map((u, i) => {
              const copy = universeCopy(u);
              const layout = CASCADE_LAYOUT[i % CASCADE_LAYOUT.length];
              const state = leaving === i ? ' is-chosen' : i === active ? ' is-active' : '';
              return (
                <Link
                  key={u}
                  ref={(el) => {
                    itemRefs.current[i] = el;
                  }}
                  to={`/play/${u}`}
                  data-universe={u}
                  className={`cascade__item${state}`}
                  style={{ '--i': i, '--x': layout.x, '--size': layout.size } as CSSProperties}
                  onMouseEnter={() => leaving === null && setActive(i)}
                  onFocus={() => leaving === null && setActive(i)}
                  onClick={(e) => confirm(i, e)}
                >
                  <span className={`paint paint--stroke-${(i % 3) + 1} cascade__splash`} aria-hidden="true" />
                  <span className="cascade__word">
                    <InkWord text={copy.name} seed={i + 11} />
                  </span>
                  <span className="ink-tag cascade__tag">{copy.franchise}</span>
                </Link>
              );
            })}
          </nav>

          <dl className="menu-stats">
            <div>
              <dt>Joueurs</dt>
              <dd>3–12</dd>
            </div>
            <div>
              <dt>Univers</dt>
              <dd>{UNIVERSES.length}</dd>
            </div>
          </dl>

          <div className="prompt-tags" aria-hidden="true">
            <span className="prompt-tag">
              <span className="prompt-tag__key">⏎</span>Confirmer
            </span>
            <span className="prompt-tag">
              <span className="prompt-tag__key">↕</span>Choisir
            </span>
          </div>
        </section>

        <div className="container menu__extras">
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

          <p className="footnote">Aucun compte requis, un pseudo suffit. Projet de fans, non affilié à Riot Games, Nintendo, The Pokémon Company, Supercell ni aux éditeurs des mangas cités.</p>
        </div>
      </main>
    </div>
  );
}

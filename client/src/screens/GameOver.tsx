import { useNavigate } from 'react-router-dom';
import { useRoom } from '../socket/RoomProvider';
import { AppBar } from '../components/AppBar';
import { ActionBar } from '../components/ActionBar';
import { Avatar } from '../components/Avatar';
import { RoleBadge } from '../components/RoleBadge';
import { ThemeToggle } from '../components/ThemeToggle';
import { universeCopy } from '../lib/universe';
import type { Winner } from '../types';

const WINNER_COPY: Record<Winner, { eyebrow: string; title: string; sub: string; role: 'civil' | 'undercover' | 'mrwhite' | 'jester' }> = {
  civils: {
    eyebrow: 'Victoire',
    title: 'Les Civils l’emportent',
    sub: 'Tous les Undercover et Mr White ont été démasqués avant la fin de la partie.',
    role: 'civil',
  },
  undercover: {
    eyebrow: 'Victoire',
    title: 'Les Undercover l’emportent',
    sub: 'Ils ont survécu en nombre égal ou supérieur aux civils.',
    role: 'undercover',
  },
  mrwhite: {
    eyebrow: 'Victoire',
    title: 'Mr White s’évade',
    sub: 'Il s’en sort — par la ruse d’une devinette juste ou par la survie, seul face aux civils.',
    role: 'mrwhite',
  },
  jester: {
    eyebrow: 'Victoire',
    title: 'Le Bouffon a berné tout le monde',
    sub: 'Il voulait se faire éliminer par un vote — et il a réussi. Il gagne seul.',
    role: 'jester',
  },
};

export function GameOver() {
  const { roomState, playerId, lastGameEnded, restartGame, leaveRoom } = useRoom();
  const navigate = useNavigate();

  if (!roomState || !lastGameEnded) return null;

  const me = roomState.players.find((p) => p.playerId === playerId);
  const isHost = me?.isHost ?? false;
  const copy = WINNER_COPY[lastGameEnded.winner];
  const unit = universeCopy(roomState.universe).unitLabel;

  // La partie est déjà terminée ici : contrairement à HostQuitButton (qui coupe une partie en
  // cours pour tout le monde), quitter depuis game_over n'affecte que soi — pas de confirmation
  // nécessaire, tous les joueurs (host inclus) peuvent revenir au menu librement.
  function backToMenu() {
    leaveRoom();
    navigate('/', { replace: true, viewTransition: true });
  }

  return (
    <div className="screen theme-paper">
      <AppBar
        title="Fin de partie"
        right={
          <>
            <ThemeToggle />
            <span className="badge badge--muted">Round {roomState.round}</span>
          </>
        }
      />

      <main className="main">
        <div className={`winner-banner winner-banner--${copy.role} frame-cut frame-cut--lg`}>
          <svg className="winner-banner__burst" viewBox="0 0 200 200" fill="none" aria-hidden="true">
            <g stroke="currentColor" strokeWidth="1">
              <line x1="100" y1="100" x2="100" y2="10" />
              <line x1="100" y1="100" x2="152" y2="20" />
              <line x1="100" y1="100" x2="180" y2="60" />
              <line x1="100" y1="100" x2="190" y2="120" />
              <line x1="100" y1="100" x2="48" y2="20" />
              <line x1="100" y1="100" x2="20" y2="60" />
              <line x1="100" y1="100" x2="10" y2="120" />
            </g>
          </svg>
          <span className="eyebrow winner-banner__eyebrow">{copy.eyebrow}</span>
          <h1 className="winner-banner__title font-display">{copy.title}</h1>
          <p className="winner-banner__sub">{copy.sub}</p>
          <svg className="winner-banner__emblem" viewBox="0 0 40 40" fill="none" aria-hidden="true">
            <use href={`#role-${copy.role}`} />
          </svg>
        </div>

        <div className="container">
          <section aria-labelledby="reveal-title">
            <div className="section-title">
              <h2 id="reveal-title" className="font-display">
                Révélation complète
              </h2>
              <span className="text-low font-mono" style={{ fontSize: 'var(--text-xs)' }}>
                {lastGameEnded.reveal.length} joueurs
              </span>
            </div>

            <div className="reveal-grid">
              {lastGameEnded.reveal.map((p) => {
                const player = roomState.players.find((pl) => pl.playerId === p.playerId);
                const lover = p.loverPlayerId
                  ? lastGameEnded.reveal.find((r) => r.playerId === p.loverPlayerId)
                  : null;
                return (
                  <div
                    className={`reveal-chip frame-cut${p.role === 'mrwhite' || p.role === 'jester' ? ' reveal-chip--mrwhite' : ''}`}
                    key={p.playerId}
                  >
                    <Avatar seed={player?.avatarSeed ?? p.playerId} name={p.name} />
                    <div className="reveal-chip__name">{p.name}</div>
                    <RoleBadge role={p.role} />
                    <div className="reveal-chip__champion">{p.champion ?? `Bluffait — aucun ${unit}`}</div>
                    {lover && <div className="reveal-chip__lover">💘 lié à {lover.name}</div>}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </main>

      <ActionBar>
        {isHost ? (
          <>
            <button className="btn btn-primary" type="button" onClick={restartGame}>
              Rejouer
            </button>
            <span className="confirm-hint">Nouvelle partie, mêmes joueurs et réglages — seul l'hôte peut relancer</span>
          </>
        ) : (
          <button className="btn btn-secondary" type="button" disabled>
            En attente de l'hôte…
          </button>
        )}
        <button className="btn btn-secondary" type="button" onClick={backToMenu}>
          Retour au menu
        </button>
      </ActionBar>
    </div>
  );
}

import { useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoom } from '../socket/RoomProvider';
import { AppBar } from '../components/AppBar';
import { ActionBar } from '../components/ActionBar';
import { Avatar } from '../components/Avatar';
import { CharacterArt } from '../components/CharacterArt';
import { RoleBadge } from '../components/RoleBadge';
import { universeCopy } from '../lib/universe';
import type { Role, Winner } from '../types';

const WINNER_COPY: Record<Winner, { title: string; sub: string; tone: string }> = {
  civils: { title: 'Les Civils gagnent', sub: 'Tous les intrus ont été démasqués.', tone: 'var(--role-civil)' },
  undercover: { title: 'Les Undercover gagnent', sub: 'Ils sont désormais aussi nombreux que les Civils.', tone: 'var(--role-undercover)' },
  mrwhite: { title: 'Mr White s’en sort', sub: 'Par une devinette juste… ou en survivant jusqu’au bout.', tone: 'var(--role-mrwhite)' },
  jester: { title: 'Le Bouffon a gagné', sub: 'Il voulait se faire éliminer. Mission accomplie.', tone: 'var(--role-jester)' },
};

const RAIN_COLORS = ['var(--gold)', 'var(--red)', 'var(--role-civil)', 'var(--role-undercover)', 'var(--role-mrwhite)'];

// Cartes qui tombent sur le bandeau de victoire. Positions tirées une fois au montage.
function CardRain() {
  const [cards] = useState(() =>
    Array.from({ length: 26 }, (_, i) => ({
      left: `${Math.random() * 100}%`,
      '--c': RAIN_COLORS[i % RAIN_COLORS.length],
      '--d': `${1.8 + Math.random() * 1.6}s`,
      '--delay': `${Math.random() * 0.9}s`,
      '--drift': `${(Math.random() - 0.5) * 120}px`,
      '--spin': `${(Math.random() > 0.5 ? 1 : -1) * (240 + Math.random() * 480)}deg`,
    })),
  );
  return (
    <div className="card-rain" aria-hidden="true">
      {cards.map((style, i) => (
        <span key={i} style={style as CSSProperties} />
      ))}
    </div>
  );
}

const CIVIL_SIDE: Role[] = ['civil', 'spy', 'protector', 'ghost', 'hunter'];

function isWinner(role: Role, winner: Winner): boolean {
  return winner === 'civils' ? CIVIL_SIDE.includes(role) : role === winner;
}

export function GameOver() {
  const { roomState, playerId, lastGameEnded, restartGame, backToLobby, leaveRoom } = useRoom();
  const navigate = useNavigate();

  if (!roomState || !lastGameEnded) return null;

  const me = roomState.players.find((p) => p.playerId === playerId);
  const isHost = me?.isHost ?? false;
  const copy = WINNER_COPY[lastGameEnded.winner];
  const unit = universeCopy(roomState.universe).unitLabel;
  const myReveal = lastGameEnded.reveal.find((r) => r.playerId === playerId);
  const iWon = myReveal ? isWinner(myReveal.role, lastGameEnded.winner) : false;
  const pair = lastGameEnded.pair;
  const leaderboard = [...roomState.players].sort((a, b) => b.score - a.score);

  // Quitter depuis game_over n'affecte que soi — la partie est déjà terminée.
  function backToMenu() {
    leaveRoom();
    navigate('/', { replace: true });
  }

  return (
    <div className="screen" data-universe={roomState.universe}>
      <AppBar title="Fin de partie" right={<span className="badge badge--accent">{roomState.round} manche{roomState.round > 1 ? 's' : ''}</span>} />

      <main className="main">
        <div className="container stack">
          <div className="hud-frame victory" style={{ '--tone': copy.tone } as CSSProperties}>
            {(!myReveal || iWon) && <CardRain />}
            <div className="victory__label">{myReveal ? (iWon ? 'Victoire' : 'Défaite') : 'Partie terminée'}</div>
            <h1 className="victory__title">{copy.title}</h1>
            <p className="victory__sub">{copy.sub}</p>
          </div>

          {pair && (
            <section className="panel">
              <div className="section__head">
                <h2 className="section__title">La paire</h2>
                <span className="section__count">{pair.theme}</span>
              </div>
              <div className="versus">
                <div className="versus__side" style={{ '--tone': 'var(--role-civil)' } as CSSProperties}>
                  <CharacterArt className="versus__art" name={pair.civil} image={pair.civilImage} universe={roomState.universe} />
                  <span className="versus__name">{pair.civil}</span>
                  <span className="badge badge--civil">Civils</span>
                </div>
                <span className="versus__vs">VS</span>
                <div className="versus__side" style={{ '--tone': 'var(--role-undercover)' } as CSSProperties}>
                  <CharacterArt className="versus__art" name={pair.undercover} image={pair.undercoverImage} universe={roomState.universe} />
                  <span className="versus__name">{pair.undercover}</span>
                  <span className="badge badge--undercover">Undercover</span>
                </div>
              </div>
            </section>
          )}

          <section aria-labelledby="reveal-title">
            <div className="section__head">
              <h2 id="reveal-title" className="section__title">
                Qui était qui
              </h2>
              <span className="section__count">{lastGameEnded.reveal.length} joueurs</span>
            </div>
            <div className="reveal-grid">
              {lastGameEnded.reveal.map((p, i) => {
                const player = roomState.players.find((pl) => pl.playerId === p.playerId);
                const lover = p.loverPlayerId ? lastGameEnded.reveal.find((r) => r.playerId === p.loverPlayerId) : null;
                return (
                  <div
                    className={`reveal-tile${isWinner(p.role, lastGameEnded.winner) ? ' reveal-tile--winner' : ''}`}
                    key={p.playerId}
                    style={{ '--tone': `var(--role-${p.role})`, animationDelay: `${i * 50}ms` } as CSSProperties}
                  >
                    {p.champion ? (
                      <CharacterArt className="reveal-tile__art" name={p.champion} image={p.championImage} universe={roomState.universe} />
                    ) : (
                      <div className="reveal-tile__art char-art" style={{ display: 'grid', placeItems: 'center' }}>
                        <Avatar seed={player?.avatarSeed ?? p.playerId} name={p.name} size="lg" />
                      </div>
                    )}
                    <div className="reveal-tile__body">
                      <span className="reveal-tile__player">
                        {p.name}
                        {p.playerId === playerId && <span className="text-low small"> (toi)</span>}
                      </span>
                      <RoleBadge role={p.role} />
                      <span className="reveal-tile__word">{p.champion ?? `Aucun ${unit}`}</span>
                      {lover && <span className="reveal-tile__word">💘 lié à {lover.name}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section aria-labelledby="leaderboard-title">
            <div className="section__head">
              <h2 id="leaderboard-title" className="section__title">
                Classement de la soirée
              </h2>
            </div>
            <div className="leaderboard">
              {leaderboard.map((p, i) => (
                <div key={p.playerId} className={`leader-row${i === 0 && p.score > 0 ? ' leader-row--first' : ''}`}>
                  <span className="leader-row__rank">{i === 0 && p.score > 0 ? '👑' : i + 1}</span>
                  <Avatar seed={p.avatarSeed} name={p.name} size="sm" />
                  <span className="leader-row__name">
                    {p.name}
                    {p.playerId === playerId && <span className="text-low small"> (toi)</span>}
                  </span>
                  <span className="leader-row__score">{p.score} pt{p.score > 1 ? 's' : ''}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      <ActionBar hint={isHost ? 'Rejouer garde les réglages. Le salon permet de les changer et d’accueillir de nouveaux joueurs.' : undefined}>
        {isHost ? (
          <>
            <button className="btn btn-primary" type="button" onClick={restartGame}>
              Rejouer
            </button>
            <div className="action-bar__row">
              <button className="btn btn-secondary btn-sm" type="button" onClick={backToLobby}>
                Retour au salon
              </button>
              <button className="btn btn-ghost btn-sm" type="button" onClick={backToMenu}>
                Quitter
              </button>
            </div>
          </>
        ) : (
          <div className="action-bar__row">
            <button className="btn btn-secondary" type="button" disabled>
              En attente de l'hôte…
            </button>
            <button className="btn btn-ghost" type="button" style={{ flex: '0 0 auto', width: 'auto' }} onClick={backToMenu}>
              Quitter
            </button>
          </div>
        )}
      </ActionBar>
    </div>
  );
}

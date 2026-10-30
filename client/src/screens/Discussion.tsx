import { useRoom } from '../socket/RoomProvider';
import { GameHud } from '../components/GameHud';
import { ActionBar } from '../components/ActionBar';
import { Avatar } from '../components/Avatar';
import { Countdown } from '../components/Countdown';
import { universeCopy } from '../lib/universe';

// Pas de saisie d'indice : les joueurs décrivent leur mot à voix haute, hors app, dans l'ordre
// affiché. L'hôte lance le vote quand il juge la discussion close (ou le minuteur s'en charge).
export function Discussion() {
  const { roomState, playerId, startVoting } = useRoom();

  if (!roomState) return null;

  const me = roomState.players.find((p) => p.playerId === playerId);
  const isHost = me?.isHost ?? false;
  const unit = universeCopy(roomState.universe).unitArticle;
  const timerMs = roomState.settings.discussionSeconds * 1000;
  const firstName = roomState.players.find((p) => p.playerId === roomState.turnOrder[0])?.name;

  return (
    <div className="screen" data-universe={roomState.universe}>
      <GameHud title="Discussion" />

      <main className="main">
        <div className="container">
          <div className="hud-frame phase-banner">
            <div className="phase-banner__text">
              <div className="eyebrow">Manche {roomState.round}</div>
              <div className="phase-banner__title">Décris {unit}</div>
              <div className="phase-banner__sub">
                {firstName ? `${firstName} commence. ` : ''}Un indice chacun, sans jamais le nommer.
              </div>
            </div>
            {timerMs > 0 && <Countdown deadline={roomState.phaseDeadline} totalMs={timerMs} />}
          </div>

          <section className="section" aria-labelledby="turn-title">
            <div className="section__head">
              <h2 id="turn-title" className="section__title">
                Ordre de passage
              </h2>
              <span className="section__count">{roomState.turnOrder.length} en lice</span>
            </div>
            <div className="turn-list">
              {roomState.turnOrder.map((id, i) => {
                const p = roomState.players.find((pl) => pl.playerId === id);
                if (!p) return null;
                return (
                  <div className={`turn-item${i === 0 ? ' turn-item--first' : ''}`} key={id} style={{ animationDelay: `${i * 40}ms` }}>
                    <span className="turn-item__index">{String(i + 1).padStart(2, '0')}</span>
                    <Avatar seed={p.avatarSeed} name={p.name} size="sm" host={p.isHost} />
                    <span className="turn-item__name">
                      {p.name}
                      {p.playerId === playerId && <span className="text-low small"> (toi)</span>}
                    </span>
                    {!p.connected && <span className="badge">Hors ligne</span>}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </main>

      <ActionBar hint={isHost ? 'Lance le vote une fois que tout le monde a parlé.' : undefined}>
        {isHost ? (
          <button className="btn btn-primary" type="button" onClick={startVoting}>
            Passer au vote
          </button>
        ) : (
          <button className="btn btn-secondary" type="button" disabled>
            L'hôte lancera le vote…
          </button>
        )}
      </ActionBar>
    </div>
  );
}

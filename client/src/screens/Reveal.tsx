import { useState } from 'react';
import { useRoom } from '../socket/RoomProvider';
import { GameHud } from '../components/GameHud';
import { ActionBar } from '../components/ActionBar';
import { Countdown } from '../components/Countdown';
import { roleToneClass } from '../lib/roleInfo';
import { RoleCardContent } from '../components/RoleCard';

const REVEAL_TOTAL_MS = 30_000; // miroir de server/src/game/engine.ts#REVEAL_ACK_TIMEOUT_MS

export function Reveal() {
  const { roomState, playerId, myRole, ackReveal, forceEndReveal } = useRoom();
  const [flipped, setFlipped] = useState(false);
  const [acked, setAcked] = useState(false);

  if (!roomState) return null;

  const isHost = roomState.players.find((p) => p.playerId === playerId)?.isHost ?? false;

  function flip() {
    setFlipped((f) => !f);
    if (!flipped) navigator.vibrate?.(30);
  }

  function confirm() {
    ackReveal();
    setAcked(true);
    setFlipped(false);
  }

  return (
    <div className="screen" data-universe={roomState.universe}>
      <GameHud title="Révélation" />

      <main className="reveal-main">
        <div className="row" style={{ width: 'min(340px, 86vw)' }}>
          <div className="reveal-intro" style={{ flex: 1, textAlign: 'left' }}>
            <span className="eyebrow">Top secret</span>
            <h1>Cache ton écran</h1>
          </div>
          <Countdown deadline={roomState.phaseDeadline} totalMs={REVEAL_TOTAL_MS} size="sm" />
        </div>

        <div className="flip-scene">
          <div className={`flip-card${flipped ? ' is-flipped' : ''}`}>
            <div
              className="flip-card__face flip-card__face--front"
              role="button"
              tabIndex={0}
              aria-pressed={flipped}
              aria-label="Toucher pour révéler ton rôle"
              onClick={flip}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  flip();
                }
              }}
            >
              <span className="card-back__mark">?</span>
              <span className="card-back__hint">Touche pour révéler</span>
            </div>

            <div className={`flip-card__face flip-card__face--back ${roleToneClass(myRole?.role)}`} onClick={flip} role="button" tabIndex={-1} aria-label="Toucher pour cacher">
              <RoleCardContent myRole={myRole} universe={roomState.universe} />
            </div>
          </div>
        </div>
        <p className="tiny text-low pixel">{flipped ? 'Touche la carte pour la cacher' : 'Tu pourras la revoir pendant la partie'}</p>
      </main>

      <ActionBar
        hint={
          acked
            ? `En attente des autres… (${roomState.players.filter((p) => p.alive).length} joueurs)`
            : 'La partie démarre quand tout le monde a confirmé.'
        }
      >
        <div className="action-bar__row">
          <button className="btn btn-primary" type="button" disabled={(!flipped && !acked) || acked} onClick={confirm}>
            {acked ? '✓ Prêt' : "J'ai vu mon rôle"}
          </button>
          {isHost && (
            <button className="btn btn-ghost" type="button" style={{ flex: '0 0 auto', width: 'auto' }} onClick={forceEndReveal} title="Lancer la discussion sans attendre">
              Passer ⏭
            </button>
          )}
        </div>
      </ActionBar>
    </div>
  );
}

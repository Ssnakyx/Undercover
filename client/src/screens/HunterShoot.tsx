import { useState } from 'react';
import { useRoom } from '../socket/RoomProvider';
import { GameHud } from '../components/GameHud';
import { ActionBar } from '../components/ActionBar';
import { Avatar } from '../components/Avatar';
import { Countdown } from '../components/Countdown';
import { RoleEmblem } from '../components/RoleBadge';

const SHOOT_TOTAL_MS = 30_000; // miroir de server/src/game/engine.ts#HUNTER_SHOOT_TIMEOUT_MS

export function HunterShoot() {
  const { roomState, playerId, hunterShoot } = useRoom();
  const [target, setTarget] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (!roomState) return null;

  const shooterId = roomState.hunterShootPlayerId;
  const shooter = roomState.players.find((p) => p.playerId === shooterId);
  const isShooter = !!shooterId && shooterId === playerId;
  const targets = roomState.players.filter((p) => p.alive && p.playerId !== playerId);

  function fire(targetPlayerId: string | null) {
    if (submitted) return;
    hunterShoot(targetPlayerId);
    setSubmitted(true);
    navigator.vibrate?.([40, 30, 80]);
  }

  return (
    <div className="screen" data-universe={roomState.universe}>
      <GameHud title="Le Chasseur" />

      <main className="main">
        <div className="container">
          <div className="hud-frame ko-block tone-hunter">
            <span className="eyebrow">Dernière balle</span>
            {shooter && <Avatar seed={shooter.avatarSeed} name={shooter.name} size="xl" dead />}
            <div className="ko-name">{shooter?.name ?? 'Le Chasseur'}</div>
            <span className="ko-role" style={{ animationDelay: '0s' }}>
              <RoleEmblem role="hunter" /> Chasseur
            </span>
            <p className="text-mid">Éliminé, il peut emporter un joueur avec lui… ou épargner tout le monde.</p>
            <Countdown deadline={roomState.phaseDeadline} totalMs={SHOOT_TOTAL_MS} />
          </div>

          {isShooter && (
            <section className="section">
              <div className="section__head">
                <h2 className="section__title">Choisis ta cible</h2>
              </div>
              <div className="select-grid">
                {targets.map((p) => (
                  <button
                    key={p.playerId}
                    type="button"
                    className="select-tile select-tile--hunt"
                    aria-pressed={target === p.playerId}
                    disabled={submitted}
                    onClick={() => setTarget(p.playerId)}
                  >
                    <Avatar seed={p.avatarSeed} name={p.name} size="lg" />
                    <span className="select-tile__name">{p.name}</span>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <ActionBar>
        {isShooter ? (
          <div className="action-bar__row">
            <button className="btn btn-danger" type="button" disabled={!target || submitted} onClick={() => fire(target)}>
              🎯 Tirer{target ? ` sur ${roomState.players.find((p) => p.playerId === target)?.name}` : ''}
            </button>
            <button className="btn btn-ghost" type="button" disabled={submitted} style={{ flex: '0 0 auto', width: 'auto' }} onClick={() => fire(null)}>
              Épargner
            </button>
          </div>
        ) : (
          <button className="btn btn-secondary" type="button" disabled>
            {shooter?.name ?? 'Le Chasseur'} vise…
          </button>
        )}
      </ActionBar>
    </div>
  );
}

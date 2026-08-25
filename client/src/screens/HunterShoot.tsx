import { useState } from 'react';
import { useRoom } from '../socket/RoomProvider';
import { AppBar } from '../components/AppBar';
import { ActionBar } from '../components/ActionBar';
import { Avatar } from '../components/Avatar';
import { RoleEmblem } from '../components/RoleBadge';
import { HostQuitButton } from '../components/HostQuitButton';
import { HostRestartButton } from '../components/HostRestartButton';

// Pas de maquette dédiée (absente de /design) — réutilise la grammaire visuelle de
// round_result / mrwhite_guess (eliminated-block + role-reveal), même décision documentée
// que MrWhiteGuess.tsx (voir client/README.md).
export function HunterShoot() {
  const { roomState, playerId, lastRoundResult, hunterShoot } = useRoom();
  const [target, setTarget] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (!roomState) return null;

  const eliminatedId = lastRoundResult?.eliminatedPlayerId ?? null;
  const eliminated = eliminatedId ? roomState.players.find((p) => p.playerId === eliminatedId) : null;
  const isShooter = eliminatedId !== null && eliminatedId === playerId;
  const isHost = roomState.players.find((p) => p.playerId === playerId)?.isHost ?? false;
  const alivePlayers = roomState.players.filter((p) => p.alive);

  function fire(targetPlayerId: string | null) {
    if (submitted) return;
    setTarget(targetPlayerId);
    hunterShoot(targetPlayerId);
    setSubmitted(true);
  }

  return (
    <div className="screen">
      <AppBar
        title="Le Chasseur tire"
        right={
          <>
            {isHost && <HostRestartButton />}
            {isHost && <HostQuitButton />}
            <span className="badge badge--muted">Round {roomState.round}</span>
          </>
        }
      />

      <main className="main">
        <div className="container">
          <div className="eliminated-block frame-cut frame-cut--lg">
            <span className="eyebrow">Le Chasseur a été démasqué</span>
            {eliminated && <Avatar seed={eliminated.avatarSeed} name={eliminated.name} size="lg" />}
            <div className="eliminated-block__name">{eliminated?.name ?? 'Le Chasseur'}</div>

            <div className="role-reveal role-reveal--hunter frame-cut">
              <RoleEmblem role="hunter" className="role-reveal__emblem" />
              <div>
                <div className="role-reveal__eyebrow">Dernière balle</div>
                <div className="role-reveal__champion" style={{ textTransform: 'none', fontSize: 'var(--text-base)' }}>
                  Il peut tirer sur un autre joueur, qui sera éliminé aussi — ou ne tirer sur personne.
                </div>
              </div>
            </div>
          </div>

          {isShooter && (
            <section aria-labelledby="hunter-targets-title" className="mt-6">
              <div className="section-title">
                <h2 id="hunter-targets-title" className="font-display">
                  Choisis ta cible
                </h2>
              </div>
              <div className="panel" style={{ padding: '0 var(--space-5)' }}>
                {alivePlayers
                  .filter((p) => p.playerId !== playerId)
                  .map((p) => (
                    <button
                      key={p.playerId}
                      type="button"
                      className="vote-row vote-btn"
                      disabled={submitted}
                      onClick={() => fire(p.playerId)}
                    >
                      <Avatar seed={p.avatarSeed} name={p.name} />
                      <span className="player-row__name">{p.name}</span>
                    </button>
                  ))}
              </div>
            </section>
          )}
        </div>
      </main>

      {isShooter ? (
        <ActionBar>
          <button className="btn btn-secondary" type="button" disabled={submitted} onClick={() => fire(null)}>
            Ne tirer sur personne
          </button>
          <span className="confirm-hint">
            {submitted
              ? target
                ? 'Tir envoyé — en attente du résultat…'
                : 'Tu as choisi de ne tirer sur personne.'
              : 'Une seule décision — choisis une cible ci-dessus ou passe.'}
          </span>
        </ActionBar>
      ) : (
        <ActionBar>
          <div className="waiting-note panel">En attente de la décision de {eliminated?.name ?? 'le Chasseur'}…</div>
        </ActionBar>
      )}
    </div>
  );
}

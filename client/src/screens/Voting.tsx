import { useState } from 'react';
import { useRoom } from '../socket/RoomProvider';
import { AppBar } from '../components/AppBar';
import { Avatar } from '../components/Avatar';
import { HostQuitButton } from '../components/HostQuitButton';
import { HostRestartButton } from '../components/HostRestartButton';

export function Voting() {
  const { roomState, playerId, myRole, submitVote, protectorProtect } = useRoom();
  const [localTarget, setLocalTarget] = useState<string | null>(null);
  const [protectTarget, setProtectTarget] = useState<string | null>(null);

  if (!roomState) return null;

  const alivePlayers = roomState.players.filter((p) => p.alive);
  const me = roomState.players.find((p) => p.playerId === playerId);
  const isHost = me?.isHost ?? false;
  const hasVoted = playerId !== null && roomState.votedPlayerIds.includes(playerId);
  const locked = hasVoted || localTarget !== null;
  const isProtector = myRole?.role === 'protector';

  function castVote(targetId: string) {
    if (locked) return;
    setLocalTarget(targetId);
    submitVote(targetId);
  }

  function protect(targetId: string) {
    if (protectTarget) return;
    setProtectTarget(targetId);
    protectorProtect(targetId);
  }

  return (
    <div className="screen">
      <AppBar
        title="Vote"
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
          <div className="vote-banner frame-cut">
            <div className="vote-banner__text">
              <div className="eyebrow">Vote en cours</div>
              <div className="vote-banner__title">Qui est suspect ?</div>
              <div className="vote-banner__sub">Vote secret, aucun minuteur — la cible ne sera connue qu'au dépouillement</div>
            </div>
          </div>

          {isProtector && (
            <div className="vote-banner frame-cut frame-cut--sm" style={{ marginTop: 'var(--space-4)' }}>
              <div className="vote-banner__text">
                <div className="eyebrow">Capacité — Protecteur</div>
                <div className="vote-banner__sub">
                  {protectTarget
                    ? 'Protection envoyée pour ce round — capacité désormais utilisée pour toute la partie.'
                    : "Une seule fois par partie : protège un joueur. S'il est la cible du vote majoritaire, personne n'est éliminé."}
                </div>
              </div>
            </div>
          )}

          <div className={`confirm-banner${locked ? ' is-visible' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
              <path d="M7.5 12.5 L10.5 15.5 L16.5 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Tu as voté. En attente des autres joueurs…</span>
          </div>

          <div className="vote-progress">
            <div className="vote-progress__dots" aria-hidden="true">
              {alivePlayers.map((p) => (
                <span
                  key={p.playerId}
                  className={`vote-progress__dot${roomState.votedPlayerIds.includes(p.playerId) ? ' vote-progress__dot--filled' : ''}`}
                />
              ))}
            </div>
            <span className="vote-progress__label">
              {roomState.votedPlayerIds.length} / {alivePlayers.length} ont voté
            </span>
          </div>

          <section aria-labelledby="vote-title">
            <div className="panel" style={{ padding: '0 var(--space-4)' }}>
              {me && (
                <div className="vote-row vote-row--self">
                  <Avatar seed={me.avatarSeed} name={me.name} />
                  <div className="vote-row__body">
                    <div className="vote-row__name">{me.name}</div>
                    <div className={`vote-row__status vote-row__status--${locked ? 'voted' : 'pending'}`}>
                      {locked ? "C'est toi — vote enregistré" : "C'est toi — tu n'as pas encore voté"}
                    </div>
                  </div>
                </div>
              )}

              {alivePlayers
                .filter((p) => p.playerId !== playerId)
                .map((p) => {
                  const voted = roomState.votedPlayerIds.includes(p.playerId);
                  const selected = localTarget === p.playerId;
                  return (
                    <div className="vote-row" key={p.playerId}>
                      <Avatar seed={p.avatarSeed} name={p.name} />
                      <div className="vote-row__body">
                        <div className="vote-row__name">{p.name}</div>
                        <div className={`vote-row__status vote-row__status--${voted ? 'voted' : 'pending'}`}>
                          {voted ? (
                            <>
                              <svg viewBox="0 0 24 24" fill="none">
                                <path d="M5 12.5 L9.5 17 L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                              A voté
                            </>
                          ) : (
                            'En attente de son vote'
                          )}
                        </div>
                      </div>
                      <button
                        className={`vote-btn${selected ? ' vote-btn--selected' : ''}`}
                        type="button"
                        disabled={locked}
                        onClick={() => castVote(p.playerId)}
                      >
                        {selected ? 'Voté' : 'Voter'}
                      </button>
                      {isProtector && (
                        <button
                          className={`vote-btn vote-btn--protect${protectTarget === p.playerId ? ' vote-btn--selected' : ''}`}
                          type="button"
                          disabled={protectTarget !== null}
                          onClick={() => protect(p.playerId)}
                        >
                          {protectTarget === p.playerId ? 'Protégé' : 'Protéger'}
                        </button>
                      )}
                    </div>
                  );
                })}
            </div>
          </section>

          <p className="text-low text-center" style={{ fontSize: 'var(--text-xs)', marginTop: 'var(--space-5)' }}>
            Tu peux voter une seule fois. Ton choix reste secret jusqu'au dépouillement.
          </p>
        </div>
      </main>
    </div>
  );
}

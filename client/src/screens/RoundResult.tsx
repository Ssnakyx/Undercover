import type { CSSProperties } from 'react';
import { useRoom } from '../socket/RoomProvider';
import { AppBar } from '../components/AppBar';
import { ActionBar } from '../components/ActionBar';
import { Avatar } from '../components/Avatar';
import { RoleEmblem, roleLabel } from '../components/RoleBadge';
import { HostQuitButton } from '../components/HostQuitButton';
import { HostRestartButton } from '../components/HostRestartButton';
import { avatarColors } from '../lib/avatar';

const SHARD_COUNT = 6;

// "L'hexagone du joueur se fend en six éclats qui s'écartent et s'éteignent" — voir
// design/Cover - Nouveau design (1e). Calculé une fois au montage (pas de rng), chaque éclat
// hérite du dégradé de l'avatar du joueur éliminé pour rester identifiable en s'évanouissant.
function ShatteringAvatar({ seed, name }: { seed: string; name: string }) {
  const { c1, c2 } = avatarColors(seed);
  return (
    <div className="elim-shatter">
      {Array.from({ length: SHARD_COUNT }, (_, i) => {
        const angle = (i / SHARD_COUNT) * Math.PI * 2 + 0.4;
        const dist = 46 + (i % 3) * 6;
        const style = {
          '--dx': `${Math.round(Math.cos(angle) * dist)}px`,
          '--dy': `${Math.round(Math.sin(angle) * dist)}px`,
          '--rot': `${Math.round(Math.cos(angle) * 40)}deg`,
          animationDelay: `${i * 45}ms`,
          background: `linear-gradient(160deg, ${c1}, ${c2})`,
        } as CSSProperties;
        return <span key={i} className="elim-shard" style={style} aria-hidden="true" />;
      })}
      <Avatar seed={seed} name={name} size="lg" className="elim-shatter__avatar" />
    </div>
  );
}

export function RoundResult() {
  const { roomState, playerId, lastRoundResult, continueRound } = useRoom();

  if (!roomState || !lastRoundResult) return null;

  const me = roomState.players.find((p) => p.playerId === playerId);
  const isHost = me?.isHost ?? false;
  const {
    eliminatedPlayerId,
    eliminatedRole,
    eliminatedChampion,
    voteCounts,
    tie,
    protectedThisRound,
    hunterDeclined,
    chainEliminatedPlayerId,
    chainEliminatedRole,
    chainEliminatedChampion,
  } = lastRoundResult;
  const eliminated = eliminatedPlayerId ? roomState.players.find((p) => p.playerId === eliminatedPlayerId) : null;
  const chainEliminated = chainEliminatedPlayerId
    ? roomState.players.find((p) => p.playerId === chainEliminatedPlayerId)
    : null;

  const totalVotes = Object.values(voteCounts).reduce((a, b) => a + b, 0);
  const eliminatedVotes = eliminatedPlayerId ? voteCounts[eliminatedPlayerId] ?? 0 : 0;
  const maxVotes = Math.max(1, ...Object.values(voteCounts));
  const rows = Object.entries(voteCounts).sort(([, a], [, b]) => b - a);

  const aliveCount = roomState.players.filter((p) => p.alive).length;

  return (
    <div className="screen">
      <AppBar
        title="Résultat"
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
            {protectedThisRound ? (
              <>
                <span className="eyebrow">Protection</span>
                <div className="eliminated-block__name">Le Protecteur a sauvé la mise — personne n'est éliminé ce round</div>
              </>
            ) : hunterDeclined ? (
              <>
                <span className="eyebrow">Chasseur</span>
                <div className="eliminated-block__name">Le Chasseur n'a tiré sur personne</div>
              </>
            ) : tie || !eliminated ? (
              <>
                <span className="eyebrow">Égalité</span>
                <div className="eliminated-block__name">Personne n'est éliminé ce round</div>
              </>
            ) : (
              <>
                <span className="eyebrow">Éliminé ce round</span>
                <ShatteringAvatar seed={eliminated.avatarSeed} name={eliminated.name} />
                <div className="eliminated-block__name eliminated-block__name--struck">{eliminated.name}</div>
                <div className="eliminated-block__votes">
                  {eliminatedVotes} vote{eliminatedVotes > 1 ? 's' : ''} sur {totalVotes}
                </div>

                {eliminatedRole && (
                  <div className={`role-reveal role-reveal--${eliminatedRole} role-reveal--delayed frame-cut`}>
                    <RoleEmblem role={eliminatedRole} className="role-reveal__emblem" />
                    <div>
                      <div className="role-reveal__eyebrow">Était {roleLabel(eliminatedRole)}</div>
                      {eliminatedRole !== 'mrwhite' && eliminatedRole !== 'jester' && (
                        <div
                          className={`role-reveal__champion${eliminatedChampion ? '' : ' text-low'}`}
                          style={eliminatedChampion ? undefined : { fontSize: 'var(--text-sm)', textTransform: 'none' }}
                        >
                          {eliminatedChampion ?? 'Champion non révélé'}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {chainEliminated && chainEliminatedRole && (
            <div className="eliminated-block frame-cut frame-cut--lg" style={{ marginTop: 'var(--space-4)' }}>
              <span className="eyebrow">💘 Mort·e de chagrin</span>
              <ShatteringAvatar seed={chainEliminated.avatarSeed} name={chainEliminated.name} />
              <div className="eliminated-block__name eliminated-block__name--struck">{chainEliminated.name}</div>
              <div className={`role-reveal role-reveal--${chainEliminatedRole} role-reveal--delayed frame-cut`}>
                <RoleEmblem role={chainEliminatedRole} className="role-reveal__emblem" />
                <div>
                  <div className="role-reveal__eyebrow">Était {roleLabel(chainEliminatedRole)}</div>
                  {chainEliminatedRole !== 'mrwhite' && chainEliminatedRole !== 'jester' && (
                    <div
                      className={`role-reveal__champion${chainEliminatedChampion ? '' : ' text-low'}`}
                      style={chainEliminatedChampion ? undefined : { fontSize: 'var(--text-sm)', textTransform: 'none' }}
                    >
                      {chainEliminatedChampion ?? 'Champion non révélé'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {rows.length > 0 && (
            <section aria-labelledby="breakdown-title">
              <div className="section-title">
                <h2 id="breakdown-title" className="font-display">
                  Décompte des votes
                </h2>
              </div>
              <div className="panel" style={{ padding: 'var(--space-2) var(--space-4)' }}>
                {rows.map(([pid, count]) => {
                  const p = roomState.players.find((pl) => pl.playerId === pid);
                  const isElim = pid === eliminatedPlayerId && !tie;
                  return (
                    <div className={`vote-list__row${isElim ? ' vote-list__row--eliminated' : ''}`} key={pid}>
                      <span className="vote-list__name">{p?.name ?? '?'}</span>
                      <div className={`vote-bar-row${isElim ? ' vote-bar-row--eliminated' : ''}`} style={{ flex: 1 }}>
                        <div className="vote-bar-row__track">
                          <div className="vote-bar-row__fill" style={{ width: `${(count / maxVotes) * 100}%` }} />
                        </div>
                        <span className="vote-bar-row__count">{count}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <p className="round-note">
            {aliveCount} joueur{aliveCount > 1 ? 's' : ''} restent en lice.
            <br />
            La partie continue.
          </p>
        </div>
      </main>

      <ActionBar>
        <button className="btn btn-primary" type="button" disabled={!isHost} onClick={continueRound}>
          Manche suivante
        </button>
        <span className="confirm-hint">Seul l'hôte peut lancer la manche suivante</span>
      </ActionBar>
    </div>
  );
}

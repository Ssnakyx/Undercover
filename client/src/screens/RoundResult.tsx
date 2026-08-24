import { useRoom } from '../socket/RoomProvider';
import { AppBar } from '../components/AppBar';
import { ActionBar } from '../components/ActionBar';
import { Avatar } from '../components/Avatar';
import { RoleEmblem, roleLabel } from '../components/RoleBadge';

export function RoundResult() {
  const { roomState, playerId, lastRoundResult, continueRound } = useRoom();

  if (!roomState || !lastRoundResult) return null;

  const me = roomState.players.find((p) => p.playerId === playerId);
  const isHost = me?.isHost ?? false;
  const { eliminatedPlayerId, eliminatedRole, eliminatedChampion } = lastRoundResult;
  const eliminated = roomState.players.find((p) => p.playerId === eliminatedPlayerId);

  const aliveCount = roomState.players.filter((p) => p.alive).length;

  return (
    <div className="screen">
      <AppBar title="Résultat" right={<span className="badge badge--muted">Round {roomState.round}</span>} />

      <main className="main">
        <div className="container">
          <div className="eliminated-block frame-cut frame-cut--lg">
            <span className="eyebrow">Éliminé par l'hôte</span>
            {eliminated && (
              <>
                <Avatar seed={eliminated.avatarSeed} name={eliminated.name} size="lg" />
                <div className="eliminated-block__name">{eliminated.name}</div>
              </>
            )}

            <div className={`role-reveal role-reveal--${eliminatedRole} frame-cut`}>
              <RoleEmblem role={eliminatedRole} className="role-reveal__emblem" />
              <div>
                <div className="role-reveal__eyebrow">Était {roleLabel(eliminatedRole)}</div>
                {eliminatedRole !== 'mrwhite' && (
                  <div
                    className={`role-reveal__champion${eliminatedChampion ? '' : ' text-low'}`}
                    style={eliminatedChampion ? undefined : { fontSize: 'var(--text-sm)', textTransform: 'none' }}
                  >
                    {eliminatedChampion ?? 'Champion non révélé'}
                  </div>
                )}
              </div>
            </div>
          </div>

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

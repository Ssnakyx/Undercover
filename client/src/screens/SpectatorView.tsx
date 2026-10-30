import { useNavigate } from 'react-router-dom';
import { useRoom } from '../socket/RoomProvider';
import { AppBar } from '../components/AppBar';
import { ActionBar } from '../components/ActionBar';
import { Avatar } from '../components/Avatar';
import type { GamePhase } from '../types';

// Écran unique pour tout spectateur, quelle que soit la phase : un spectateur n'a jamais de
// rôle et ne peut pas agir. Il devient joueur à la prochaine partie lancée par l'hôte.
const PHASE_LABEL: Record<GamePhase, string> = {
  lobby: 'En attente dans le salon',
  reveal: 'Les joueurs découvrent leur rôle',
  discussion: 'Discussion en cours',
  voting: 'Vote en cours',
  round_result: 'Résultat du round',
  mrwhite_guess: 'Mr White tente de deviner',
  hunter_shoot: 'Le Chasseur vise',
  game_over: 'Partie terminée',
  aborted: "Partie interrompue par l'hôte",
};

export function SpectatorView() {
  const { roomState, playerId, leaveRoom } = useRoom();
  const navigate = useNavigate();

  if (!roomState) return null;

  function quit() {
    leaveRoom();
    navigate('/', { replace: true });
  }

  return (
    <div className="screen" data-universe={roomState.universe}>
      <AppBar title="Spectateur" right={<span className="badge badge--accent">Round {Math.max(1, roomState.round)}</span>} />

      <main className="main">
        <div className="container">
          <div className="hud-frame phase-banner">
            <div className="phase-banner__text">
              <div className="eyebrow">👁 Mode spectateur</div>
              <div className="phase-banner__title">{PHASE_LABEL[roomState.phase] ?? roomState.phase}</div>
              <div className="phase-banner__sub">Tu rejoindras la prochaine partie automatiquement.</div>
            </div>
          </div>

          <section className="section">
            <div className="section__head">
              <h2 className="section__title">Joueurs</h2>
              <span className="section__count">{roomState.players.filter((p) => p.alive).length} en lice</span>
            </div>
            <div className="player-grid">
              {roomState.players.map((p) => (
                <div key={p.playerId} className={`player-tile${p.alive ? '' : ' player-tile--dead'}${p.connected ? '' : ' player-tile--offline'}`}>
                  <Avatar seed={p.avatarSeed} name={p.name} host={p.isHost} dead={!p.alive} />
                  <div className="player-tile__body">
                    <div className="player-tile__name">{p.name}</div>
                    <div className="player-tile__meta">{p.alive ? (roomState.votedPlayerIds.includes(p.playerId) ? 'A voté' : 'En jeu') : 'Éliminé'}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {roomState.spectators.length > 1 && (
            <section className="section">
              <div className="section__head">
                <h2 className="section__title">Autres spectateurs</h2>
              </div>
              <div className="player-grid">
                {roomState.spectators
                  .filter((s) => s.playerId !== playerId)
                  .map((s) => (
                    <div key={s.playerId} className="player-tile">
                      <Avatar seed={s.avatarSeed} name={s.name} size="sm" />
                      <div className="player-tile__name">{s.name}</div>
                    </div>
                  ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <ActionBar>
        <button className="btn btn-ghost" type="button" onClick={quit}>
          Quitter
        </button>
      </ActionBar>
    </div>
  );
}

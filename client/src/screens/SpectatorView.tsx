import { useNavigate } from 'react-router-dom';
import { useRoom } from '../socket/RoomProvider';
import { AppBar } from '../components/AppBar';
import { ActionBar } from '../components/ActionBar';
import { Avatar } from '../components/Avatar';
import type { GamePhase } from '../types';

// Écran unique pour tout spectateur, quelle que soit la phase (voir CONTRACT.md §5bis) : un
// spectateur n'a jamais de rôle privé et ne peut jamais agir (vote, protect, etc. — le
// serveur les rejette de toute façon puisqu'il ne figure jamais dans room.players), donc
// réutiliser les écrans interactifs normaux serait trompeur. Une vue de lecture seule
// commune est plus fidèle à "regarder sans participer" qu'un rendu phase par phase.
const PHASE_LABEL: Record<GamePhase, string> = {
  lobby: 'En attente dans le lobby',
  reveal: 'Les joueurs découvrent leur rôle',
  discussion: 'Discussion en cours',
  voting: 'Vote en cours',
  round_result: 'Résultat du round',
  mrwhite_guess: 'Mr White tente de deviner',
  hunter_shoot: 'Le Chasseur tire',
  game_over: 'Partie terminée',
  aborted: 'Partie interrompue par l\'hôte',
};

export function SpectatorView() {
  const { roomState, playerId, leaveRoom } = useRoom();
  const navigate = useNavigate();

  if (!roomState) return null;

  function quit() {
    leaveRoom();
    navigate('/', { replace: true, viewTransition: true });
  }

  return (
    <div className="screen">
      <AppBar title="Spectateur" right={<span className="badge badge--muted">Round {roomState.round}</span>} />

      <main className="main">
        <div className="container">
          <div className="vote-banner frame-cut">
            <div className="vote-banner__text">
              <div className="eyebrow">👁 Mode spectateur</div>
              <div className="vote-banner__title">{PHASE_LABEL[roomState.phase] ?? roomState.phase}</div>
              <div className="vote-banner__sub">
                Tu regardes cette partie sans y participer. Tu rejoindras automatiquement en tant que joueur à la
                prochaine partie lancée par l'hôte.
              </div>
            </div>
          </div>

          <section aria-labelledby="spectator-players-title" className="mt-6">
            <div className="section-title">
              <h2 id="spectator-players-title" className="font-display">
                Joueurs
              </h2>
              <span className="count">{roomState.players.length}</span>
            </div>
            <div className="panel" style={{ padding: '0 var(--space-5)' }}>
              {roomState.players.map((p) => (
                <div
                  key={p.playerId}
                  className={`player-row${p.alive ? '' : ' player-row--eliminated'}${p.connected ? '' : ' player-row--offline'}`}
                >
                  <Avatar seed={p.avatarSeed} name={p.name} host={p.isHost} />
                  <div>
                    <div className="player-row__name">{p.name}</div>
                    <div className="player-row__meta">
                      {p.isHost ? 'Hôte' : p.alive ? (p.connected ? 'Connecté' : 'Déconnecté') : 'Éliminé'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {roomState.spectators.length > 1 && (
            <section aria-labelledby="spectator-others-title" className="mt-6">
              <div className="section-title">
                <h2 id="spectator-others-title" className="font-display">
                  Autres spectateurs
                </h2>
                <span className="count">{roomState.spectators.length - 1}</span>
              </div>
              <div className="panel" style={{ padding: '0 var(--space-5)' }}>
                {roomState.spectators
                  .filter((s) => s.playerId !== playerId)
                  .map((s) => (
                    <div key={s.playerId} className="player-row">
                      <Avatar seed={s.avatarSeed} name={s.name} />
                      <div className="player-row__name">{s.name}</div>
                    </div>
                  ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <ActionBar>
        <button className="btn btn-secondary" type="button" onClick={quit}>
          Quitter
        </button>
      </ActionBar>
    </div>
  );
}

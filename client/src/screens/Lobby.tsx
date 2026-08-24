import { useRoom } from '../socket/RoomProvider';
import { Avatar } from '../components/Avatar';
import { AppBar } from '../components/AppBar';
import { ActionBar } from '../components/ActionBar';
import { computeRoleCounts, isMrWhiteAvailable } from '../lib/roles';

export function Lobby() {
  const { roomState, playerId, updateSettings, startGame } = useRoom();

  if (!roomState) return null;

  const me = roomState.players.find((p) => p.playerId === playerId);
  const isHost = me?.isHost ?? false;
  const host = roomState.players.find((p) => p.isHost);
  const n = roomState.players.length;
  const counts = computeRoleCounts(n, roomState.settings.mrWhiteEnabled);
  const mrWhiteAvailable = isMrWhiteAvailable(n);
  const canStart = isHost && n >= 3;

  function copyCode() {
    navigator.clipboard?.writeText(roomState!.roomCode).catch(() => {});
  }

  return (
    <div className="screen">
      <AppBar
        title="Lobby"
        right={
          <span className="badge badge--host">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M4 18 L6 8 L10 13 L12 6 L14 13 L18 8 L20 18 Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            </svg>
            Hôte : {host?.name ?? '—'}
          </span>
        }
      />

      <main className="main">
        <div className="container">
          <div className="code-share frame-cut">
            <div>
              <div className="code-share__label">Code de la room</div>
              <div className="room-code" aria-label={`Code de room : ${roomState.roomCode.split('').join(' ')}`}>
                {roomState.roomCode.split('').map((c, i) => (
                  <span className="room-code__char" key={i}>
                    {c}
                  </span>
                ))}
              </div>
            </div>
            <button className="icon-btn" type="button" aria-label="Copier le code de la room" onClick={copyCode}>
              <svg className="icon" viewBox="0 0 24 24" fill="none">
                <rect x="8" y="8" width="12" height="12" rx="1" stroke="currentColor" strokeWidth="1.8" />
                <path d="M5 16V5 h11" stroke="currentColor" strokeWidth="1.8" fill="none" />
              </svg>
            </button>
          </div>

          <section aria-labelledby="players-title">
            <div className="section-title">
              <h2 id="players-title" className="font-display">
                Joueurs
              </h2>
              <span className="count">{n} / 12</span>
            </div>
            <div className="panel" style={{ padding: '0 var(--space-5)' }}>
              {roomState.players.map((p) => (
                <div key={p.playerId} className={`player-row${p.connected ? '' : ' player-row--offline'}`}>
                  <Avatar seed={p.avatarSeed} name={p.name} host={p.isHost} />
                  <div>
                    <div className="player-row__name">{p.name}</div>
                    <div className="player-row__meta">
                      {p.isHost ? 'Hôte' : p.connected ? 'Connecté' : 'Déconnecté — retour possible 3 min'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section aria-labelledby="settings-title" className="mt-6">
            <div className="section-title">
              <h2 id="settings-title" className="font-display">
                Réglages de la partie
              </h2>
            </div>
            <div className="panel">
              <div className="setting-row setting-row--stat">
                <span className="field__label" style={{ margin: 0 }}>
                  Répartition (auto — {n} joueur{n > 1 ? 's' : ''})
                </span>
                <div className="distribution">
                  <span className="badge badge--civil">{counts.civils} Civils</span>
                  <span className="badge badge--undercover">{counts.undercover} Undercover</span>
                  {counts.mrWhite > 0 && <span className="badge badge--mrwhite">1 Mr White</span>}
                </div>
              </div>

              <div className="setting-row">
                <label className="switch" htmlFor="toggle-mrwhite">
                  <input
                    type="checkbox"
                    id="toggle-mrwhite"
                    checked={roomState.settings.mrWhiteEnabled}
                    disabled={!isHost || !mrWhiteAvailable}
                    onChange={(e) => updateSettings({ mrWhiteEnabled: e.target.checked })}
                  />
                  <span className="switch__track" />
                  <span className="switch__label">
                    <span className="switch__label-title">Mr White</span>
                    <span className="switch__label-hint">
                      {mrWhiteAvailable ? 'Un joueur ne connaît aucun champion — il doit bluffer' : 'Indisponible à moins de 5 joueurs'}
                    </span>
                  </span>
                </label>
              </div>

              <div className="setting-row">
                <label className="switch" htmlFor="toggle-reveal">
                  <input
                    type="checkbox"
                    id="toggle-reveal"
                    checked={roomState.settings.revealChampionOnElimination}
                    disabled={!isHost}
                    onChange={(e) => updateSettings({ revealChampionOnElimination: e.target.checked })}
                  />
                  <span className="switch__track" />
                  <span className="switch__label">
                    <span className="switch__label-title">Révéler le champion à l'élimination</span>
                    <span className="switch__label-hint">Sinon, seul le rôle du joueur éliminé est annoncé</span>
                  </span>
                </label>
              </div>
            </div>
          </section>
        </div>
      </main>

      <ActionBar>
        {isHost ? (
          <>
            <button className="btn btn-primary" type="button" disabled={!canStart} onClick={startGame}>
              Lancer la partie
            </button>
            <span className="confirm-hint">
              {n} joueur{n > 1 ? 's' : ''} {canStart ? 'prêts' : '— minimum 3 pour lancer'} — répartition {counts.civils} Civils /{' '}
              {counts.undercover} Undercover{counts.mrWhite > 0 ? ' / 1 Mr White' : ''}
            </span>
          </>
        ) : (
          <button className="btn btn-secondary" type="button" disabled>
            En attente de l'hôte…
          </button>
        )}
      </ActionBar>
    </div>
  );
}

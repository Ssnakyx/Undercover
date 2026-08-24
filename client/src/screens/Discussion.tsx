import { useRoom } from '../socket/RoomProvider';
import { AppBar } from '../components/AppBar';
import { ActionBar } from '../components/ActionBar';
import { Avatar } from '../components/Avatar';
import { HostQuitButton } from '../components/HostQuitButton';

// Pas de saisie d'indice, pas de minuteur (cf. CONTRACT.md §3) : cet écran affiche uniquement
// l'ordre de passage à titre indicatif. Les joueurs décrivent leur champion à voix haute, hors
// app, dans cet ordre. L'hôte seul décide quand passer au vote.
export function Discussion() {
  const { roomState, playerId, startVoting } = useRoom();

  if (!roomState) return null;

  const me = roomState.players.find((p) => p.playerId === playerId);
  const isHost = me?.isHost ?? false;

  function nameOf(id: string) {
    return roomState!.players.find((p) => p.playerId === id);
  }

  return (
    <div className="screen">
      <AppBar
        title="Discussion"
        right={
          <>
            {isHost && <HostQuitButton />}
            <span className="badge badge--muted">Round {roomState.round}</span>
          </>
        }
      />

      <main className="main">
        <div className="container">
          <div className="turn-banner frame-cut">
            <div className="turn-banner__text">
              <div className="eyebrow">Ordre de passage</div>
              <div className="turn-banner__who">Décrivez votre champion à voix haute</div>
              <div className="turn-banner__sub">Aucun minuteur — prenez le temps qu'il faut, dans cet ordre</div>
            </div>
          </div>

          <section aria-labelledby="turn-title">
            <div className="section-title">
              <h2 id="turn-title" className="font-display">
                Joueurs
              </h2>
              <span className="count">{roomState.turnOrder.length}</span>
            </div>

            <div className="panel" style={{ padding: '0 var(--space-4)' }}>
              {roomState.turnOrder.map((id, i) => {
                const p = nameOf(id);
                return (
                  <div className="turn-order__item" key={id}>
                    <span className="turn-order__index">{i + 1}</span>
                    <div className="turn-order__body" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      {p && <Avatar seed={p.avatarSeed} name={p.name} />}
                      <div className="turn-order__name">{p?.name ?? '?'}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </main>

      <ActionBar>
        {isHost ? (
          <>
            <button className="btn btn-primary" type="button" onClick={startVoting}>
              Passer au vote
            </button>
            <span className="confirm-hint">À lancer une fois la discussion terminée</span>
          </>
        ) : (
          <div className="waiting-note panel">En attente que l'hôte lance le vote…</div>
        )}
      </ActionBar>
    </div>
  );
}

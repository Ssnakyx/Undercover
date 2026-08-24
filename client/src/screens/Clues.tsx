import { useState, type FormEvent } from 'react';
import { useRoom } from '../socket/RoomProvider';
import { AppBar } from '../components/AppBar';
import { ActionBar } from '../components/ActionBar';
import { Avatar } from '../components/Avatar';

const MAX_LEN = 60;

export function Clues() {
  const { roomState, playerId, submitClue, eliminatePlayer } = useRoom();
  const [text, setText] = useState('');

  if (!roomState) return null;

  const isMyTurn = roomState.currentTurnPlayerId === playerId;
  const cluesComplete = roomState.currentTurnPlayerId === null;
  const currentPlayer = roomState.players.find((p) => p.playerId === roomState.currentTurnPlayerId);
  const doneCount = roomState.clues.length;
  const me = roomState.players.find((p) => p.playerId === playerId);
  const isHost = me?.isHost ?? false;
  const alivePlayers = roomState.players.filter((p) => p.alive);

  function nameOf(id: string): string {
    return roomState!.players.find((p) => p.playerId === id)?.name ?? '?';
  }
  function clueOf(id: string): string | undefined {
    return roomState!.clues.find((c) => c.playerId === id)?.text;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    submitClue(trimmed);
    setText('');
  }

  function handleEliminate(name: string, targetId: string) {
    if (!window.confirm(`Éliminer ${name} ? Cette action est irréversible.`)) return;
    eliminatePlayer(targetId);
  }

  return (
    <div className="screen">
      <AppBar title="Indices" right={<span className="badge badge--muted">Round {roomState.round}</span>} />

      <main className="main">
        <div className="container">
          <div className="turn-banner frame-cut">
            <div className="turn-banner__text">
              <div className="eyebrow">{cluesComplete ? 'Tour des indices terminé' : 'Au tour de'}</div>
              <div className="turn-banner__who">{cluesComplete ? 'Place à la discussion' : currentPlayer?.name ?? '—'}</div>
              <div className="turn-banner__sub">
                {cluesComplete
                  ? "Aucun minuteur — discutez à voix haute, puis l'hôte élimine un joueur."
                  : 'Un indice court, sans jamais citer le nom du champion. Aucun minuteur.'}
              </div>
            </div>
          </div>

          <section aria-labelledby="turn-title">
            <div className="section-title">
              <h2 id="turn-title" className="font-display">
                Ordre de passage
              </h2>
              <span className="count">
                {doneCount} / {roomState.turnOrder.length}
              </span>
            </div>

            <div className="panel" style={{ padding: '0 var(--space-4)' }}>
              {roomState.turnOrder.map((id, i) => {
                const clue = clueOf(id);
                const isActive = id === roomState.currentTurnPlayerId;
                const isDone = clue !== undefined;
                const stateClass = isDone ? ' turn-order__item--done' : isActive ? ' turn-order__item--active pulse' : '';
                return (
                  <div key={id} className={`turn-order__item${stateClass}`}>
                    <span className="turn-order__index">{isDone ? '✓' : isActive ? '●' : i + 1}</span>
                    <div className="turn-order__body">
                      <div className={`turn-order__name${isDone || isActive ? '' : ' text-mid'}`}>{nameOf(id)}</div>
                      {isDone && <div className="turn-order__clue">{clue}</div>}
                      {isActive && <div className="turn-order__waiting">Est en train de réfléchir…</div>}
                      {!isDone && !isActive && <div className="turn-order__waiting">En attente</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {cluesComplete && isHost && (
            <section aria-labelledby="eliminate-title" className="mt-6">
              <div className="section-title">
                <h2 id="eliminate-title" className="font-display">
                  Qui élimines-tu ?
                </h2>
              </div>
              <div className="panel" style={{ padding: '0 var(--space-4)' }}>
                {alivePlayers.map((p) => (
                  <div className="vote-row" key={p.playerId}>
                    <Avatar seed={p.avatarSeed} name={p.name} />
                    <div className="vote-row__body">
                      <div className="vote-row__name">{p.name}</div>
                    </div>
                    <button className="vote-btn" type="button" onClick={() => handleEliminate(p.name, p.playerId)}>
                      Éliminer
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      {!cluesComplete && (
        <ActionBar>
          {isMyTurn ? (
            <form className="clue-form" onSubmit={handleSubmit}>
              <div className="clue-form__row">
                <input
                  className="input"
                  type="text"
                  maxLength={MAX_LEN}
                  placeholder="Ton indice (ex. « Grand, lourd, indestructible »)"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  autoFocus
                />
                <button className="btn btn-primary" type="submit" style={{ width: 'auto', paddingInline: 'var(--space-5)' }} disabled={!text.trim()}>
                  Envoyer
                </button>
              </div>
              <span className="char-counter">
                {text.length} / {MAX_LEN}
              </span>
            </form>
          ) : (
            <div className="waiting-note panel">En attente de l'indice de {currentPlayer?.name ?? '…'}…</div>
          )}
        </ActionBar>
      )}

      {cluesComplete && !isHost && (
        <ActionBar>
          <div className="waiting-note panel">En attente que l'hôte élimine un joueur…</div>
        </ActionBar>
      )}
    </div>
  );
}

import { useState, type FormEvent } from 'react';
import { useRoom } from '../socket/RoomProvider';
import { AppBar } from '../components/AppBar';
import { ActionBar } from '../components/ActionBar';
import { Avatar } from '../components/Avatar';
import { RoleEmblem } from '../components/RoleBadge';

// Pas de maquette dédiée pour cette phase (absente de /design) — réutilise la
// grammaire visuelle de round_result (eliminated-block + role-reveal), voir
// docs/CONTRACT.md §3. Décision documentée dans client/README.md.
export function MrWhiteGuess() {
  const { roomState, playerId, lastRoundResult, submitGuess } = useRoom();
  const [guess, setGuess] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!roomState) return null;

  const eliminatedId = lastRoundResult?.eliminatedPlayerId ?? null;
  const eliminated = eliminatedId ? roomState.players.find((p) => p.playerId === eliminatedId) : null;
  const isGuesser = eliminatedId !== null && eliminatedId === playerId;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = guess.trim();
    if (!trimmed) return;
    submitGuess(trimmed);
    setSubmitted(true);
  }

  return (
    <div className="screen">
      <AppBar title="Devinette de Mr White" right={<span className="badge badge--muted">Round {roomState.round}</span>} />

      <main className="main">
        <div className="container">
          <div className="eliminated-block frame-cut frame-cut--lg">
            <span className="eyebrow">Mr White a été démasqué</span>
            {eliminated && <Avatar seed={eliminated.avatarSeed} name={eliminated.name} size="lg" />}
            <div className="eliminated-block__name">{eliminated?.name ?? 'Mr White'}</div>

            <div className="role-reveal role-reveal--mrwhite frame-cut">
              <RoleEmblem role="mrwhite" className="role-reveal__emblem" />
              <div>
                <div className="role-reveal__eyebrow">Dernière chance</div>
                <div className="role-reveal__champion" style={{ textTransform: 'none', fontSize: 'var(--text-base)' }}>
                  Une devinette correcte du champion des civils lui offre la victoire immédiate.
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {isGuesser ? (
        <ActionBar>
          <form className="clue-form" onSubmit={handleSubmit}>
            <div className="clue-form__row">
              <input
                className="input"
                type="text"
                placeholder="Nom du champion des civils"
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                disabled={submitted}
                autoFocus
              />
              <button
                className="btn btn-primary"
                type="submit"
                style={{ width: 'auto', paddingInline: 'var(--space-5)' }}
                disabled={!guess.trim() || submitted}
              >
                Deviner
              </button>
            </div>
          </form>
          <span className="confirm-hint">{submitted ? 'Devinette envoyée — en attente du résultat…' : 'Une seule tentative.'}</span>
        </ActionBar>
      ) : (
        <ActionBar>
          <div className="waiting-note panel">En attente de la devinette de {eliminated?.name ?? 'Mr White'}…</div>
        </ActionBar>
      )}
    </div>
  );
}

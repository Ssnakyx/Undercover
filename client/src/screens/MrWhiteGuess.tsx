import { useState, type FormEvent } from 'react';
import { useRoom } from '../socket/RoomProvider';
import { GameHud } from '../components/GameHud';
import { ActionBar } from '../components/ActionBar';
import { Avatar } from '../components/Avatar';
import { Countdown } from '../components/Countdown';
import { RoleEmblem } from '../components/RoleBadge';
import { universeCopy } from '../lib/universe';

const GUESS_TOTAL_MS = 30_000; // miroir de server/src/game/engine.ts#MRWHITE_GUESS_TIMEOUT_MS

export function MrWhiteGuess() {
  const { roomState, playerId, submitGuess } = useRoom();
  const [guess, setGuess] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!roomState) return null;

  // Le devineur vient de l'état public (et non plus du dernier round:result, qu'un départ de
  // joueur pouvait écraser et faire disparaître ce formulaire).
  const guesserId = roomState.mrWhiteGuessPlayerId;
  const guesser = roomState.players.find((p) => p.playerId === guesserId);
  const isGuesser = !!guesserId && guesserId === playerId;
  const unit = universeCopy(roomState.universe).unitLabel;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = guess.trim();
    if (!trimmed) return;
    submitGuess(trimmed);
    setSubmitted(true);
  }

  return (
    <div className="screen" data-universe={roomState.universe}>
      <GameHud title="Dernière chance" />

      <main className="main">
        <div className="container">
          <div className="hud-frame ko-block tone-mrwhite">
            <span className="eyebrow">Mr White démasqué</span>
            <div className="ko-portrait">
              {guesser && <Avatar seed={guesser.avatarSeed} name={guesser.name} size="xl" />}
            </div>
            <div className="ko-name">{guesser?.name ?? 'Mr White'}</div>
            <span className="ko-role" style={{ animationDelay: '0s' }}>
              <RoleEmblem role="mrwhite" /> Mr White
            </span>
            <p className="text-mid">
              S'il devine le {unit} des Civils, il vole la victoire.
            </p>
            <Countdown deadline={roomState.phaseDeadline} totalMs={GUESS_TOTAL_MS} />
          </div>
        </div>
      </main>

      <ActionBar hint={isGuesser ? (submitted ? 'Réponse envoyée…' : 'Une seule tentative. Les fautes de frappe légères sont tolérées.') : undefined}>
        {isGuesser ? (
          <form className="action-bar__row" onSubmit={handleSubmit}>
            <input
              className="input"
              type="text"
              placeholder={`Le ${unit} des Civils`}
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              disabled={submitted}
              autoFocus
              enterKeyHint="go"
              style={{ flex: 2 }}
            />
            <button className="btn btn-primary" type="submit" disabled={!guess.trim() || submitted}>
              Deviner
            </button>
          </form>
        ) : (
          <button className="btn btn-secondary" type="button" disabled>
            {guesser?.name ?? 'Mr White'} réfléchit…
          </button>
        )}
      </ActionBar>
    </div>
  );
}

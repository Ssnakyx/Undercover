import { useState } from 'react';
import { useRoom } from '../socket/RoomProvider';
import { AppBar } from '../components/AppBar';
import { ActionBar } from '../components/ActionBar';
import { HostQuitButton } from '../components/HostQuitButton';
import { universeCopy } from '../lib/universe';

export function Reveal() {
  const { roomState, playerId, myRole, ackReveal } = useRoom();
  const [flipped, setFlipped] = useState(false);
  const [acked, setAcked] = useState(false);

  if (!roomState) return null;

  const isHost = roomState.players.find((p) => p.playerId === playerId)?.isHost ?? false;

  function flip() {
    setFlipped(true);
  }

  function confirm() {
    ackReveal();
    setAcked(true);
  }

  const role = myRole?.role;
  const champion = myRole?.champion;
  const unit = universeCopy(roomState.universe).unitLabel;

  return (
    <div className="screen">
      <AppBar
        title="Révélation"
        right={
          <>
            {isHost && <HostQuitButton />}
            <span className="badge badge--muted">Round {roomState.round}</span>
          </>
        }
      />

      <main className="reveal-main">
        <div className="reveal-intro">
          <span className="eyebrow">Privé — toi seul</span>
          <h1>Personne d'autre ne doit voir cet écran</h1>
        </div>

        <div className="flip-scene">
          <div className={`flip-card${flipped ? ' is-flipped' : ''}`}>
            <div
              className="flip-card__face flip-card__face--front frame-cut frame-cut--lg"
              role="button"
              tabIndex={0}
              aria-pressed={flipped}
              aria-label="Toucher pour révéler ton rôle"
              onClick={flip}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  flip();
                }
              }}
            >
              <svg className="front-crest" viewBox="0 0 40 40" fill="none" aria-hidden="true">
                <polygon className="pulse-ring" points="10,0 30,0 40,20 30,40 10,40 0,20" stroke="currentColor" strokeWidth="1.6" />
                <polygon points="20,9 31,20 20,31 9,20" stroke="currentColor" strokeWidth="1.2" opacity="0.7" />
                <circle cx="20" cy="20" r="2" fill="currentColor" />
              </svg>
              <div className="front-tap-hint">
                <svg viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M12 7 v6 l4 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                Touche la carte pour révéler
              </div>
            </div>

            <div className={`flip-card__face flip-card__face--back frame-cut frame-cut--lg role-face role-face--${role ?? 'civil'}`}>
              {role === 'civil' && (
                <>
                  <span className="role-face__eyebrow">Tu es un Civil</span>
                  <svg className="role-face__emblem" viewBox="0 0 40 40" fill="none" aria-hidden="true">
                    <use href="#role-civil" />
                  </svg>
                  <div className="role-face__champion">{champion}</div>
                  <p className="role-face__instruction">
                    Décris {champion} sans jamais dire son nom. Repère les indices qui sonnent faux — un ou plusieurs joueurs
                    ne connaissent pas exactement le même {unit} que toi.
                  </p>
                </>
              )}
              {role === 'undercover' && (
                <>
                  <span className="role-face__eyebrow">Tu es Undercover</span>
                  <svg className="role-face__emblem" viewBox="0 0 40 40" fill="none" aria-hidden="true">
                    <use href="#role-undercover" />
                  </svg>
                  <div className="role-face__champion">{champion}</div>
                  <p className="role-face__instruction">
                    Décris {champion} sans jamais dire son nom. Les civils ont un {unit} proche du tien — fonds-toi dans la
                    masse sans te faire démasquer.
                  </p>
                  <span className="role-face__secret">Rôle secret — ne le révèle pas.</span>
                </>
              )}
              {role === 'mrwhite' && (
                <>
                  <span className="role-face__eyebrow">Tu es Mr White</span>
                  <svg className="role-face__emblem" viewBox="0 0 40 40" fill="none" aria-hidden="true">
                    <use href="#role-mrwhite" />
                  </svg>
                  <div className="role-face__champion">Bluffe !</div>
                  <p className="role-face__instruction">
                    Tu ne connais aucun {unit}. Écoute les indices des autres et fais semblant d'en connaître un pour ne pas
                    te faire démasquer.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <ActionBar>
        <button className="btn btn-primary" type="button" disabled={!flipped || acked} aria-disabled={!flipped || acked} onClick={confirm}>
          {acked ? 'Rôle confirmé' : "J'ai vu mon rôle"}
        </button>
        <span className="confirm-hint">La partie continue quand tous les joueurs ont confirmé.</span>
      </ActionBar>
    </div>
  );
}

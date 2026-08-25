import { useState } from 'react';
import { useRoom } from '../socket/RoomProvider';
import { AppBar } from '../components/AppBar';
import { ActionBar } from '../components/ActionBar';
import { HostQuitButton } from '../components/HostQuitButton';
import { HostRestartButton } from '../components/HostRestartButton';
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
  const loverName = myRole?.loverName;
  const spyInsight = myRole?.spyInsight;
  const spyTeamLabel: Record<string, string> = {
    civils: 'du camp des Civils',
    undercover: 'Undercover',
    mrwhite: 'Mr White',
    jester: 'le Bouffon',
  };

  return (
    <div className="screen">
      <AppBar
        title="Révélation"
        right={
          <>
            {isHost && <HostRestartButton />}
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
              {role === 'spy' && (
                <>
                  <span className="role-face__eyebrow">Tu es l'Espion</span>
                  <svg className="role-face__emblem" viewBox="0 0 40 40" fill="none" aria-hidden="true">
                    <use href="#role-spy" />
                  </svg>
                  <div className="role-face__champion">{champion}</div>
                  <p className="role-face__instruction">
                    Décris {champion} sans jamais dire son nom, comme un Civil. Tu fais partie du camp des Civils.
                  </p>
                  {spyInsight && (
                    <p className="role-face__instruction role-face__secret">
                      Insight : <strong>{spyInsight.playerName}</strong> fait partie {spyTeamLabel[spyInsight.team] ?? spyInsight.team}.
                    </p>
                  )}
                </>
              )}
              {role === 'protector' && (
                <>
                  <span className="role-face__eyebrow">Tu es le Protecteur</span>
                  <svg className="role-face__emblem" viewBox="0 0 40 40" fill="none" aria-hidden="true">
                    <use href="#role-protector" />
                  </svg>
                  <div className="role-face__champion">{champion}</div>
                  <p className="role-face__instruction">
                    Décris {champion} sans jamais dire son nom, comme un Civil. Une seule fois par partie, pendant le vote,
                    tu peux protéger un joueur : s'il est la cible du vote majoritaire, personne n'est éliminé.
                  </p>
                </>
              )}
              {role === 'ghost' && (
                <>
                  <span className="role-face__eyebrow">Tu es le Revenant</span>
                  <svg className="role-face__emblem" viewBox="0 0 40 40" fill="none" aria-hidden="true">
                    <use href="#role-ghost" />
                  </svg>
                  <div className="role-face__champion">{champion}</div>
                  <p className="role-face__instruction">
                    Décris {champion} sans jamais dire son nom, comme un Civil. Si tu es éliminé, tu pourras encore voter une
                    dernière fois au round suivant avant de sortir définitivement du jeu.
                  </p>
                </>
              )}
              {role === 'hunter' && (
                <>
                  <span className="role-face__eyebrow">Tu es le Chasseur</span>
                  <svg className="role-face__emblem" viewBox="0 0 40 40" fill="none" aria-hidden="true">
                    <use href="#role-hunter" />
                  </svg>
                  <div className="role-face__champion">{champion}</div>
                  <p className="role-face__instruction">
                    Décris {champion} sans jamais dire son nom, comme un Civil. Si tu es éliminé par un vote, tu pourras
                    tirer sur un autre joueur, qui sera éliminé aussi.
                  </p>
                </>
              )}
              {role === 'jester' && (
                <>
                  <span className="role-face__eyebrow">Tu es le Bouffon</span>
                  <svg className="role-face__emblem" viewBox="0 0 40 40" fill="none" aria-hidden="true">
                    <use href="#role-jester" />
                  </svg>
                  <div className="role-face__champion">Fais parler de toi !</div>
                  <p className="role-face__instruction">
                    Tu ne connais aucun {unit} et tu ne fais partie d'aucun camp. Ton seul but : te faire éliminer par un
                    vote direct pour gagner seul.
                  </p>
                </>
              )}
              {loverName && (
                <p className="role-face__instruction role-face__secret">
                  💘 Tu es Amoureux·se de <strong>{loverName}</strong>. Si l'un de vous est éliminé, l'autre meurt de
                  chagrin le même round.
                </p>
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

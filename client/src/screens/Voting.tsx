import { useState } from 'react';
import { useRoom } from '../socket/RoomProvider';
import { GameHud } from '../components/GameHud';
import { ActionBar } from '../components/ActionBar';
import { Avatar } from '../components/Avatar';

// Le Protecteur n'a qu'une protection par partie : on retient ici qu'elle a été utilisée (clé =
// room + distribution de rôles), pour ne plus proposer le mode "Protéger" aux rounds suivants.
const usedProtections = new Set<string>();

export function Voting() {
  const { roomState, playerId, myRole, roleVersion, submitVote, protectorProtect, forceCloseVote } = useRoom();
  const [mode, setMode] = useState<'vote' | 'protect'>('vote');
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [protectSelected, setProtectSelected] = useState<string | null>(null);
  const [, forceRender] = useState(0);

  if (!roomState) return null;

  const me = roomState.players.find((p) => p.playerId === playerId);
  const isHost = me?.isHost ?? false;
  const alivePlayers = roomState.players.filter((p) => p.alive);
  const eligibleIds = new Set([...alivePlayers.map((p) => p.playerId), ...roomState.ghostVoterIds]);
  const isGhostVoter = !!playerId && roomState.ghostVoterIds.includes(playerId);
  const canVote = !!playerId && eligibleIds.has(playerId);
  const hasVoted = (!!playerId && roomState.votedPlayerIds.includes(playerId)) || submitted !== null;
  const protectKey = `${roomState.roomCode}:${roleVersion}`;
  const canProtect = myRole?.role === 'protector' && !!me?.alive && !usedProtections.has(protectKey);
  const votedCount = roomState.votedPlayerIds.length;
  const total = eligibleIds.size;
  const targets = alivePlayers.filter((p) => p.playerId !== playerId);

  function confirmVote() {
    if (!selected || hasVoted) return;
    submitVote(selected);
    setSubmitted(selected);
    navigator.vibrate?.(40);
  }

  function confirmProtect() {
    if (!protectSelected) return;
    protectorProtect(protectSelected);
    usedProtections.add(protectKey);
    setMode('vote');
    forceRender((x) => x + 1);
  }

  function closeVote() {
    if (window.confirm(`Clore le vote maintenant ? (${votedCount}/${total} bulletins)`)) forceCloseVote();
  }

  const protecting = mode === 'protect' && canProtect;
  const current = protecting ? protectSelected : hasVoted ? submitted : selected;

  return (
    <div className="screen" data-universe={roomState.universe}>
      <GameHud title="Vote" />

      <main className="main">
        <div className="container">
          <div className="hud-frame phase-banner">
            <div className="phase-banner__text">
              <div className="eyebrow">{isGhostVoter ? '👻 Dernier vote du Revenant' : 'Vote secret'}</div>
              <div className="phase-banner__title">{protecting ? 'Qui protéger ?' : 'Qui est l’intrus ?'}</div>
              <div className="phase-banner__sub">
                {canVote
                  ? hasVoted
                    ? 'Vote enregistré. En attente des autres…'
                    : 'Sélectionne un joueur puis confirme.'
                  : 'Tu es éliminé : regarde les autres décider.'}
              </div>
            </div>
          </div>

          {canProtect && !hasVoted && (
            <div className="segmented mode-switch" role="group" aria-label="Action">
              <button type="button" className="segmented__btn" aria-pressed={mode === 'vote'} onClick={() => setMode('vote')}>
                🗳 Voter
              </button>
              <button type="button" className="segmented__btn" aria-pressed={mode === 'protect'} onClick={() => setMode('protect')}>
                🛡 Protéger (1×)
              </button>
            </div>
          )}

          <div className="vote-progress">
            <div className="vote-progress__bar" aria-hidden="true">
              <div className="vote-progress__fill" style={{ width: `${total ? (votedCount / total) * 100 : 0}%` }} />
            </div>
            <span className="vote-progress__label">
              {votedCount}/{total} ont voté
            </span>
          </div>

          <div className="select-grid">
            {targets.map((p, i) => {
              const voted = roomState.votedPlayerIds.includes(p.playerId);
              const pressed = current === p.playerId;
              const disabled = protecting ? false : !canVote || hasVoted;
              return (
                <button
                  key={p.playerId}
                  type="button"
                  className={`select-tile${protecting ? ' select-tile--protect' : ''}`}
                  style={{ animationDelay: `${i * 35}ms` }}
                  aria-pressed={pressed}
                  disabled={disabled}
                  onClick={() => (protecting ? setProtectSelected(p.playerId) : setSelected(p.playerId))}
                >
                  <Avatar seed={p.avatarSeed} name={p.name} size="lg" host={p.isHost} />
                  <span className="select-tile__name">{p.name}</span>
                  <span className={`select-tile__status${voted ? ' select-tile__status--done' : ''}`}>{voted ? '✓ a voté' : 'réfléchit…'}</span>
                </button>
              );
            })}
          </div>
        </div>
      </main>

      <ActionBar hint={isHost ? 'Un joueur ne répond plus ? Tu peux clore le vote.' : undefined}>
        <div className="action-bar__row">
          {protecting ? (
            <button className="btn btn-primary" type="button" disabled={!protectSelected} onClick={confirmProtect}>
              🛡 Protéger {protectSelected ? roomState.players.find((p) => p.playerId === protectSelected)?.name : ''}
            </button>
          ) : canVote ? (
            <button className="btn btn-primary" type="button" disabled={!selected || hasVoted} onClick={confirmVote}>
              {hasVoted ? '✓ Vote envoyé' : selected ? `Voter contre ${roomState.players.find((p) => p.playerId === selected)?.name}` : 'Choisis un joueur'}
            </button>
          ) : (
            <button className="btn btn-secondary" type="button" disabled>
              Spectateur du vote
            </button>
          )}
          {isHost && (
            <button className="btn btn-ghost" type="button" style={{ flex: '0 0 auto', width: 'auto' }} onClick={closeVote}>
              Clore
            </button>
          )}
        </div>
      </ActionBar>
    </div>
  );
}

import { useState, type CSSProperties, type ReactNode } from 'react';
import { useRoom } from '../socket/RoomProvider';
import { Avatar } from '../components/Avatar';
import { AppBar } from '../components/AppBar';
import { ActionBar } from '../components/ActionBar';
import { RoleEmblem } from '../components/RoleBadge';
import { roleLabel } from '../lib/roleInfo';
import { universeCopy } from '../lib/universe';
import {
  GHOST_MIN_PLAYERS,
  HUNTER_MIN_PLAYERS,
  JESTER_MIN_PLAYERS,
  LOVERS_MIN_PLAYERS,
  MAX_CUSTOM_PAIRS_PER_ROOM,
  MR_WHITE_MIN_PLAYERS,
  PROTECTOR_MIN_PLAYERS,
  SPY_MIN_PLAYERS,
  autoUndercoverCount,
  computeRoleCounts,
  maxUndercoverFor,
} from '../lib/roles';
import type { Role, RoomSettings } from '../types';

const MAX_PLAYERS = 12;
const MIN_PLAYERS = 3;

type ToggleKey = 'mrWhiteEnabled' | 'spyEnabled' | 'protectorEnabled' | 'ghostEnabled' | 'hunterEnabled' | 'jesterEnabled' | 'loversEnabled';

const ROLE_TOGGLES: { key: ToggleKey; role: Role | 'lover'; label: string; min: number; hint: string }[] = [
  { key: 'mrWhiteEnabled', role: 'mrwhite', label: 'Mr White', min: MR_WHITE_MIN_PLAYERS, hint: "N'a aucun mot, doit bluffer" },
  { key: 'spyEnabled', role: 'spy', label: 'Espion', min: SPY_MIN_PLAYERS, hint: "Connaît le camp d'un joueur" },
  { key: 'protectorEnabled', role: 'protector', label: 'Protecteur', min: PROTECTOR_MIN_PLAYERS, hint: 'Sauve un joueur, une fois' },
  { key: 'ghostEnabled', role: 'ghost', label: 'Revenant', min: GHOST_MIN_PLAYERS, hint: 'Vote encore après sa mort' },
  { key: 'hunterEnabled', role: 'hunter', label: 'Chasseur', min: HUNTER_MIN_PLAYERS, hint: 'Emporte un joueur avec lui' },
  { key: 'jesterEnabled', role: 'jester', label: 'Bouffon', min: JESTER_MIN_PLAYERS, hint: 'Gagne seul si on le vire' },
  { key: 'loversEnabled', role: 'lover', label: 'Amoureux', min: LOVERS_MIN_PLAYERS, hint: '2 joueurs liés à la vie, à la mort' },
];

const TIMER_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: 'Off' },
  { value: 60, label: '1:00' },
  { value: 90, label: '1:30' },
  { value: 120, label: '2:00' },
  { value: 180, label: '3:00' },
  { value: 300, label: '5:00' },
];

function SwitchRow({
  id,
  title,
  hint,
  checked,
  disabled,
  onChange,
}: {
  id: string;
  title: ReactNode;
  hint: ReactNode;
  checked: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className={`switch-row${disabled ? ' switch-row--disabled' : ''}`} htmlFor={id}>
      <span className="switch-row__text">
        <span className="switch-row__title">{title}</span>
        <br />
        <span className="switch-row__hint">{hint}</span>
      </span>
      <span className="switch">
        <input type="checkbox" id={id} checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
        <span className="switch__track" />
      </span>
    </label>
  );
}

export function Lobby() {
  const { roomState, playerId, updateSettings, startGame, addCustomPair, removeCustomPair, kickPlayer, leaveRoom } = useRoom();
  const [pairA, setPairA] = useState('');
  const [pairB, setPairB] = useState('');
  const [pairTheme, setPairTheme] = useState('');
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);

  if (!roomState) return null;

  const me = roomState.players.find((p) => p.playerId === playerId);
  const isHost = me?.isHost ?? false;
  const n = roomState.players.length;
  const s = roomState.settings;
  const copy = universeCopy(roomState.universe);
  const counts = computeRoleCounts(n, {
    mrWhite: s.mrWhiteEnabled,
    spy: s.spyEnabled,
    protector: s.protectorEnabled,
    ghost: s.ghostEnabled,
    jester: s.jesterEnabled,
    hunter: s.hunterEnabled,
    lovers: s.loversEnabled,
    undercoverCount: s.undercoverCount,
  });
  const maxUndercover = n >= MIN_PLAYERS ? maxUndercoverFor(n, counts.mrWhite, counts.jester) : 1;
  const canStart = isHost && n >= MIN_PLAYERS;
  const inviteLink = `${window.location.origin}/play/${roomState.universe}?code=${roomState.roomCode}`;

  function flash(what: 'code' | 'link') {
    setCopied(what);
    window.setTimeout(() => setCopied(null), 1800);
  }

  function copyCode() {
    navigator.clipboard?.writeText(roomState!.roomCode).then(() => flash('code'), () => {});
  }

  // Partage natif sur mobile (WhatsApp, Discord...), copie du lien sinon.
  function shareLink() {
    if (navigator.share) {
      navigator.share({ title: copy.name, text: `Rejoins ma partie ${copy.name} !`, url: inviteLink }).catch(() => {});
      return;
    }
    navigator.clipboard?.writeText(inviteLink).then(() => flash('link'), () => {});
  }

  // Active d'un coup tous les rôles optionnels disponibles pour N (jamais ceux sous le seuil :
  // settings:update rejette toute la requête si un seul champ dépasse son seuil).
  function activateChaosMode() {
    const next: Partial<RoomSettings> = {};
    for (const t of ROLE_TOGGLES) next[t.key] = n >= t.min;
    updateSettings(next);
  }

  function setUndercover(value: number) {
    updateSettings({ undercoverCount: value });
  }

  function handleAddPair() {
    if (!pairA.trim() || !pairB.trim()) return;
    addCustomPair(pairA.trim(), pairB.trim(), pairTheme.trim() || undefined);
    setPairA('');
    setPairB('');
    setPairTheme('');
  }

  const undercoverLabel = s.undercoverCount === 0 ? `Auto (${n >= MIN_PLAYERS ? autoUndercoverCount(n) : 1})` : `${counts.undercover}`;

  return (
    <div className="screen" data-universe={roomState.universe}>
      <AppBar
        title={copy.name}
        right={
          <button
            className="btn btn-ghost btn-sm"
            type="button"
            onClick={() => {
              if (isHost && n > 1 && !window.confirm('Tu es l’hôte : quitter ferme le salon pour tout le monde. Confirmer ?')) return;
              leaveRoom();
            }}
          >
            Quitter
          </button>
        }
      />

      <main className="main">
        <div className="container">
          <section className="hud-frame text-center">
            <div className="eyebrow">Code de la room</div>
            <div className="room-code" aria-label={`Code : ${roomState.roomCode.split('').join(' ')}`}>
              {roomState.roomCode.split('').map((c, i) => (
                <span className="room-code__char" key={i}>
                  {c}
                </span>
              ))}
            </div>
            <div className="row" style={{ justifyContent: 'center' }}>
              <button className="btn btn-secondary btn-sm" type="button" onClick={copyCode}>
                {copied === 'code' ? '✓ Copié' : 'Copier le code'}
              </button>
              <button className="btn btn-primary btn-sm" type="button" onClick={shareLink}>
                {copied === 'link' ? '✓ Lien copié' : 'Inviter'}
              </button>
            </div>
          </section>

          <section className="section" aria-labelledby="players-title">
            <div className="section__head">
              <h2 id="players-title" className="section__title">
                Joueurs
              </h2>
              <span className="section__count">
                {n}/{MAX_PLAYERS}
              </span>
            </div>
            <div className="player-grid">
              {roomState.players.map((p) => (
                <div key={p.playerId} className={`player-tile${p.playerId === playerId ? ' player-tile--me' : ''}${p.connected ? '' : ' player-tile--offline'}`}>
                  <Avatar seed={p.avatarSeed} name={p.name} host={p.isHost} />
                  <div className="player-tile__body">
                    <div className="player-tile__name">{p.name}</div>
                    <div className="player-tile__meta">
                      {p.playerId === playerId ? 'Toi' : p.isHost ? 'Hôte' : p.connected ? 'Prêt' : 'Déconnecté…'}
                      {p.score > 0 && `, ${p.score} pt${p.score > 1 ? 's' : ''}`}
                    </div>
                  </div>
                  {isHost && p.playerId !== playerId && (
                    <button
                      type="button"
                      className="icon-btn icon-btn--danger player-tile__kick"
                      aria-label={`Exclure ${p.name}`}
                      title="Exclure"
                      onClick={() => window.confirm(`Exclure ${p.name} de la partie ?`) && kickPlayer(p.playerId)}
                    >
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M6 6 L18 18 M18 6 L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
              {n < MIN_PLAYERS && <div className="player-tile player-tile--empty">En attente de joueurs…</div>}
            </div>
          </section>

          <section className="section" aria-labelledby="roles-title">
            <div className="section__head">
              <h2 id="roles-title" className="section__title">
                Rôles
              </h2>
              {isHost && (
                <button type="button" className="btn btn-ghost btn-sm" onClick={activateChaosMode}>
                  🎲 Mode chaos
                </button>
              )}
            </div>
            <div className="role-toggle-grid">
              {ROLE_TOGGLES.map((t) => {
                const available = n >= t.min;
                const on = s[t.key];
                return (
                  <button
                    key={t.key}
                    type="button"
                    className={`role-toggle${available ? '' : ' role-toggle--locked'}`}
                    style={{ '--role-color': `var(--role-${t.role})` } as CSSProperties}
                    aria-pressed={on}
                    disabled={!isHost || !available}
                    onClick={() => updateSettings({ [t.key]: !on })}
                  >
                    <span className="role-toggle__top">
                      {t.role === 'lover' ? (
                        <span className="role-toggle__icon" style={{ fontSize: 22, lineHeight: '28px', textAlign: 'center' }} aria-hidden="true">
                          💘
                        </span>
                      ) : (
                        <RoleEmblem role={t.role} className="role-toggle__icon" />
                      )}
                      <span className="role-toggle__name">{t.label}</span>
                      <span className="role-toggle__check" aria-hidden="true">
                        {on ? '✓' : ''}
                      </span>
                    </span>
                    <span className="role-toggle__hint">{available ? t.hint : `Dès ${t.min} joueurs`}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="section" aria-labelledby="game-title">
            <div className="section__head">
              <h2 id="game-title" className="section__title">
                Partie
              </h2>
            </div>
            <div className="panel" style={{ paddingBlock: 4 }}>
              <div className="setting-line">
                <div>
                  <div className="setting-line__label">Undercover</div>
                  <div className="setting-line__hint">Auto : 1 jusqu'à 8 joueurs, 2 au-delà</div>
                </div>
                <div className="stepper">
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label="Moins d'Undercover"
                    disabled={!isHost || s.undercoverCount === 0}
                    onClick={() => setUndercover(counts.undercover <= 1 ? 0 : counts.undercover - 1)}
                  >
                    −
                  </button>
                  <span className="stepper__value">{undercoverLabel}</span>
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label="Plus d'Undercover"
                    disabled={!isHost || counts.undercover >= Math.min(4, maxUndercover)}
                    onClick={() => setUndercover(Math.min(4, maxUndercover, counts.undercover + 1))}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="setting-line">
                <div>
                  <div className="setting-line__label">Minuteur de discussion</div>
                  <div className="setting-line__hint">À zéro, le vote se lance tout seul</div>
                </div>
                <div className="segmented" role="group" aria-label="Minuteur de discussion">
                  {TIMER_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      className="segmented__btn"
                      aria-pressed={s.discussionSeconds === o.value}
                      disabled={!isHost}
                      onClick={() => updateSettings({ discussionSeconds: o.value })}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              <SwitchRow
                id="toggle-public-votes"
                title="Votes publics"
                hint="Le résultat montre qui a voté pour qui"
                checked={s.publicVotes}
                disabled={!isHost}
                onChange={(v) => updateSettings({ publicVotes: v })}
              />
              <SwitchRow
                id="toggle-reveal"
                title={`Révéler le ${copy.unitLabel} des éliminés`}
                hint="Sinon, seul leur rôle est annoncé"
                checked={s.revealChampionOnElimination}
                disabled={!isHost}
                onChange={(v) => updateSettings({ revealChampionOnElimination: v })}
              />
            </div>
          </section>

          <details className="section fold" open={roomState.customPairs.length > 0}>
            <summary className="section__head">
              <h2 className="section__title">Paires maison</h2>
              <span className="section__count">{roomState.customPairs.length}</span>
            </summary>
            <div className="panel stack" style={{ '--gap': '10px' } as CSSProperties}>
              {isHost && (
                <>
                  <div className="row">
                    <input className="input" type="text" maxLength={40} placeholder="Mot des civils" aria-label="Mot des civils" value={pairA} onChange={(e) => setPairA(e.target.value)} />
                    <span className="vs">VS</span>
                    <input className="input" type="text" maxLength={40} placeholder="Mot de l'undercover" aria-label="Mot de l'undercover" value={pairB} onChange={(e) => setPairB(e.target.value)} />
                  </div>
                  <input className="input" type="text" maxLength={80} placeholder="Thème (optionnel)" aria-label="Thème de la paire" value={pairTheme} onChange={(e) => setPairTheme(e.target.value)} />
                  <button
                    className="btn btn-secondary"
                    type="button"
                    disabled={!pairA.trim() || !pairB.trim() || roomState.customPairs.length >= MAX_CUSTOM_PAIRS_PER_ROOM}
                    onClick={handleAddPair}
                  >
                    + Ajouter la paire
                  </button>
                </>
              )}
              {roomState.customPairs.length === 0 ? (
                <p className="text-low small">{isHost ? 'Crée tes propres paires pour un univers 100 % maison.' : "L'hôte peut ajouter ses propres paires."}</p>
              ) : (
                <div>
                  {roomState.customPairs.map((pair) => (
                    <div className="custom-pair" key={pair.id}>
                      <span style={{ flex: 1 }}>
                        <strong>{pair.champA}</strong> <span className="vs">VS</span> <strong>{pair.champB}</strong>
                        <span className="text-low"> ({pair.theme})</span>
                      </span>
                      {isHost && (
                        <button className="icon-btn" type="button" aria-label={`Retirer ${pair.champA} / ${pair.champB}`} onClick={() => removeCustomPair(pair.id)}>
                          <svg viewBox="0 0 24 24" fill="none">
                            <path d="M6 6 L18 18 M18 6 L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <SwitchRow
                id="toggle-custom-pairs"
                title="Jouer uniquement avec ces paires"
                hint={roomState.customPairs.length === 0 ? 'Ajoute au moins une paire' : `Remplace les paires ${copy.name}`}
                checked={s.customPairsEnabled}
                disabled={!isHost || roomState.customPairs.length === 0}
                onChange={(v) => updateSettings({ customPairsEnabled: v })}
              />
            </div>
          </details>
        </div>
      </main>

      <ActionBar
        hint={
          <span className="distribution" style={{ justifyContent: 'center' }}>
            <span className="badge badge--civil">{counts.civils + counts.spy + counts.protector + counts.ghost + counts.hunter} Civils</span>
            <span className="badge badge--undercover">
              {counts.undercover} Undercover
            </span>
            {counts.mrWhite > 0 && <span className="badge badge--mrwhite">{roleLabel('mrwhite')}</span>}
            {counts.jester > 0 && <span className="badge badge--jester">{roleLabel('jester')}</span>}
          </span>
        }
      >
        {isHost ? (
          <button className="btn btn-primary" type="button" disabled={!canStart} onClick={startGame}>
            {canStart ? 'Lancer la partie' : `Encore ${MIN_PLAYERS - n} joueur${MIN_PLAYERS - n > 1 ? 's' : ''}…`}
          </button>
        ) : (
          <button className="btn btn-secondary" type="button" disabled>
            En attente de l'hôte…
          </button>
        )}
      </ActionBar>
    </div>
  );
}

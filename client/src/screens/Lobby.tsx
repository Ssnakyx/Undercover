import { useState } from 'react';
import { useRoom } from '../socket/RoomProvider';
import { Avatar } from '../components/Avatar';
import { AppBar } from '../components/AppBar';
import { ActionBar } from '../components/ActionBar';
import { ThemeToggle } from '../components/ThemeToggle';
import {
  MAX_CUSTOM_PAIRS_PER_ROOM,
  computeRoleCounts,
  isGhostAvailable,
  isHunterAvailable,
  isJesterAvailable,
  isLoversAvailable,
  isMrWhiteAvailable,
  isProtectorAvailable,
  isSpyAvailable,
} from '../lib/roles';

export function Lobby() {
  const { roomState, playerId, updateSettings, startGame, addCustomPair, removeCustomPair } = useRoom();
  const [pairChampA, setPairChampA] = useState('');
  const [pairChampB, setPairChampB] = useState('');
  const [pairTheme, setPairTheme] = useState('');

  if (!roomState) return null;

  const me = roomState.players.find((p) => p.playerId === playerId);
  const isHost = me?.isHost ?? false;
  const host = roomState.players.find((p) => p.isHost);
  const n = roomState.players.length;
  const s = roomState.settings;
  const counts = computeRoleCounts(n, {
    mrWhite: s.mrWhiteEnabled,
    spy: s.spyEnabled,
    protector: s.protectorEnabled,
    ghost: s.ghostEnabled,
    jester: s.jesterEnabled,
    hunter: s.hunterEnabled,
    lovers: s.loversEnabled,
  });
  const mrWhiteAvailable = isMrWhiteAvailable(n);
  const spyAvailable = isSpyAvailable(n);
  const protectorAvailable = isProtectorAvailable(n);
  const ghostAvailable = isGhostAvailable(n);
  const jesterAvailable = isJesterAvailable(n);
  const hunterAvailable = isHunterAvailable(n);
  const loversAvailable = isLoversAvailable(n);
  const canStart = isHost && n >= 3;

  function copyCode() {
    navigator.clipboard?.writeText(roomState!.roomCode).catch(() => {});
  }

  function inviteLink() {
    return `${window.location.origin}/play/${roomState!.universe}?code=${roomState!.roomCode}`;
  }

  function copyInviteLink() {
    navigator.clipboard?.writeText(inviteLink()).catch(() => {});
  }

  // Active d'un coup tous les rôles optionnels disponibles pour N (jamais ceux sous le seuil
  // — settings:update rejette toute la requête si un seul champ dépasse le seuil, voir
  // handlers.ts). Idempotent : relancer le Mode Chaos réaligne juste les toggles sur N courant.
  function activateChaosMode() {
    updateSettings({
      mrWhiteEnabled: mrWhiteAvailable,
      spyEnabled: spyAvailable,
      protectorEnabled: protectorAvailable,
      ghostEnabled: ghostAvailable,
      jesterEnabled: jesterAvailable,
      hunterEnabled: hunterAvailable,
      loversEnabled: loversAvailable,
    });
  }

  function handleAddPair() {
    if (!pairChampA.trim() || !pairChampB.trim()) return;
    addCustomPair(pairChampA.trim(), pairChampB.trim(), pairTheme.trim() || undefined);
    setPairChampA('');
    setPairChampB('');
    setPairTheme('');
  }

  return (
    <div className="screen theme-paper">
      <AppBar
        title="Lobby"
        right={
          <>
            <ThemeToggle />
            <span className="badge badge--host">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M4 18 L6 8 L10 13 L12 6 L14 13 L18 8 L20 18 Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
              </svg>
              Hôte : {host?.name ?? '—'}
            </span>
          </>
        }
      />

      <main className="main">
        <div className="container">
          <div className="code-share frame-cut">
            <div className="code-share__row">
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
            <button className="btn btn-secondary" type="button" onClick={copyInviteLink}>
              <svg className="icon" viewBox="0 0 24 24" fill="none" width={16} height={16} style={{ marginRight: 'var(--space-2)' }}>
                <path d="M9 15 L15 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path
                  d="M11 6 l1.5-1.5 a3.2 3.2 0 0 1 4.5 4.5 L15.5 10.5 M13 18 l-1.5 1.5 a3.2 3.2 0 0 1 -4.5 -4.5 L8.5 13.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Copier le lien d'invitation
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
                <div key={p.playerId} className={`player-row stagger-item${p.connected ? '' : ' player-row--offline'}`}>
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
                  {counts.spy > 0 && <span className="badge badge--spy">1 Espion</span>}
                  {counts.protector > 0 && <span className="badge badge--protector">1 Protecteur</span>}
                  {counts.ghost > 0 && <span className="badge badge--ghost">1 Revenant</span>}
                  {counts.jester > 0 && <span className="badge badge--jester">1 Bouffon</span>}
                  {counts.hunter > 0 && <span className="badge badge--hunter">1 Chasseur</span>}
                  {counts.lovers && <span className="badge badge--lover">💘 Amoureux</span>}
                </div>
              </div>

              {isHost && (
                <div className="setting-row">
                  <button type="button" className="btn btn-secondary chaos-btn" onClick={activateChaosMode}>
                    🎲 Mode Chaos — active tous les rôles disponibles
                  </button>
                </div>
              )}

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
                <label className="switch" htmlFor="toggle-spy">
                  <input
                    type="checkbox"
                    id="toggle-spy"
                    checked={roomState.settings.spyEnabled}
                    disabled={!isHost || !spyAvailable}
                    onChange={(e) => updateSettings({ spyEnabled: e.target.checked })}
                  />
                  <span className="switch__track" />
                  <span className="switch__label">
                    <span className="switch__label-title">Espion</span>
                    <span className="switch__label-hint">
                      {spyAvailable ? 'Camp civils — apprend le camp d\'un autre joueur à la révélation' : 'Indisponible à moins de 4 joueurs'}
                    </span>
                  </span>
                </label>
              </div>

              <div className="setting-row">
                <label className="switch" htmlFor="toggle-protector">
                  <input
                    type="checkbox"
                    id="toggle-protector"
                    checked={roomState.settings.protectorEnabled}
                    disabled={!isHost || !protectorAvailable}
                    onChange={(e) => updateSettings({ protectorEnabled: e.target.checked })}
                  />
                  <span className="switch__track" />
                  <span className="switch__label">
                    <span className="switch__label-title">Protecteur</span>
                    <span className="switch__label-hint">
                      {protectorAvailable ? 'Camp civils — peut annuler une élimination, une fois par partie' : 'Indisponible à moins de 5 joueurs'}
                    </span>
                  </span>
                </label>
              </div>

              <div className="setting-row">
                <label className="switch" htmlFor="toggle-ghost">
                  <input
                    type="checkbox"
                    id="toggle-ghost"
                    checked={roomState.settings.ghostEnabled}
                    disabled={!isHost || !ghostAvailable}
                    onChange={(e) => updateSettings({ ghostEnabled: e.target.checked })}
                  />
                  <span className="switch__track" />
                  <span className="switch__label">
                    <span className="switch__label-title">Revenant</span>
                    <span className="switch__label-hint">
                      {ghostAvailable ? 'Camp civils — vote une dernière fois après son élimination' : 'Indisponible à moins de 5 joueurs'}
                    </span>
                  </span>
                </label>
              </div>

              <div className="setting-row">
                <label className="switch" htmlFor="toggle-hunter">
                  <input
                    type="checkbox"
                    id="toggle-hunter"
                    checked={roomState.settings.hunterEnabled}
                    disabled={!isHost || !hunterAvailable}
                    onChange={(e) => updateSettings({ hunterEnabled: e.target.checked })}
                  />
                  <span className="switch__track" />
                  <span className="switch__label">
                    <span className="switch__label-title">Chasseur</span>
                    <span className="switch__label-hint">
                      {hunterAvailable ? 'Camp civils — s\'il est éliminé, il tire sur un autre joueur' : 'Indisponible à moins de 4 joueurs'}
                    </span>
                  </span>
                </label>
              </div>

              <div className="setting-row">
                <label className="switch" htmlFor="toggle-jester">
                  <input
                    type="checkbox"
                    id="toggle-jester"
                    checked={roomState.settings.jesterEnabled}
                    disabled={!isHost || !jesterAvailable}
                    onChange={(e) => updateSettings({ jesterEnabled: e.target.checked })}
                  />
                  <span className="switch__track" />
                  <span className="switch__label">
                    <span className="switch__label-title">Bouffon</span>
                    <span className="switch__label-hint">
                      {jesterAvailable ? 'Camp solo — gagne seul s\'il est éliminé par un vote' : 'Indisponible à moins de 6 joueurs'}
                    </span>
                  </span>
                </label>
              </div>

              <div className="setting-row">
                <label className="switch" htmlFor="toggle-lovers">
                  <input
                    type="checkbox"
                    id="toggle-lovers"
                    checked={roomState.settings.loversEnabled}
                    disabled={!isHost || !loversAvailable}
                    onChange={(e) => updateSettings({ loversEnabled: e.target.checked })}
                  />
                  <span className="switch__track" />
                  <span className="switch__label">
                    <span className="switch__label-title">💘 Amoureux</span>
                    <span className="switch__label-hint">
                      {loversAvailable ? '2 joueurs liés en secret — si l\'un meurt, l\'autre le suit' : 'Indisponible à moins de 4 joueurs'}
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

          <section aria-labelledby="custom-pairs-title" className="mt-6">
            <div className="section-title">
              <h2 id="custom-pairs-title" className="font-display">
                Paires personnalisées
              </h2>
              <span className="count">{roomState.customPairs.length}</span>
            </div>
            <div className="panel">
              {isHost && (
                <div className="setting-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 'var(--space-3)' }}>
                  <input
                    className="input"
                    type="text"
                    maxLength={40}
                    placeholder="Ex. Batman"
                    aria-label="Nom du premier champion/personnage"
                    value={pairChampA}
                    onChange={(e) => setPairChampA(e.target.value)}
                  />
                  <input
                    className="input"
                    type="text"
                    maxLength={40}
                    placeholder="Ex. Robin"
                    aria-label="Nom du second champion/personnage"
                    value={pairChampB}
                    onChange={(e) => setPairChampB(e.target.value)}
                  />
                  <input
                    className="input"
                    type="text"
                    maxLength={80}
                    placeholder="Thème (optionnel)"
                    aria-label="Thème de la paire"
                    value={pairTheme}
                    onChange={(e) => setPairTheme(e.target.value)}
                  />
                  <button
                    className="btn btn-secondary"
                    type="button"
                    disabled={!pairChampA.trim() || !pairChampB.trim() || roomState.customPairs.length >= MAX_CUSTOM_PAIRS_PER_ROOM}
                    onClick={handleAddPair}
                  >
                    Ajouter la paire
                  </button>
                </div>
              )}

              {roomState.customPairs.length === 0 ? (
                <p className="text-low" style={{ padding: 'var(--space-4) 0', fontSize: 'var(--text-sm)' }}>
                  Aucune paire personnalisée — {isHost ? 'ajoutes-en une pour créer un univers maison' : "l'hôte peut en ajouter"}.
                </p>
              ) : (
                roomState.customPairs.map((pair) => (
                  <div className="setting-row" key={pair.id}>
                    <span style={{ fontSize: 'var(--text-sm)' }}>
                      {pair.champA} / {pair.champB} — <span className="text-low">{pair.theme}</span>
                    </span>
                    {isHost && (
                      <button
                        className="icon-btn"
                        type="button"
                        aria-label={`Retirer la paire ${pair.champA} / ${pair.champB}`}
                        onClick={() => removeCustomPair(pair.id)}
                      >
                        <svg className="icon" viewBox="0 0 24 24" fill="none" width={16} height={16}>
                          <path d="M6 6 L18 18 M18 6 L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))
              )}

              <div className="setting-row">
                <label className="switch" htmlFor="toggle-custom-pairs">
                  <input
                    type="checkbox"
                    id="toggle-custom-pairs"
                    checked={roomState.settings.customPairsEnabled}
                    disabled={!isHost || roomState.customPairs.length === 0}
                    onChange={(e) => updateSettings({ customPairsEnabled: e.target.checked })}
                  />
                  <span className="switch__track" />
                  <span className="switch__label">
                    <span className="switch__label-title">Utiliser uniquement ces paires</span>
                    <span className="switch__label-hint">
                      {roomState.customPairs.length === 0
                        ? 'Ajoute au moins une paire pour activer'
                        : `Remplace le pool ${roomState.universe} par ces ${roomState.customPairs.length} paire${roomState.customPairs.length > 1 ? 's' : ''} pour cette partie`}
                    </span>
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
              {counts.undercover} Undercover
              {counts.mrWhite > 0 ? ' / 1 Mr White' : ''}
              {counts.spy > 0 ? ' / 1 Espion' : ''}
              {counts.protector > 0 ? ' / 1 Protecteur' : ''}
              {counts.ghost > 0 ? ' / 1 Revenant' : ''}
              {counts.hunter > 0 ? ' / 1 Chasseur' : ''}
              {counts.jester > 0 ? ' / 1 Bouffon' : ''}
              {counts.lovers ? ' / 💘 Amoureux' : ''}
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

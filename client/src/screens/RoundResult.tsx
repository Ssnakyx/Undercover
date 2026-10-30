import type { CSSProperties } from 'react';
import { useRoom } from '../socket/RoomProvider';
import { GameHud } from '../components/GameHud';
import { ActionBar } from '../components/ActionBar';
import { Avatar } from '../components/Avatar';
import { CharacterArt } from '../components/CharacterArt';
import { RoleEmblem } from '../components/RoleBadge';
import { roleLabel, roleHasWord } from '../lib/roleInfo';
import type { PublicPlayer, Role, Universe } from '../types';

function KoCard({
  player,
  role,
  champion,
  image,
  universe,
  eyebrow,
}: {
  player: PublicPlayer;
  role: Role | null | undefined;
  champion: string | null | undefined;
  image: string | null | undefined;
  universe: Universe;
  eyebrow: string;
}) {
  const tone = { '--tone': `var(--role-${role ?? 'civil'})` } as CSSProperties;
  const art = champion ? <CharacterArt name={champion} image={image} universe={universe} /> : <Avatar seed={player.avatarSeed} name={player.name} size="xl" dead />;
  return (
    <div className="hud-frame ko-block is-shaking" style={tone}>
      <span className="eyebrow">{eyebrow}</span>
      <div className="ko-portrait">
        <div className="ko-half ko-half--left">{art}</div>
        <div className="ko-half ko-half--right" aria-hidden="true">
          {art}
        </div>
        <span className="ko-stamp">K.O.</span>
      </div>
      <div className="ko-name">{player.name}</div>
      {role && (
        <span className="ko-role">
          <RoleEmblem role={role} />
          {roleLabel(role)}
          {roleHasWord(role) && champion && <span className="text-mid">, {champion}</span>}
        </span>
      )}
    </div>
  );
}

export function RoundResult() {
  const { roomState, playerId, lastRoundResult, continueRound } = useRoom();

  if (!roomState || !lastRoundResult) return null;

  const me = roomState.players.find((p) => p.playerId === playerId);
  const isHost = me?.isHost ?? false;
  const r = lastRoundResult;
  const find = (id: string | null | undefined) => (id ? roomState.players.find((p) => p.playerId === id) : undefined);
  const eliminated = find(r.eliminatedPlayerId);
  const chain = find(r.chainEliminatedPlayerId);
  const rows = Object.entries(r.voteCounts)
    .filter(([, c]) => c > 0)
    .sort(([, a], [, b]) => b - a);
  const maxVotes = Math.max(1, ...rows.map(([, c]) => c));
  const aliveCount = roomState.players.filter((p) => p.alive).length;

  let headline: { mark: string; title: string; sub: string } | null = null;
  if (!eliminated) {
    if (r.protectedThisRound) headline = { mark: 'Sauvé', title: 'Le Protecteur a sauvé sa cible', sub: 'Personne n’est éliminé ce round.' };
    else if (r.hunterShot) headline = { mark: 'Raté', title: 'Le Chasseur a baissé son arme', sub: 'Il n’a tiré sur personne.' };
    else if (r.tie) headline = { mark: 'Égalité', title: 'Les votes sont partagés', sub: 'Personne n’est éliminé ce round.' };
    else headline = { mark: 'Rien', title: 'Aucun vote', sub: 'Personne n’est éliminé ce round.' };
  }

  return (
    <div className="screen" data-universe={roomState.universe}>
      <GameHud title={r.hunterShot ? 'Tir du Chasseur' : 'Résultat'} />

      <main className="main">
        <div className="container stack">
          {eliminated ? (
            <KoCard
              player={eliminated}
              role={r.eliminatedRole}
              champion={r.eliminatedChampion}
              image={r.eliminatedChampionImage}
              universe={roomState.universe}
              eyebrow={r.hunterShot ? '🎯 Abattu par le Chasseur' : 'Éliminé par le vote'}
            />
          ) : (
            headline && (
              <div className="hud-frame ko-block">
                <span className="safe-mark">{headline.mark}</span>
                <div className="ko-name">{headline.title}</div>
                <p className="text-mid">{headline.sub}</p>
              </div>
            )
          )}

          {chain && (
            <KoCard
              player={chain}
              role={r.chainEliminatedRole}
              champion={r.chainEliminatedChampion}
              image={r.chainEliminatedChampionImage}
              universe={roomState.universe}
              eyebrow="💘 Mort de chagrin"
            />
          )}

          {rows.length > 0 && (
            <section className="panel" aria-labelledby="breakdown-title">
              <div className="section__head">
                <h2 id="breakdown-title" className="section__title">
                  Dépouillement
                </h2>
              </div>
              <div className="vote-bars">
                {rows.map(([pid, count], i) => (
                  <div className={`vote-bar${count === maxVotes && !r.tie && pid === r.eliminatedPlayerId ? ' vote-bar--top' : ''}`} key={pid}>
                    <span className="vote-bar__name">{find(pid)?.name ?? '?'}</span>
                    <span className="vote-bar__track" aria-hidden="true">
                      {Array.from({ length: count }, (_, c) => (
                        <span className="vote-chip" key={c} style={{ animationDelay: `${300 + i * 120 + c * 90}ms` }} />
                      ))}
                    </span>
                    <span className="vote-bar__count">{count}</span>
                  </div>
                ))}
              </div>
              {r.votes && r.votes.length > 0 && (
                <details className="fold mt-4">
                  <summary className="eyebrow">Qui a voté pour qui</summary>
                  <div className="ballot-list mt-2">
                    {r.votes.map((v) => (
                      <div className="ballot" key={v.voterId}>
                        <strong>{find(v.voterId)?.name ?? '?'}</strong> → {find(v.targetPlayerId)?.name ?? '?'}
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </section>
          )}

          <p className="text-center text-mid small">
            {aliveCount} joueur{aliveCount > 1 ? 's' : ''} encore en lice.
          </p>
        </div>
      </main>

      <ActionBar>
        {isHost ? (
          <button className="btn btn-primary" type="button" onClick={continueRound}>
            Manche suivante
          </button>
        ) : (
          <button className="btn btn-secondary" type="button" disabled>
            L'hôte lance la manche suivante…
          </button>
        )}
      </ActionBar>
    </div>
  );
}

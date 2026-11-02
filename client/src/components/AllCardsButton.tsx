import { useEffect, useState, type CSSProperties } from 'react';
import { useRoom } from '../socket/RoomProvider';
import { Avatar } from './Avatar';
import { CharacterArt } from './CharacterArt';
import { RoleBadge } from './RoleBadge';
import { universeCopy } from '../lib/universe';

/**
 * Éliminé : voir la carte (mot) et le rôle de chaque joueur pour suivre la fin de partie. Le
 * serveur n'envoie ces infos qu'aux éliminés (jamais aux vivants), et les retient tant que
 * l'éliminé a encore une action (vote du Revenant, devinette de Mr White, tir du Chasseur).
 * Ouvert à la demande, comme "Mon mot", pour ne pas l'étaler sous les yeux des voisins.
 */
export function AllCardsButton() {
  const { eliminatedReveal, roomState, playerId } = useRoom();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!eliminatedReveal || !roomState) return null;

  const unit = universeCopy(roomState.universe).unitLabel;
  const pair = eliminatedReveal.pair;

  return (
    <>
      <button type="button" className="fab" aria-label="Voir les cartes de tous les joueurs" title="Toutes les cartes" onClick={() => setOpen(true)}>
        <span aria-hidden="true" className="fab__eye">👁</span>
      </button>
      {open && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Cartes de tous les joueurs" onClick={() => setOpen(false)}>
          <div className="all-cards" onClick={(e) => e.stopPropagation()}>
            <div className="section__head">
              <h2 className="section__title">Qui est qui</h2>
              <button type="button" className="btn btn-ghost btn-sm all-cards__close" onClick={() => setOpen(false)}>
                Fermer
              </button>
            </div>
            <p className="small text-low">Tu es éliminé : toi seul vois ça. Ne le dis pas aux joueurs encore en jeu !</p>
            {pair && (
              <p className="all-cards__pair">
                <span className="badge badge--civil">Civils</span> {pair.civil}
                <span className="all-cards__vs">vs</span>
                <span className="badge badge--undercover">Undercover</span> {pair.undercover}
              </p>
            )}
            <div className="reveal-grid all-cards__grid">
              {eliminatedReveal.reveal.map((p) => {
                const player = roomState.players.find((pl) => pl.playerId === p.playerId);
                const alive = player?.alive ?? false;
                const lover = p.loverPlayerId ? eliminatedReveal.reveal.find((r) => r.playerId === p.loverPlayerId) : null;
                return (
                  <div
                    key={p.playerId}
                    className={`reveal-tile${alive ? '' : ' reveal-tile--dead'}`}
                    style={{ '--tone': `var(--role-${p.role})` } as CSSProperties}
                  >
                    {p.champion ? (
                      <CharacterArt className="reveal-tile__art" name={p.champion} image={p.championImage} universe={roomState.universe} />
                    ) : (
                      <div className="reveal-tile__art char-art" style={{ display: 'grid', placeItems: 'center' }}>
                        <Avatar seed={player?.avatarSeed ?? p.playerId} name={p.name} size="lg" />
                      </div>
                    )}
                    <div className="reveal-tile__body">
                      <span className="reveal-tile__player">
                        {p.name}
                        {p.playerId === playerId && <span className="text-low small"> (toi)</span>}
                      </span>
                      <RoleBadge role={p.role} />
                      <span className="reveal-tile__word">{p.champion ?? `Aucun ${unit}`}</span>
                      {!alive && <span className="reveal-tile__word">✝ Éliminé</span>}
                      {lover && <span className="reveal-tile__word">💘 lié à {lover.name}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

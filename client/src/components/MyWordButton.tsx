import { useEffect, useState } from 'react';
import { useRoom } from '../socket/RoomProvider';
import { roleToneClass } from '../lib/roleInfo';
import { RoleCardContent } from './RoleCard';

/**
 * "Mon mot" : revoir son rôle et son mot à tout moment de la partie (avant, impossible une fois
 * la révélation passée — embêtant quand on a un doute en pleine discussion). La carte s'ouvre
 * en plein écran et se referme d'un tap, pour ne pas la laisser traîner sous les yeux des voisins.
 */
export function MyWordButton() {
  const { myRole, roomState } = useRoom();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!myRole || !roomState) return null;

  return (
    <>
      <button type="button" className="fab fab--accent" aria-label="Revoir mon mot" title="Mon mot" onClick={() => setOpen(true)}>
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="5" y="3" width="14" height="18" rx="2.5" stroke="currentColor" strokeWidth="2" />
          <path d="M9 9 h6 M9 13 h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Mon mot" onClick={() => setOpen(false)}>
          <div className="modal">
            <div className="flip-scene">
              <div className={`word-card ${roleToneClass(myRole.role)}`}>
                <RoleCardContent myRole={myRole} universe={roomState.universe} />
              </div>
            </div>
            <p className="tiny text-low pixel">Touche n'importe où pour cacher</p>
          </div>
        </div>
      )}
    </>
  );
}

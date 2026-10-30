import { useRoom } from '../socket/RoomProvider';

/** Notifications éphémères : erreurs serveur, joueur parti, exclusion. */
export function Toasts() {
  const { toasts, dismissToast } = useRoom();
  if (toasts.length === 0) return null;
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast${t.kind === 'error' ? ' toast--error' : ''}`}>
          {t.image && <img className="char-thumb" src={t.image} alt="" style={{ objectFit: 'cover' }} />}
          <span className="toast__text">{t.text}</span>
          <button type="button" className="toast__close" aria-label="Fermer" onClick={() => dismissToast(t.id)}>
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

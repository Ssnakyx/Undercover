import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRoom } from '../socket/RoomProvider';
import { Avatar } from './Avatar';

const MESSAGE_MAX_LENGTH = 300;

// Chat texte libre entre joueurs d'une room — convenience pure, ne fait pas partie de la
// boucle de jeu (voir server/src/types.ts ChatMessage). Monté une seule fois par GameRoute,
// flottant au-dessus de l'écran de phase courant pour rester disponible partout (lobby comme
// en pleine partie) sans avoir à le câbler dans chaque AppBar/ActionBar.
export function ChatBox() {
  const { roomState, playerId, chatMessages, chatUnreadCount, markChatRead, sendChatMessage } = useRoom();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [chatMessages, open]);

  if (!roomState) return null;

  function avatarSeedFor(pid: string): string {
    return roomState!.players.find((p) => p.playerId === pid)?.avatarSeed ?? pid;
  }

  function handleToggle() {
    // Ouvrir ou fermer compte comme "lu" dans les deux cas : à l'ouverture on voit l'historique,
    // à la fermeture on vient de voir la liste en direct — voir RoomProvider.markChatRead.
    setOpen((o) => !o);
    markChatRead();
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    sendChatMessage(draft);
    setDraft('');
  }

  return (
    <div className="chat-widget">
      {open && (
        <div className="chat-panel panel frame-cut" role="dialog" aria-label="Chat de la room">
          <div className="chat-panel__header">
            <span className="chat-panel__title font-display">Chat</span>
            <button className="icon-btn chat-panel__close" type="button" aria-label="Fermer le chat" onClick={handleToggle}>
              <svg className="icon" viewBox="0 0 24 24" fill="none" width={16} height={16}>
                <path d="M6 6 L18 18 M18 6 L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="chat-panel__list" ref={listRef}>
            {chatMessages.length === 0 && <p className="chat-panel__empty text-low">Aucun message pour l'instant — dites bonjour !</p>}
            {chatMessages.map((m) => (
              <div className={`chat-message${m.playerId === playerId ? ' chat-message--self' : ''}`} key={m.id}>
                <Avatar seed={avatarSeedFor(m.playerId)} name={m.name} />
                <div className="chat-message__body">
                  <div className="chat-message__name">{m.name}</div>
                  <div className="chat-message__text">{m.text}</div>
                </div>
              </div>
            ))}
          </div>

          <form className="chat-panel__form" onSubmit={handleSubmit}>
            <input
              className="input"
              type="text"
              maxLength={MESSAGE_MAX_LENGTH}
              placeholder="Écrire un message…"
              autoComplete="off"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <button className="icon-btn" type="submit" aria-label="Envoyer le message" disabled={!draft.trim()}>
              <svg className="icon" viewBox="0 0 24 24" fill="none" width={18} height={18}>
                <path d="M4 12 L20 4 L13 20 L11 13 L4 12 Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              </svg>
            </button>
          </form>
        </div>
      )}

      <button
        className="chat-toggle"
        type="button"
        aria-label={open ? 'Fermer le chat' : 'Ouvrir le chat'}
        aria-expanded={open}
        onClick={handleToggle}
      >
        <svg className="icon" viewBox="0 0 24 24" fill="none" width={22} height={22}>
          <path
            d="M4 5 h16 a1 1 0 0 1 1 1 v9 a1 1 0 0 1 -1 1 H9 l-4.4 3.3 A0.6 0.6 0 0 1 3.6 19 V6 a1 1 0 0 1 1 -1 Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
        {!open && chatUnreadCount > 0 && <span className="chat-toggle__badge">{chatUnreadCount > 9 ? '9+' : chatUnreadCount}</span>}
      </button>
    </div>
  );
}

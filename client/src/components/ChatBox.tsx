import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRoom } from '../socket/RoomProvider';
import { Avatar } from './Avatar';

const MESSAGE_MAX_LENGTH = 300;

// Chat texte libre entre joueurs d'une room — convenience pure, ne fait pas partie de la
// boucle de jeu (voir server/src/types.ts ChatMessage). Monté une seule fois par GameRoute,
// dans la pile de boutons flottants, pour rester disponible à toutes les phases.
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
    return (
      roomState!.players.find((p) => p.playerId === pid)?.avatarSeed ??
      roomState!.spectators.find((p) => p.playerId === pid)?.avatarSeed ??
      pid
    );
  }

  function handleToggle() {
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
    <>
      {open && (
        <div className="chat-panel" role="dialog" aria-label="Chat de la room">
          <div className="chat-panel__head">
            <span>Chat</span>
            <button className="icon-btn" type="button" aria-label="Fermer le chat" onClick={handleToggle}>
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M6 6 L18 18 M18 6 L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <div className="chat-panel__list" ref={listRef}>
            {chatMessages.length === 0 && <p className="text-low small text-center" style={{ margin: 'auto 0' }}>Aucun message — dites bonjour !</p>}
            {chatMessages.map((m) => (
              <div className={`chat-msg${m.playerId === playerId ? ' chat-msg--self' : ''}`} key={m.id}>
                <Avatar seed={avatarSeedFor(m.playerId)} name={m.name} size="sm" />
                <div style={{ minWidth: 0 }}>
                  <div className="chat-msg__name">{m.name}</div>
                  <div className="chat-msg__text">{m.text}</div>
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
              enterKeyHint="send"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <button className="icon-btn" type="submit" aria-label="Envoyer" disabled={!draft.trim()} style={{ width: 44, height: 44 }}>
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M4 12 L20 4 L13 20 L11 13 L4 12 Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              </svg>
            </button>
          </form>
        </div>
      )}
      <button className="fab" type="button" aria-label={open ? 'Fermer le chat' : 'Ouvrir le chat'} aria-expanded={open} onClick={handleToggle}>
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 5 h16 a1 1 0 0 1 1 1 v9 a1 1 0 0 1 -1 1 H9 l-4.4 3.3 A0.6 0.6 0 0 1 3.6 19 V6 a1 1 0 0 1 1 -1 Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
        {!open && chatUnreadCount > 0 && <span className="fab__badge">{chatUnreadCount > 9 ? '9+' : chatUnreadCount}</span>}
      </button>
    </>
  );
}

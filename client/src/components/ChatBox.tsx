import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRoom } from '../socket/RoomProvider';
import { Avatar } from './Avatar';

const MESSAGE_MAX_LENGTH = 300;
// À partir de cette largeur, le chat est un panneau fixe à droite, toujours ouvert.
const DOCK_QUERY = '(min-width: 1100px)';
const AFTERLIFE_PHASES = new Set(['reveal', 'discussion', 'voting', 'round_result', 'mrwhite_guess', 'hunter_shoot']);

// Chat texte libre entre joueurs d'une room — convenience pure, ne fait pas partie de la
// boucle de jeu (voir server/src/types.ts ChatMessage). Monté une seule fois par GameRoute,
// dans la pile de boutons flottants, pour rester disponible à toutes les phases.
export function ChatBox() {
  const { roomState, playerId, chatMessages, chatUnreadCount, markChatRead, sendChatMessage } = useRoom();
  const docked = useMediaQuery(DOCK_QUERY);
  const [toggled, setToggled] = useState(false);
  const open = docked || toggled;
  const [draft, setDraft] = useState('');
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [chatMessages, open]);

  // Panneau toujours visible : rien n'est jamais « non lu », et la page se décale pour ne
  // pas passer sous le chat.
  useEffect(() => {
    if (docked && chatUnreadCount > 0) markChatRead();
  }, [docked, chatUnreadCount, markChatRead]);

  useEffect(() => {
    if (!docked) return;
    document.body.classList.add('chat-docked');
    return () => document.body.classList.remove('chat-docked');
  }, [docked]);

  if (!roomState) return null;

  // Pendant une partie, un éliminé ou un spectateur n'écrit qu'aux autres éliminés et aux
  // spectateurs (le serveur filtre, ceci ne fait que l'annoncer).
  const inGame = AFTERLIFE_PHASES.has(roomState.phase);
  const me = roomState.players.find((p) => p.playerId === playerId);
  const writesToAfterlife = inGame && (!me || !me.alive);

  function authorOf(pid: string) {
    return roomState!.players.find((p) => p.playerId === pid) ?? roomState!.spectators.find((p) => p.playerId === pid);
  }

  function handleToggle() {
    setToggled((o) => !o);
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
        <div className={`chat-panel${docked ? ' chat-panel--docked' : ''}`} role={docked ? 'complementary' : 'dialog'} aria-label="Chat de la room">
          <div className="chat-panel__head">
            <span>{writesToAfterlife ? 'Chat des éliminés' : 'Chat'}</span>
            {!docked && (
              <button className="icon-btn" type="button" aria-label="Fermer le chat" onClick={handleToggle}>
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M6 6 L18 18 M18 6 L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>
          {writesToAfterlife && (
            <p className="chat-panel__note">Les vivants ne te lisent pas : seuls les éliminés et les spectateurs voient tes messages jusqu'à la fin de la partie.</p>
          )}
          <div className="chat-panel__list" ref={listRef}>
            {chatMessages.length === 0 && <p className="text-low small text-center" style={{ margin: 'auto 0' }}>Aucun message — dites bonjour !</p>}
            {chatMessages.map((m) => (
              <div className={`chat-msg${m.playerId === playerId ? ' chat-msg--self' : ''}${m.afterlife ? ' chat-msg--afterlife' : ''}`} key={m.id}>
                <Avatar seed={authorOf(m.playerId)?.avatarSeed ?? m.playerId} account={authorOf(m.playerId)?.account} name={m.name} size="sm" />
                <div style={{ minWidth: 0 }}>
                  <div className="chat-msg__name">
                    {m.name}
                    {m.afterlife && <span className="chat-msg__tag"> · éliminés</span>}
                  </div>
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
              placeholder={writesToAfterlife ? 'Écrire aux éliminés…' : 'Écrire un message…'}
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
      {!docked && (
      <button className="fab" type="button" aria-label={open ? 'Fermer le chat' : 'Ouvrir le chat'} aria-expanded={open} onClick={handleToggle}>
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 5 h16 a1 1 0 0 1 1 1 v9 a1 1 0 0 1 -1 1 H9 l-4.4 3.3 A0.6 0.6 0 0 1 3.6 19 V6 a1 1 0 0 1 1 -1 Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
        {!open && chatUnreadCount > 0 && <span className="fab__badge">{chatUnreadCount > 9 ? '9+' : chatUnreadCount}</span>}
      </button>
      )}
    </>
  );
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

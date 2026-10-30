import { useNavigate } from 'react-router-dom';
import { useRoom } from '../socket/RoomProvider';

// Visible uniquement pour l'hôte pendant une partie en cours. Un départ volontaire de l'hôte
// interrompt la partie pour tout le monde (voir docs/CONTRACT.md §5 et screens/GameAborted.tsx) ;
// le rôle d'hôte passe au joueur suivant, qui peut ramener tout le monde au salon.
export function HostQuitButton() {
  const { leaveRoom } = useRoom();
  const navigate = useNavigate();

  function handleQuit() {
    if (!window.confirm('Quitter maintenant interrompt la partie pour tous les joueurs. Confirmer ?')) return;
    leaveRoom();
    navigate('/', { replace: true });
  }

  return (
    <button className="icon-btn icon-btn--danger" type="button" aria-label="Quitter la partie (l'interrompt pour tous)" title="Quitter" onClick={handleQuit}>
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M9 4 H6 a2 2 0 0 0 -2 2 v12 a2 2 0 0 0 2 2 h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M15 16 L20 12 L15 8 M20 12 H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

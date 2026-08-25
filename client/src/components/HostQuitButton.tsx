import { useNavigate } from 'react-router-dom';
import { useRoom } from '../socket/RoomProvider';

// Visible uniquement pour l'hôte pendant une partie en cours (reveal → mrwhite_guess). Un
// départ volontaire de l'hôte à ce stade termine la partie pour tout le monde (voir
// docs/CONTRACT.md §5 et screens/GameAborted.tsx) — contrairement à une déconnexion
// accidentelle, qui transfère le rôle d'hôte pour laisser la partie continuer.
export function HostQuitButton() {
  const { leaveRoom } = useRoom();
  const navigate = useNavigate();

  function handleQuit() {
    if (!window.confirm('Quitter maintenant termine la partie pour tous les joueurs. Confirmer ?')) return;
    leaveRoom();
    navigate('/', { replace: true, viewTransition: true });
  }

  return (
    <button className="icon-btn" type="button" aria-label="Quitter la partie (la termine pour tous les joueurs)" onClick={handleQuit}>
      <svg className="icon" viewBox="0 0 24 24" fill="none" width={18} height={18}>
        <path d="M9 4 H6 a2 2 0 0 0 -2 2 v12 a2 2 0 0 0 2 2 h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M15 16 L20 12 L15 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M20 12 H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

import { useRoom } from '../socket/RoomProvider';

// Visible uniquement pour l'hôte pendant une partie en cours (reveal → mrwhite_guess). Relance
// immédiatement la partie en cours (nouveaux rôles/champions tirés, mêmes joueurs/réglages) —
// voir HostQuitButton.tsx pour le contrôle voisin qui termine la partie au lieu de la relancer.
export function HostRestartButton() {
  const { restartGame } = useRoom();

  function handleRestart() {
    if (!window.confirm('Relancer maintenant abandonne la manche en cours pour tous les joueurs et redistribue les rôles. Confirmer ?')) return;
    restartGame();
  }

  return (
    <button className="icon-btn" type="button" aria-label="Relancer la partie (redistribue les rôles pour tous)" onClick={handleRestart}>
      <svg className="icon" viewBox="0 0 24 24" fill="none" width={18} height={18}>
        <path
          d="M4 12 a8 8 0 1 1 2.34 5.66"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M4 17 V12 h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

import { useRoom } from '../socket/RoomProvider';

// Visible uniquement pour l'hôte pendant une partie en cours : relance immédiatement (nouvelle
// paire, nouveaux rôles, mêmes joueurs et réglages).
export function HostRestartButton() {
  const { restartGame } = useRoom();

  function handleRestart() {
    if (!window.confirm('Relancer abandonne la manche en cours pour tous et redistribue les rôles. Confirmer ?')) return;
    restartGame();
  }

  return (
    <button className="icon-btn" type="button" aria-label="Relancer la partie" title="Relancer" onClick={handleRestart}>
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M4 12 a8 8 0 1 1 2.34 5.66" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M4 17 V12 h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

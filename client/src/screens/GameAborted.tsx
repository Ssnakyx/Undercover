import { useNavigate } from 'react-router-dom';
import { useRoom } from '../socket/RoomProvider';
import { AppBar } from '../components/AppBar';
import { ActionBar } from '../components/ActionBar';

// Affiché quand l'hôte a explicitement quitté une partie en cours (bouton "Quitter", voir
// components/HostQuitButton.tsx) : phase serveur "aborted", terminale, sans vainqueur — voir
// docs/CONTRACT.md §5. Tous les autres joueurs atterrissent ici et ne peuvent que rentrer.
export function GameAborted() {
  const { roomState, leaveRoom } = useRoom();
  const navigate = useNavigate();

  if (!roomState) return null;

  const host = roomState.players.find((p) => p.isHost);

  function backToHome() {
    leaveRoom();
    navigate('/', { replace: true, viewTransition: true });
  }

  return (
    <div className="screen">
      <AppBar title="Partie terminée" />

      <main className="main">
        <div className="container">
          <div className="eliminated-block frame-cut frame-cut--lg">
            <span className="eyebrow">Partie interrompue</span>
            <div className="eliminated-block__name">
              {host ? `${host.name} (hôte) a quitté la partie` : "L'hôte a quitté la partie"}
            </div>
            <p className="text-mid" style={{ marginTop: 'var(--space-3)' }}>
              La partie est terminée pour tout le monde.
            </p>
          </div>
        </div>
      </main>

      <ActionBar>
        <button className="btn btn-primary" type="button" onClick={backToHome}>
          Retour à l'accueil
        </button>
      </ActionBar>
    </div>
  );
}

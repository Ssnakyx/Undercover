import { useNavigate } from 'react-router-dom';
import { useRoom } from '../socket/RoomProvider';
import { AppBar } from '../components/AppBar';
import { ActionBar } from '../components/ActionBar';

// Phase "aborted" : l'hôte a quitté en pleine partie. Le rôle d'hôte est passé au joueur
// suivant, qui peut ramener tout le monde au salon (avant : cul-de-sac pour toute la room).
export function GameAborted() {
  const { roomState, playerId, leaveRoom, backToLobby } = useRoom();
  const navigate = useNavigate();

  if (!roomState) return null;

  const isHost = roomState.players.find((p) => p.playerId === playerId)?.isHost ?? false;

  function backToHome() {
    leaveRoom();
    navigate('/', { replace: true });
  }

  return (
    <div className="screen" data-universe={roomState.universe}>
      <AppBar title="Partie interrompue" />

      <main className="main">
        <div className="container">
          <div className="hud-frame ko-block">
            <span className="safe-mark">PAUSE</span>
            <div className="ko-name">{roomState.abortedByName ? `${roomState.abortedByName} a quitté la partie` : "L'hôte a quitté la partie"}</div>
            <p className="text-mid">{isHost ? 'Tu es le nouvel hôte : ramène tout le monde au salon pour relancer.' : 'Le nouvel hôte peut vous ramener au salon.'}</p>
          </div>
        </div>
      </main>

      <ActionBar>
        {isHost && (
          <button className="btn btn-primary" type="button" onClick={backToLobby}>
            ▶ Retour au salon
          </button>
        )}
        <button className="btn btn-ghost" type="button" onClick={backToHome}>
          Quitter
        </button>
      </ActionBar>
    </div>
  );
}

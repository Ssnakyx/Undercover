import { useRoom } from '../socket/RoomProvider';
import { AppBar } from './AppBar';
import { HostQuitButton } from './HostQuitButton';
import { HostRestartButton } from './HostRestartButton';

/** Barre haute commune aux écrans de partie : titre de phase, round, contrôles de l'hôte. */
export function GameHud({ title }: { title: string }) {
  const { roomState, playerId } = useRoom();
  if (!roomState) return null;
  const isHost = roomState.players.find((p) => p.playerId === playerId)?.isHost ?? false;
  return (
    <AppBar
      title={title}
      right={
        <>
          <span className="badge badge--accent">Manche {Math.max(1, roomState.round)}</span>
          {isHost && <HostRestartButton />}
          {isHost && <HostQuitButton />}
        </>
      }
    />
  );
}

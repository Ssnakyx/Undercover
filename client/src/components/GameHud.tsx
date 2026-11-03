import { useRoom } from '../socket/RoomProvider';
import { AppBar } from './AppBar';
import { HostQuitButton } from './HostQuitButton';
import { HostRestartButton } from './HostRestartButton';

/** Barre haute commune aux écrans de partie : titre de phase, round, contrôles de l'hôte. */
export function GameHud({ title }: { title: string }) {
  const { roomState, playerId } = useRoom();
  if (!roomState) return null;
  const isHost = roomState.players.find((p) => p.playerId === playerId)?.isHost ?? false;
  const round = Math.max(1, roomState.round);
  return (
    <>
      {/* Grand chiffre de la manche, avec son étiquette verticale (styles/metaphor.css) */}
      <div className="round-numeral" aria-hidden="true">
        <span key={round} className="round-numeral__digit">
          {round}
        </span>
        <span className="round-numeral__label">Manche</span>
      </div>
      <AppBar
        title={title}
        right={
          <>
            <span className="badge badge--accent">Manche {round}</span>
            {isHost && <HostRestartButton />}
            {isHost && <HostQuitButton />}
          </>
        }
      />
    </>
  );
}

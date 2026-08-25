import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useRoom } from '../socket/RoomProvider';
import { Lobby } from '../screens/Lobby';
import { Reveal } from '../screens/Reveal';
import { Discussion } from '../screens/Discussion';
import { Voting } from '../screens/Voting';
import { RoundResult } from '../screens/RoundResult';
import { MrWhiteGuess } from '../screens/MrWhiteGuess';
import { HunterShoot } from '../screens/HunterShoot';
import { GameOver } from '../screens/GameOver';
import { GameAborted } from '../screens/GameAborted';
import { ChatBox } from '../components/ChatBox';

function LoadingScreen() {
  return (
    <div className="screen">
      <main className="main">
        <div className="container">
          <p className="text-mid text-center" style={{ marginTop: 'var(--space-9)' }}>
            Connexion à la partie…
          </p>
        </div>
      </main>
    </div>
  );
}

export function GameRoute() {
  const { roomCode: paramCode } = useParams();
  const { roomCode, connected, roomState, rejoinFromStorage } = useRoom();
  const navigate = useNavigate();
  const upper = paramCode?.toUpperCase();

  useEffect(() => {
    if (!upper) return;
    if (roomCode === upper) return;
    if (!connected) return;
    let cancelled = false;
    rejoinFromStorage(upper).then((ok) => {
      if (cancelled || ok) return;
      navigate('/', { replace: true });
    });
    return () => {
      cancelled = true;
    };
  }, [upper, roomCode, connected, rejoinFromStorage, navigate]);

  if (!upper || roomCode !== upper || !roomState) {
    return <LoadingScreen />;
  }

  return (
    <>
      <PhaseScreen phase={roomState.phase} />
      <ChatBox />
    </>
  );
}

function PhaseScreen({ phase }: { phase: string }) {
  switch (phase) {
    case 'lobby':
      return <Lobby />;
    case 'reveal':
      return <Reveal />;
    case 'discussion':
      return <Discussion />;
    case 'voting':
      return <Voting />;
    case 'round_result':
      return <RoundResult />;
    case 'mrwhite_guess':
      return <MrWhiteGuess />;
    case 'hunter_shoot':
      return <HunterShoot />;
    case 'game_over':
      return <GameOver />;
    case 'aborted':
      return <GameAborted />;
    default:
      return <LoadingScreen />;
  }
}

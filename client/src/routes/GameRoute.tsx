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
import { SpectatorView } from '../screens/SpectatorView';
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
  const { roomCode, connected, roomState, rejoinFromStorage, isSpectator } = useRoom();
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
      {/* key={phase} force le remount du wrapper à chaque changement de phase (reveal ->
          discussion -> voting -> ...), ce qui relance l'animation fade-in-up — sans ça le
          <div> persisterait et l'animation ne jouerait qu'une fois au tout premier mount. */}
      <div key={roomState.phase} className="phase-transition">
        {isSpectator ? <SpectatorView /> : <PhaseScreen phase={roomState.phase} />}
      </div>
      {/* Rideau d'hexagones — voir CONTRACT.md §8 "Motion" : seul moment où l'interface
          "parle" à la place des joueurs, entre deux actes. pointer-events:none (tokens.css
          .curtain), remonté par la même clé donc rejoué à chaque transition de phase. */}
      <div key={`curtain-${roomState.phase}`} className="curtain" aria-hidden="true">
        <span className="curtain__hex" />
        <span className="curtain__hex" />
        <span className="curtain__hex" />
      </div>
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

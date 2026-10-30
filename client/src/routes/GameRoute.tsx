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
import { MyWordButton } from '../components/MyWordButton';
import { useWakeLock } from '../hooks/useWakeLock';
import type { GamePhase } from '../types';

// Phases où un joueur a un rôle à consulter via "Mon mot".
const IN_GAME_PHASES = new Set<GamePhase>(['discussion', 'voting', 'round_result', 'mrwhite_guess', 'hunter_shoot']);

function LoadingScreen() {
  return (
    <div className="screen">
      <main className="main">
        <div className="loading">
          <span className="eyebrow">Loading</span>
          <p className="text-mid">
            Connexion à la partie<span className="loading__dots" />
          </p>
        </div>
      </main>
    </div>
  );
}

export function GameRoute() {
  const { roomCode: paramCode } = useParams();
  const { roomCode, connected, roomState, rejoinFromStorage, isSpectator, roleVersion, myRole } = useRoom();
  const navigate = useNavigate();
  const upper = paramCode?.toUpperCase();
  const phase = roomState?.phase;

  useWakeLock(!!phase && phase !== 'lobby' && phase !== 'game_over' && phase !== 'aborted');

  // Chaque phase repart du haut de l'écran (sinon le salon s'ouvrait scrollé là où on avait
  // laissé l'écran de fin de partie).
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [phase]);

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

  // La clé remonte l'écran à chaque changement de phase (animation d'entrée) ET à chaque
  // nouvelle distribution de rôles (relance pendant une révélation : l'écran repart de zéro).
  const screenKey = `${roomState.phase}-${roleVersion}`;
  const showMyWord = !isSpectator && !!myRole && IN_GAME_PHASES.has(roomState.phase);

  return (
    <>
      <div key={screenKey} className="phase-transition" data-universe={roomState.universe}>
        {isSpectator ? <SpectatorView /> : <PhaseScreen phase={roomState.phase} />}
      </div>
      <div key={`wipe-${roomState.phase}`} className="wipe" data-universe={roomState.universe} aria-hidden="true" />
      <div className="fab-stack" data-universe={roomState.universe}>
        {showMyWord && <MyWordButton />}
        <ChatBox />
      </div>
    </>
  );
}

function PhaseScreen({ phase }: { phase: GamePhase }) {
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

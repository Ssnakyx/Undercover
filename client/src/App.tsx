import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { RoomProvider } from './socket/RoomProvider';
import { IconDefs } from './components/IconDefs';
import { MainMenu } from './screens/MainMenu';
import { Home } from './screens/Home';
import { GameRoute } from './routes/GameRoute';

export default function App() {
  return (
    <RoomProvider>
      <IconDefs />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainMenu />} />
          <Route path="/play/:universe" element={<Home />} />
          <Route path="/room/:roomCode" element={<GameRoute />} />
        </Routes>
      </BrowserRouter>
    </RoomProvider>
  );
}

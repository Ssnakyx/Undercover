import { Analytics } from '@vercel/analytics/react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { RoomProvider } from './socket/RoomProvider';
import { IconDefs } from './components/IconDefs';
import { Toasts } from './components/Toasts';
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
      <Toasts />
      <Analytics />
    </RoomProvider>
  );
}

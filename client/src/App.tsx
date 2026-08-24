import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { RoomProvider } from './socket/RoomProvider';
import { IconDefs } from './components/IconDefs';
import { Home } from './screens/Home';
import { GameRoute } from './routes/GameRoute';

export default function App() {
  return (
    <RoomProvider>
      <IconDefs />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/room/:roomCode" element={<GameRoute />} />
        </Routes>
      </BrowserRouter>
    </RoomProvider>
  );
}

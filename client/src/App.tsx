import { Analytics } from '@vercel/analytics/react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { RoomProvider } from './socket/RoomProvider';
import { AccountProvider } from './socket/AccountProvider';
import { IconDefs } from './components/IconDefs';
import { Backdrop } from './components/Backdrop';
import { Toasts } from './components/Toasts';
import { RouteWipe } from './components/RouteWipe';
import { MainMenu } from './screens/MainMenu';
import { Home } from './screens/Home';
import { GameRoute } from './routes/GameRoute';
import { Profile } from './screens/Profile';

export default function App() {
  return (
    <AccountProvider>
      <RoomProvider>
        <IconDefs />
        <Backdrop />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<MainMenu />} />
            <Route path="/play/:universe" element={<Home />} />
            <Route path="/room/:roomCode" element={<GameRoute />} />
            <Route path="/compte" element={<Profile />} />
          </Routes>
          <RouteWipe />
        </BrowserRouter>
        <Toasts />
        <Analytics />
      </RoomProvider>
    </AccountProvider>
  );
}

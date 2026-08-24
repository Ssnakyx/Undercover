// Bootstrap Express + Socket.io — voir docs/CONTRACT.md section 1.
// CORS ouvert en dev : le client (Vite) tourne sur un autre port.

import http from 'node:http';
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import type { ClientToServerEvents, InterServerEvents, ServerToClientEvents, SocketData } from './socket/events.js';
import { registerSocketHandlers } from './socket/handlers.js';

const PORT = Number(process.env.PORT) || 3001;

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'lolcover-server', timestamp: Date.now() });
});

const httpServer = http.createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(httpServer, {
  cors: { origin: '*' },
});

registerSocketHandlers(io);

httpServer.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[lolcover-server] listening on http://localhost:${PORT}`);
});

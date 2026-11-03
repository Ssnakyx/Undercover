// Bootstrap Express + Socket.io — voir docs/CONTRACT.md section 1.
// CORS : ouvert par défaut ; ALLOWED_ORIGINS (liste séparée par des virgules, ex.
// "https://undercover.vercel.app,https://mon-domaine.fr") le restreint en production.

import http from 'node:http';
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import type { ClientToServerEvents, InterServerEvents, ServerToClientEvents, SocketData } from './socket/events.js';
import { registerSocketHandlers } from './socket/handlers.js';
import { installRateLimits } from './security/rateLimit.js';
import { prefetchGameCovers } from './content/gameInfo.js';
import { prefetchAnimeImages } from './content/animeImages.js';

const PORT = Number(process.env.PORT) || 3001;

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);
const corsOrigin: string | string[] = ALLOWED_ORIGINS.length > 0 ? ALLOWED_ORIGINS : '*';

const app = express();
app.set('trust proxy', true);
app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: '16kb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'lolcover-server', timestamp: Date.now() });
});

const httpServer = http.createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(httpServer, {
  cors: { origin: corsOrigin },
  // Les messages du jeu sont minuscules : 1 Mo par défaut ouvrirait la porte aux abus.
  maxHttpBufferSize: 32 * 1024,
});

installRateLimits(io);
registerSocketHandlers(io);

httpServer.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[lolcover-server] listening on http://localhost:${PORT}`);
  void prefetchGameCovers();
  void prefetchAnimeImages();
});

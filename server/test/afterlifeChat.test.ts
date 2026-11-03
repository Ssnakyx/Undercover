// Test d'intégration Socket.io : le chat des éliminés ne doit jamais atteindre les vivants
// pendant une partie (un mort voit toutes les cartes et pouvait révéler les rôles).

import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { Server } from 'socket.io';
import { io as connect, type Socket as ClientSocket } from 'socket.io-client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { registerSocketHandlers } from '../src/socket/handlers.js';
import { _resetRoomStoreForTests } from '../src/rooms/roomStore.js';

type Any = any; // eslint-disable-line @typescript-eslint/no-explicit-any

let httpServer: http.Server;
let ioServer: Server;
let url: string;
const clients: ClientSocket[] = [];

beforeAll(async () => {
  _resetRoomStoreForTests();
  httpServer = http.createServer();
  ioServer = new Server(httpServer);
  registerSocketHandlers(ioServer as Any);
  await new Promise<void>((resolve) => httpServer.listen(0, resolve));
  url = `http://localhost:${(httpServer.address() as AddressInfo).port}`;
});

afterAll(async () => {
  for (const c of clients) c.disconnect();
  ioServer.close();
  await new Promise<void>((resolve) => httpServer.close(() => resolve()));
  _resetRoomStoreForTests();
});

interface TestClient {
  socket: ClientSocket;
  name: string;
  playerId: string;
  champion: string | null;
  chat: Any[];
  state: Any;
}

function emit(socket: ClientSocket, event: string, payload: unknown = {}): Promise<Any> {
  return new Promise((resolve) => socket.emit(event, payload, resolve));
}

async function newClient(name: string): Promise<TestClient> {
  const socket = connect(url, { transports: ['websocket'], forceNew: true });
  clients.push(socket);
  const c: TestClient = { socket, name, playerId: '', champion: null, chat: [], state: null };
  socket.on('chat:message', (m: Any) => c.chat.push(m));
  socket.on('role:private', (r: Any) => (c.champion = r.champion));
  socket.on('room:state', (s: Any) => (c.state = s));
  await new Promise<void>((resolve) => socket.on('connect', () => resolve()));
  return c;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function until(cond: () => boolean, timeoutMs = 2000): Promise<void> {
  const start = Date.now();
  while (!cond()) {
    if (Date.now() - start > timeoutMs) throw new Error('timeout');
    await wait(10);
  }
}

describe('chat des éliminés', () => {
  it("un mort écrit seulement aux autres éliminés et aux spectateurs, jamais aux vivants", async () => {
    const names = ['Alice', 'Bob', 'Chloé', 'David', 'Emma'];
    const players: TestClient[] = [];
    for (const name of names) players.push(await newClient(name));
    const [host] = players;

    const created = await emit(host.socket, 'room:create', { hostName: 'Alice', universe: 'lol' });
    host.playerId = created.playerId;
    const roomCode = created.roomCode;
    for (const p of players.slice(1)) {
      const res = await emit(p.socket, 'room:join', { roomCode, playerName: p.name });
      p.playerId = res.playerId;
    }

    expect((await emit(host.socket, 'game:start')).ok).toBe(true);
    await until(() => players.every((p) => p.champion !== null));
    for (const p of players) await emit(p.socket, 'reveal:ack');
    await until(() => host.state?.phase === 'discussion');
    expect((await emit(host.socket, 'round:startVoting')).ok).toBe(true);

    // On élimine un civil (champion majoritaire) pour que la partie continue.
    const counts = new Map<string, number>();
    for (const p of players) counts.set(p.champion!, (counts.get(p.champion!) ?? 0) + 1);
    const civilChampion = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
    const victim = players.find((p) => p.champion === civilChampion && p !== host)!;
    for (const p of players) {
      const target = p === victim ? host.playerId : victim.playerId; // on ne vote pas contre soi
      await emit(p.socket, 'vote:submit', { targetPlayerId: target });
    }
    await until(() => host.state?.phase === 'round_result');

    const spectator = await newClient('Zoé');
    expect((await emit(spectator.socket, 'room:joinSpectator', { roomCode, playerName: 'Zoé' })).ok).toBe(true);

    const alive = players.filter((p) => p !== victim);
    for (const c of [...players, spectator]) c.chat.length = 0;

    expect((await emit(victim.socket, 'chat:send', { text: 'X est Undercover' })).ok).toBe(true);
    await until(() => spectator.chat.length === 1 && victim.chat.length === 1);
    await wait(100);
    expect(victim.chat[0]).toMatchObject({ text: 'X est Undercover', afterlife: true });
    expect(spectator.chat[0]).toMatchObject({ afterlife: true });
    for (const p of alive) expect(p.chat).toEqual([]);

    // Un vivant, lui, parle à tout le monde, morts et spectateurs compris.
    expect((await emit(host.socket, 'chat:send', { text: 'On vote qui ?' })).ok).toBe(true);
    await until(() => [...players, spectator].every((c) => c.chat.some((m: Any) => m.text === 'On vote qui ?')));
    expect(host.chat.find((m: Any) => m.text === 'On vote qui ?').afterlife).toBeUndefined();
  });
});

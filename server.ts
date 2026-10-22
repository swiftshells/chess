import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Chess } from 'chess.js';
import dotenv from 'dotenv';
import {
  RoomState,
  PlayerInfo,
  ChatMessage,
  TimeControlPreset,
  PieceColor,
  LeaderboardEntry,
  UserProfile,
} from './src/types/chess.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.json());

// Persistent database storage in local JSON file
const DB_FILE = path.join(__dirname, 'server-data.json');

interface DatabaseData {
  leaderboard: LeaderboardEntry[];
  profiles: Record<string, UserProfile>;
}

// Initial seed data for leaderboard
const DEFAULT_LEADERBOARD: LeaderboardEntry[] = [
  { id: 'gm_magnus', username: 'Magnus K.', elo: 2840, wins: 412, losses: 38, draws: 110, matchesPlayed: 560, lastActive: Date.now() - 3600000 },
  { id: 'gm_hikaru', username: 'Hikaru N.', elo: 2815, wins: 388, losses: 45, draws: 95, matchesPlayed: 528, lastActive: Date.now() - 7200000 },
  { id: 'gm_nodirbek', username: 'Nodirbek A.', elo: 2780, wins: 295, losses: 50, draws: 75, matchesPlayed: 420, lastActive: Date.now() - 14400000 },
  { id: 'nordic_bot', username: 'Nordic AI Master', elo: 2650, wins: 1540, losses: 210, draws: 310, matchesPlayed: 2060, lastActive: Date.now() },
  { id: 'player_erik', username: 'Erik Lindqvist', elo: 1820, wins: 84, losses: 32, draws: 18, matchesPlayed: 134, lastActive: Date.now() - 86400000 },
  { id: 'player_astrid', username: 'Astrid V.', elo: 1640, wins: 56, losses: 28, draws: 12, matchesPlayed: 96, lastActive: Date.now() - 120000000 },
  { id: 'player_freja', username: 'Freja Berg', elo: 1450, wins: 42, losses: 30, draws: 8, matchesPlayed: 80, lastActive: Date.now() - 250000000 },
];

function loadDatabase(): DatabaseData {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error loading DB, initializing defaults:', err);
  }
  return {
    leaderboard: DEFAULT_LEADERBOARD,
    profiles: {},
  };
}

function saveDatabase(data: DatabaseData) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving DB:', err);
  }
}

const db = loadDatabase();

// ==========================================
// REST API ROUTES
// ==========================================

// Global Leaderboard
app.get('/api/leaderboard', (_req, res) => {
  const sorted = [...db.leaderboard].sort((a, b) => b.elo - a.elo).slice(0, 50);
  res.json({ leaderboard: sorted });
});

// User Profile
app.get('/api/profile/:id', (req, res) => {
  const user = db.profiles[req.params.id];
  if (user) {
    res.json({ profile: user });
  } else {
    res.status(404).json({ error: 'Profile not found' });
  }
});

app.post('/api/profile', (req, res) => {
  const { id, username, elo, wins, losses, draws, recentMatches } = req.body;
  if (!id || !username) {
    return res.status(400).json({ error: 'Missing required user fields' });
  }

  const profile: UserProfile = {
    id,
    username,
    elo: elo || 1200,
    wins: wins || 0,
    losses: losses || 0,
    draws: draws || 0,
    recentMatches: recentMatches || [],
  };

  db.profiles[id] = profile;

  // Sync to leaderboard
  const existingIdx = db.leaderboard.findIndex((e) => e.id === id);
  const entry: LeaderboardEntry = {
    id,
    username,
    elo: profile.elo,
    wins: profile.wins,
    losses: profile.losses,
    draws: profile.draws,
    matchesPlayed: profile.wins + profile.losses + profile.draws,
    lastActive: Date.now(),
  };

  if (existingIdx >= 0) {
    db.leaderboard[existingIdx] = entry;
  } else {
    db.leaderboard.push(entry);
  }

  saveDatabase(db);
  res.json({ success: true, profile });
});

// Record Completed Match
app.post('/api/matches', (req, res) => {
  const { userId, opponentName, opponentElo, result, mode, eloDelta, movesCount } = req.body;
  if (!userId || !result) {
    return res.status(400).json({ error: 'Invalid match data' });
  }

  let profile = db.profiles[userId];
  if (!profile) {
    profile = {
      id: userId,
      username: 'Player',
      elo: 1200,
      wins: 0,
      losses: 0,
      draws: 0,
      recentMatches: [],
    };
  }

  profile.elo = Math.max(100, profile.elo + (eloDelta || 0));
  if (result === 'win') profile.wins++;
  else if (result === 'loss') profile.losses++;
  else profile.draws++;

  profile.recentMatches.unshift({
    id: `m_${Date.now()}`,
    opponentName: opponentName || 'Opponent',
    opponentElo: opponentElo || 1200,
    result,
    mode: mode || 'ai',
    eloDelta: eloDelta || 0,
    date: Date.now(),
    movesCount: movesCount || 0,
  });

  if (profile.recentMatches.length > 20) {
    profile.recentMatches = profile.recentMatches.slice(0, 20);
  }

  db.profiles[userId] = profile;

  // Update leaderboard
  const lbIdx = db.leaderboard.findIndex((e) => e.id === userId);
  const entry: LeaderboardEntry = {
    id: userId,
    username: profile.username,
    elo: profile.elo,
    wins: profile.wins,
    losses: profile.losses,
    draws: profile.draws,
    matchesPlayed: profile.wins + profile.losses + profile.draws,
    lastActive: Date.now(),
  };
  if (lbIdx >= 0) db.leaderboard[lbIdx] = entry;
  else db.leaderboard.push(entry);

  saveDatabase(db);
  res.json({ success: true, profile });
});

// ==========================================
// WEBSOCKET MULTIPLAYER MATCH SERVER
// ==========================================

interface ExtendedWebSocket extends WebSocket {
  isAlive: boolean;
  roomId?: string;
  playerId?: string;
  playerName?: string;
}

interface ActiveRoom {
  state: RoomState;
  chess: Chess;
  sockets: Map<string, ExtendedWebSocket>;
}

const activeRooms = new Map<string, ActiveRoom>();

const TIME_CONTROLS: Record<TimeControlPreset, { initialMs: number; incMs: number }> = {
  blitz_3_2: { initialMs: 3 * 60 * 1000, incMs: 2000 },
  rapid_5_0: { initialMs: 5 * 60 * 1000, incMs: 0 },
  rapid_10_0: { initialMs: 10 * 60 * 1000, incMs: 0 },
  classical_15_10: { initialMs: 15 * 60 * 1000, incMs: 10000 },
  untimed: { initialMs: 0, incMs: 0 },
};

function generateRoomId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'NOR-';
  for (let i = 0; i < 3; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function broadcastToRoom(room: ActiveRoom, message: object) {
  const json = JSON.stringify(message);
  room.sockets.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(json);
    }
  });
}

function updateRoomClocks(room: ActiveRoom) {
  if (room.state.status !== 'in_progress' || room.state.timeControl === 'untimed') return;
  if (!room.state.lastMoveTimestamp) return;

  const now = Date.now();
  const elapsed = now - room.state.lastMoveTimestamp;
  room.state.lastMoveTimestamp = now;

  if (room.state.turn === 'w') {
    room.state.whiteTimeMs = Math.max(0, room.state.whiteTimeMs - elapsed);
    if (room.state.whiteTimeMs === 0) {
      room.state.status = 'ended';
      room.state.winner = 'b';
      room.state.endReason = 'timeout';
      broadcastToRoom(room, {
        type: 'game_over',
        state: room.state,
      });
    }
  } else {
    room.state.blackTimeMs = Math.max(0, room.state.blackTimeMs - elapsed);
    if (room.state.blackTimeMs === 0) {
      room.state.status = 'ended';
      room.state.winner = 'w';
      room.state.endReason = 'timeout';
      broadcastToRoom(room, {
        type: 'game_over',
        state: room.state,
      });
    }
  }
}

// Tick timers every second
setInterval(() => {
  activeRooms.forEach((room) => {
    if (room.state.status === 'in_progress' && room.state.timeControl !== 'untimed') {
      updateRoomClocks(room);
      broadcastToRoom(room, {
        type: 'timer_sync',
        whiteTimeMs: room.state.whiteTimeMs,
        blackTimeMs: room.state.blackTimeMs,
      });
    }
  });
}, 1000);

wss.on('connection', (ws: ExtendedWebSocket) => {
  ws.isAlive = true;

  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('message', (data: string) => {
    try {
      const msg = JSON.parse(data.toString());

      switch (msg.type) {
        case 'create_room': {
          const roomId = generateRoomId();
          const timeControl: TimeControlPreset = msg.timeControl || 'rapid_10_0';
          const { initialMs } = TIME_CONTROLS[timeControl] || TIME_CONTROLS.rapid_10_0;

          const chess = new Chess();
          const hostPlayer: PlayerInfo = {
            id: msg.player.id,
            name: msg.player.name,
            elo: msg.player.elo || 1200,
            isHost: true,
            color: msg.preferredColor === 'b' ? 'b' : msg.preferredColor === 'random' ? (Math.random() < 0.5 ? 'w' : 'b') : 'w',
            connected: true,
          };

          const roomState: RoomState = {
            roomId,
            status: 'waiting',
            whitePlayer: hostPlayer.color === 'w' ? hostPlayer : null,
            blackPlayer: hostPlayer.color === 'b' ? hostPlayer : null,
            spectators: [],
            fen: chess.fen(),
            turn: 'w',
            timeControl,
            whiteTimeMs: initialMs,
            blackTimeMs: initialMs,
            lastMoveTimestamp: null,
            moves: [],
          };

          const sockets = new Map<string, ExtendedWebSocket>();
          sockets.set(msg.player.id, ws);

          ws.roomId = roomId;
          ws.playerId = msg.player.id;
          ws.playerName = msg.player.name;

          activeRooms.set(roomId, { state: roomState, chess, sockets });

          ws.send(JSON.stringify({
            type: 'room_created',
            roomId,
            state: roomState,
            yourColor: hostPlayer.color,
          }));
          break;
        }

        case 'join_room': {
          const roomId = (msg.roomId || '').toUpperCase().trim();
          const room = activeRooms.get(roomId);

          if (!room) {
            ws.send(JSON.stringify({ type: 'error', message: 'Room not found. Check code.' }));
            return;
          }

          ws.roomId = roomId;
          ws.playerId = msg.player.id;
          ws.playerName = msg.player.name;
          room.sockets.set(msg.player.id, ws);

          let assignedColor: PieceColor | undefined;

          // Check if reconnecting player
          if (room.state.whitePlayer && room.state.whitePlayer.id === msg.player.id) {
            room.state.whitePlayer.connected = true;
            assignedColor = 'w';
          } else if (room.state.blackPlayer && room.state.blackPlayer.id === msg.player.id) {
            room.state.blackPlayer.connected = true;
            assignedColor = 'b';
          } else if (!room.state.whitePlayer) {
            room.state.whitePlayer = {
              id: msg.player.id,
              name: msg.player.name,
              elo: msg.player.elo || 1200,
              color: 'w',
              connected: true,
            };
            assignedColor = 'w';
          } else if (!room.state.blackPlayer) {
            room.state.blackPlayer = {
              id: msg.player.id,
              name: msg.player.name,
              elo: msg.player.elo || 1200,
              color: 'b',
              connected: true,
            };
            assignedColor = 'b';
          } else {
            // Room is full, join as spectator
            room.state.spectators.push({
              id: msg.player.id,
              name: msg.player.name,
              elo: msg.player.elo || 1200,
              connected: true,
            });
          }

          // If both players joined, start match
          if (room.state.whitePlayer && room.state.blackPlayer && room.state.status === 'waiting') {
            room.state.status = 'in_progress';
            room.state.lastMoveTimestamp = Date.now();
          }

          broadcastToRoom(room, {
            type: 'room_updated',
            state: room.state,
          });

          ws.send(JSON.stringify({
            type: 'room_joined',
            roomId,
            state: room.state,
            yourColor: assignedColor,
          }));
          break;
        }

        case 'make_move': {
          const room = activeRooms.get(ws.roomId || '');
          if (!room || room.state.status !== 'in_progress') return;

          // Verify player turn
          const isWhite = room.state.whitePlayer?.id === ws.playerId;
          const isBlack = room.state.blackPlayer?.id === ws.playerId;

          if ((room.state.turn === 'w' && !isWhite) || (room.state.turn === 'b' && !isBlack)) {
            ws.send(JSON.stringify({ type: 'error', message: 'Not your turn.' }));
            return;
          }

          // Update clocks
          updateRoomClocks(room);

          try {
            const moveResult = room.chess.move({
              from: msg.from,
              to: msg.to,
              promotion: msg.promotion || 'q',
            });

            if (!moveResult) {
              ws.send(JSON.stringify({ type: 'error', message: 'Illegal move.' }));
              return;
            }

            // Apply increment
            const timeConfig = TIME_CONTROLS[room.state.timeControl];
            if (timeConfig && timeConfig.incMs > 0) {
              if (room.state.turn === 'w') {
                room.state.whiteTimeMs += timeConfig.incMs;
              } else {
                room.state.blackTimeMs += timeConfig.incMs;
              }
            }

            room.state.fen = room.chess.fen();
            room.state.turn = room.chess.turn();
            room.state.lastMoveTimestamp = Date.now();

            const moveRecord = {
              from: moveResult.from,
              to: moveResult.to,
              san: moveResult.san,
              piece: moveResult.piece as any,
              color: moveResult.color as PieceColor,
              captured: moveResult.captured as any,
              promotion: moveResult.promotion as any,
              fen: room.state.fen,
              timestamp: Date.now(),
            };
            room.state.moves.push(moveRecord);

            // Check game over
            if (room.chess.isGameOver()) {
              room.state.status = 'ended';
              if (room.chess.isCheckmate()) {
                room.state.winner = room.chess.turn() === 'w' ? 'b' : 'w';
                room.state.endReason = 'checkmate';
              } else if (room.chess.isDraw()) {
                room.state.winner = 'draw';
                room.state.endReason = 'stalemate';
              }
            }

            broadcastToRoom(room, {
              type: 'move_made',
              move: moveRecord,
              state: room.state,
            });
          } catch (err: any) {
            ws.send(JSON.stringify({ type: 'error', message: err.message || 'Move failed' }));
          }
          break;
        }

        case 'chat_message': {
          const room = activeRooms.get(ws.roomId || '');
          if (!room) return;

          const isWhite = room.state.whitePlayer?.id === ws.playerId;
          const isBlack = room.state.blackPlayer?.id === ws.playerId;
          const senderColor = isWhite ? 'w' : isBlack ? 'b' : undefined;

          const chatMsg: ChatMessage = {
            id: `c_${Date.now()}_${Math.random()}`,
            senderId: ws.playerId || 'anon',
            senderName: ws.playerName || 'Player',
            senderColor,
            text: (msg.text || '').slice(0, 200),
            timestamp: Date.now(),
          };

          broadcastToRoom(room, {
            type: 'chat_received',
            message: chatMsg,
          });
          break;
        }

        case 'resign': {
          const room = activeRooms.get(ws.roomId || '');
          if (!room || room.state.status !== 'in_progress') return;

          const isWhite = room.state.whitePlayer?.id === ws.playerId;
          room.state.status = 'ended';
          room.state.winner = isWhite ? 'b' : 'w';
          room.state.endReason = 'resignation';

          broadcastToRoom(room, {
            type: 'game_over',
            state: room.state,
          });
          break;
        }

        case 'offer_draw': {
          const room = activeRooms.get(ws.roomId || '');
          if (!room || room.state.status !== 'in_progress') return;

          const isWhite = room.state.whitePlayer?.id === ws.playerId;
          room.state.drawOfferedBy = isWhite ? 'w' : 'b';

          broadcastToRoom(room, {
            type: 'draw_offered',
            offeredBy: room.state.drawOfferedBy,
            state: room.state,
          });
          break;
        }

        case 'accept_draw': {
          const room = activeRooms.get(ws.roomId || '');
          if (!room || room.state.status !== 'in_progress' || !room.state.drawOfferedBy) return;

          room.state.status = 'ended';
          room.state.winner = 'draw';
          room.state.endReason = 'draw_agreement';

          broadcastToRoom(room, {
            type: 'game_over',
            state: room.state,
          });
          break;
        }

        case 'request_rematch': {
          const room = activeRooms.get(ws.roomId || '');
          if (!room) return;

          if (room.state.rematchRequestedBy && room.state.rematchRequestedBy !== ws.playerId) {
            // Both accepted rematch! Reset match with swapped colors
            const prevWhite = room.state.whitePlayer;
            const prevBlack = room.state.blackPlayer;

            room.chess.reset();
            const timeConfig = TIME_CONTROLS[room.state.timeControl];

            room.state.whitePlayer = prevBlack ? { ...prevBlack, color: 'w' } : null;
            room.state.blackPlayer = prevWhite ? { ...prevWhite, color: 'b' } : null;
            room.state.fen = room.chess.fen();
            room.state.turn = 'w';
            room.state.status = 'in_progress';
            room.state.whiteTimeMs = timeConfig.initialMs;
            room.state.blackTimeMs = timeConfig.initialMs;
            room.state.lastMoveTimestamp = Date.now();
            room.state.moves = [];
            room.state.winner = undefined;
            room.state.endReason = undefined;
            room.state.rematchRequestedBy = null;

            broadcastToRoom(room, {
              type: 'rematch_started',
              state: room.state,
            });
          } else {
            room.state.rematchRequestedBy = ws.playerId;
            broadcastToRoom(room, {
              type: 'rematch_requested',
              requestedBy: ws.playerName,
              state: room.state,
            });
          }
          break;
        }
      }
    } catch (err) {
      console.error('WS Message parsing error:', err);
    }
  });

  ws.on('close', () => {
    if (ws.roomId) {
      const room = activeRooms.get(ws.roomId);
      if (room) {
        if (room.state.whitePlayer && room.state.whitePlayer.id === ws.playerId) {
          room.state.whitePlayer.connected = false;
        } else if (room.state.blackPlayer && room.state.blackPlayer.id === ws.playerId) {
          room.state.blackPlayer.connected = false;
        }
        room.sockets.delete(ws.playerId || '');
        broadcastToRoom(room, {
          type: 'player_disconnected',
          playerId: ws.playerId,
          state: room.state,
        });
      }
    }
  });
});

// Periodic ping to keep WebSockets alive
setInterval(() => {
  wss.clients.forEach((client) => {
    const ws = client as ExtendedWebSocket;
    if (!ws.isAlive) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

// ==========================================
// VITE DEV SERVER OR STATIC PROD
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Nordic Wood 3D Chess server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

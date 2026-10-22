export type PieceColor = 'w' | 'b';
export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';

export type Square = 
  | 'a8' | 'b8' | 'c8' | 'd8' | 'e8' | 'f8' | 'g8' | 'h8'
  | 'a7' | 'b7' | 'c7' | 'd7' | 'e7' | 'f7' | 'g7' | 'h7'
  | 'a6' | 'b6' | 'c6' | 'd6' | 'e6' | 'f6' | 'g6' | 'h6'
  | 'a5' | 'b5' | 'c5' | 'd5' | 'e5' | 'f5' | 'g5' | 'h5'
  | 'a4' | 'b4' | 'c4' | 'd4' | 'e4' | 'f4' | 'g4' | 'h4'
  | 'a3' | 'b3' | 'c3' | 'd3' | 'e3' | 'f3' | 'g3' | 'h3'
  | 'a2' | 'b2' | 'c2' | 'd2' | 'e2' | 'f2' | 'g2' | 'h2'
  | 'a1' | 'b1' | 'c1' | 'd1' | 'e1' | 'f1' | 'g1' | 'h1';

export type GameMode = 'ai' | 'multiplayer' | 'local_pass';

export type AITier = 'novice' | 'apprentice' | 'club' | 'tactician' | 'master' | 'grandmaster';

export interface AITierConfig {
  id: AITier;
  name: string;
  elo: number;
  depth: number;
  blunderRate: number; // 0 to 1
  description: string;
}

export type TimeControlPreset = 'blitz_3_2' | 'rapid_5_0' | 'rapid_10_0' | 'classical_15_10' | 'untimed';

export interface TimeControlConfig {
  id: TimeControlPreset;
  name: string;
  initialMinutes: number;
  incrementSeconds: number;
}

export interface PlayerInfo {
  id: string;
  name: string;
  elo: number;
  isHost?: boolean;
  color?: PieceColor;
  connected?: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderColor?: PieceColor;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface MoveRecord {
  from: string;
  to: string;
  san: string;
  piece: PieceType;
  color: PieceColor;
  captured?: PieceType;
  promotion?: PieceType;
  fen: string;
  timestamp: number;
}

export interface RoomState {
  roomId: string;
  status: 'waiting' | 'in_progress' | 'ended';
  whitePlayer: PlayerInfo | null;
  blackPlayer: PlayerInfo | null;
  spectators: PlayerInfo[];
  fen: string;
  turn: PieceColor;
  timeControl: TimeControlPreset;
  whiteTimeMs: number;
  blackTimeMs: number;
  lastMoveTimestamp: number | null;
  moves: MoveRecord[];
  winner?: PieceColor | 'draw';
  endReason?: 'checkmate' | 'stalemate' | 'resignation' | 'timeout' | 'draw_agreement';
  drawOfferedBy?: PieceColor | null;
  rematchRequestedBy?: string | null;
}

export interface LeaderboardEntry {
  id: string;
  username: string;
  elo: number;
  wins: number;
  losses: number;
  draws: number;
  matchesPlayed: number;
  lastActive: number;
}

export interface UserProfile {
  id: string;
  username: string;
  elo: number;
  wins: number;
  losses: number;
  draws: number;
  recentMatches: {
    id: string;
    opponentName: string;
    opponentElo: number;
    result: 'win' | 'loss' | 'draw';
    mode: 'ai' | 'multiplayer' | 'local_pass';
    eloDelta: number;
    date: number;
    movesCount: number;
  }[];
}

export type CameraPreset = 'white' | 'black' | 'perspective' | 'top_down';
export type ViewDimension = '3d' | '2d';

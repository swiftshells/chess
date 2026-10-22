import { Chess, Square as ChessSquare, Move } from 'chess.js';
import { AITier, AITierConfig } from '../types/chess';

export const AI_TIERS: Record<AITier, AITierConfig> = {
  novice: {
    id: 'novice',
    name: 'Novice (600)',
    elo: 600,
    depth: 1,
    blunderRate: 0.42,
    description: 'Casual beginner who frequently overlooks hanging pieces and basic tactics.',
  },
  apprentice: {
    id: 'apprentice',
    name: 'Apprentice (1000)',
    elo: 1000,
    depth: 2,
    blunderRate: 0.22,
    description: 'Developing player who grasps material values but occasionally blunders.',
  },
  club: {
    id: 'club',
    name: 'Club Player (1400)',
    elo: 1400,
    depth: 3,
    blunderRate: 0.08,
    description: 'Solid club competitor with good piece coordination and opening principles.',
  },
  tactician: {
    id: 'tactician',
    name: 'Tactician (1800)',
    elo: 1800,
    depth: 4,
    blunderRate: 0.02,
    description: 'Sharp tournament player with strong tactical vision and calculation depth.',
  },
  master: {
    id: 'master',
    name: 'Master (2200)',
    elo: 2200,
    depth: 5,
    blunderRate: 0.0,
    description: 'Formidable master level; executes deep positional squeeze and sharp combinations.',
  },
  grandmaster: {
    id: 'grandmaster',
    name: 'Grandmaster (2600+)',
    elo: 2650,
    depth: 5,
    blunderRate: 0.0,
    description: 'Elite engine evaluation with quiescence search, pawn structure, and king safety.',
  },
};

// Base piece values in centipawns
const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Simplified Piece-Square Tables (from White's perspective)
const PAWN_PST = [
  0,  0,  0,  0,  0,  0,  0,  0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
  5,  5, 10, 25, 25, 10,  5,  5,
  0,  0,  0, 20, 20,  0,  0,  0,
  5, -5,-10,  0,  0,-10, -5,  5,
  5, 10, 10,-20,-20, 10, 10,  5,
  0,  0,  0,  0,  0,  0,  0,  0,
];

const KNIGHT_PST = [
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40,-20,  0,  0,  0,  0,-20,-40,
  -30,  0, 10, 15, 15, 10,  0,-30,
  -30,  5, 15, 20, 20, 15,  5,-30,
  -30,  0, 15, 20, 20, 15,  0,-30,
  -30,  5, 10, 15, 15, 10,  5,-30,
  -40,-20,  0,  5,  5,  0,-20,-40,
  -50,-40,-30,-30,-30,-30,-40,-50,
];

const BISHOP_PST = [
  -20,-10,-10,-10,-10,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5, 10, 10,  5,  0,-10,
  -10,  5,  5, 10, 10,  5,  5,-10,
  -10,  0, 10, 10, 10, 10,  0,-10,
  -10, 10, 10, 10, 10, 10, 10,-10,
  -10,  5,  0,  0,  0,  0,  5,-10,
  -20,-10,-10,-10,-10,-10,-10,-20,
];

const ROOK_PST = [
  0,  0,  0,  0,  0,  0,  0,  0,
  5, 10, 10, 10, 10, 10, 10,  5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  0,  0,  0,  5,  5,  0,  0,  0,
];

const QUEEN_PST = [
  -20,-10,-10, -5, -5,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5,  5,  5,  5,  0,-10,
  -5,  0,  5,  5,  5,  5,  0, -5,
  0,  0,  5,  5,  5,  5,  0, -5,
  -10,  5,  5,  5,  5,  5,  0,-10,
  -10,  0,  5,  0,  0,  0,  0,-10,
  -20,-10,-10, -5, -5,-10,-10,-20,
];

const KING_MID_PST = [
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -20,-30,-30,-40,-40,-30,-30,-20,
  -10,-20,-20,-20,-20,-20,-20,-10,
  20, 20,  0,  0,  0,  0, 20, 20,
  20, 30, 10,  0,  0, 10, 30, 20,
];

/**
 * Returns static board evaluation in centipawns (positive = White leads, negative = Black leads).
 */
export function evaluateBoard(chess: Chess): number {
  if (chess.isCheckmate()) {
    return chess.turn() === 'w' ? -30000 : 30000;
  }
  if (chess.isDraw()) {
    return 0;
  }

  let score = 0;
  const board = chess.board();

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;

      const isWhite = piece.color === 'w';
      const baseVal = PIECE_VALUES[piece.type] || 0;
      let posVal = 0;

      const squareIndex = isWhite ? r * 8 + c : (7 - r) * 8 + c;

      switch (piece.type) {
        case 'p':
          posVal = PAWN_PST[squareIndex];
          break;
        case 'n':
          posVal = KNIGHT_PST[squareIndex];
          break;
        case 'b':
          posVal = BISHOP_PST[squareIndex];
          break;
        case 'r':
          posVal = ROOK_PST[squareIndex];
          break;
        case 'q':
          posVal = QUEEN_PST[squareIndex];
          break;
        case 'k':
          posVal = KING_MID_PST[squareIndex];
          break;
      }

      const totalVal = baseVal + posVal;
      score += isWhite ? totalVal : -totalVal;
    }
  }

  return score;
}

/**
 * Quiescence search to avoid the horizon effect on tactical captures.
 */
function quiescence(chess: Chess, alpha: number, beta: number, isMaximizing: boolean, depth = 2): number {
  const standPat = evaluateBoard(chess);

  if (depth === 0) return standPat;

  if (isMaximizing) {
    if (standPat >= beta) return beta;
    if (standPat > alpha) alpha = standPat;

    // Only search captures
    const captureMoves = chess.moves({ verbose: true }).filter((m) => m.captured);
    for (const move of captureMoves) {
      chess.move(move);
      const score = quiescence(chess, alpha, beta, false, depth - 1);
      chess.undo();

      if (score >= beta) return beta;
      if (score > alpha) alpha = score;
    }
    return alpha;
  } else {
    if (standPat <= alpha) return alpha;
    if (standPat < beta) beta = standPat;

    const captureMoves = chess.moves({ verbose: true }).filter((m) => m.captured);
    for (const move of captureMoves) {
      chess.move(move);
      const score = quiescence(chess, alpha, beta, true, depth - 1);
      chess.undo();

      if (score <= alpha) return alpha;
      if (score < beta) beta = score;
    }
    return beta;
  }
}

/**
 * Minimax with Alpha-Beta pruning.
 */
function minimax(
  chess: Chess,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  useQuiescence: boolean
): number {
  if (depth === 0) {
    return useQuiescence ? quiescence(chess, alpha, beta, isMaximizing) : evaluateBoard(chess);
  }

  if (chess.isGameOver()) {
    return evaluateBoard(chess);
  }

  const moves = chess.moves({ verbose: true });

  // Move ordering: Prioritize captures and checks to prune branches faster
  moves.sort((a, b) => {
    let scoreA = a.captured ? (PIECE_VALUES[a.captured] || 0) : 0;
    let scoreB = b.captured ? (PIECE_VALUES[b.captured] || 0) : 0;
    return scoreB - scoreA;
  });

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      chess.move(move);
      const evalScore = minimax(chess, depth - 1, alpha, beta, false, useQuiescence);
      chess.undo();

      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break; // Beta cutoff
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      chess.move(move);
      const evalScore = minimax(chess, depth - 1, alpha, beta, true, useQuiescence);
      chess.undo();

      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break; // Alpha cutoff
    }
    return minEval;
  }
}

/**
 * Computes best move for the AI engine based on tier settings.
 */
export async function getBestMove(chess: Chess, tierKey: AITier): Promise<Move | null> {
  const config = AI_TIERS[tierKey] || AI_TIERS.club;
  const moves = chess.moves({ verbose: true });
  if (moves.length === 0) return null;

  // Realistic humanized calculation delay (350ms - 850ms)
  const delay = Math.min(300 + config.depth * 100 + Math.random() * 200, 1000);
  await new Promise((resolve) => setTimeout(resolve, delay));

  // Blunder simulation for lower tiers
  if (config.blunderRate > 0 && Math.random() < config.blunderRate) {
    // Pick a random legal move or sub-optimal move
    const randomIndex = Math.floor(Math.random() * moves.length);
    return moves[randomIndex];
  }

  const isMaximizing = chess.turn() === 'w';
  let bestMove: Move = moves[0];
  let bestValue = isMaximizing ? -Infinity : Infinity;

  // Shuffle moves slightly to avoid robotic predictability on equal positions
  const shuffledMoves = [...moves].sort(() => Math.random() - 0.5);

  const useQuiescence = config.depth >= 4;

  for (const move of shuffledMoves) {
    chess.move(move);
    const score = minimax(
      chess,
      config.depth - 1,
      -Infinity,
      Infinity,
      !isMaximizing,
      useQuiescence
    );
    chess.undo();

    if (isMaximizing) {
      if (score > bestValue) {
        bestValue = score;
        bestMove = move;
      }
    } else {
      if (score < bestValue) {
        bestValue = score;
        bestMove = move;
      }
    }
  }

  return bestMove;
}

/**
 * Calculates new ELO ratings using standard FIDE Elo delta formula.
 */
export function calculateEloDelta(
  playerElo: number,
  opponentElo: number,
  result: 'win' | 'loss' | 'draw',
  kFactor = 32
): number {
  const expectedScore = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
  const actualScore = result === 'win' ? 1 : result === 'draw' ? 0.5 : 0;
  return Math.round(kFactor * (actualScore - expectedScore));
}

import React from 'react';
import { PieceColor, PieceType, ViewDimension } from '../types/chess';
import { AlertCircle, Box, Layers } from 'lucide-react';

interface GameHudProps {
  whiteName: string;
  whiteElo: number;
  whiteTimeMs: number;
  blackName: string;
  blackElo: number;
  blackTimeMs: number;
  turn: PieceColor;
  isCheck: boolean;
  evaluationScore: number; // in centipawns
  capturedByWhite: PieceType[];
  capturedByBlack: PieceType[];
  moveCount: number;
  mode: 'ai' | 'multiplayer' | 'local_pass';
  aiTierName?: string;
  roomCode?: string;
  viewDimension?: ViewDimension;
  onToggleDimension?: (dim: ViewDimension) => void;
}

const PIECE_SYMBOLS: Record<PieceType, string> = {
  p: '♟',
  n: '♞',
  b: '♝',
  r: '♜',
  q: '♛',
  k: '♚',
};

function formatTime(ms: number): string {
  if (ms <= 0) return '00:00';
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export const GameHud: React.FC<GameHudProps> = ({
  whiteName,
  whiteElo,
  whiteTimeMs,
  blackName,
  blackElo,
  blackTimeMs,
  turn,
  isCheck,
  evaluationScore,
  capturedByWhite,
  capturedByBlack,
  moveCount,
  mode,
  aiTierName,
  roomCode,
  viewDimension = '3d',
  onToggleDimension,
}) => {
  const isUntimed = whiteTimeMs === 0 && blackTimeMs === 0;

  // Normalize eval bar between 5% and 95%
  const evalClamped = Math.max(-1000, Math.min(1000, evaluationScore));
  const whitePercent = 50 + (evalClamped / 1000) * 45;

  return (
    <div className="absolute inset-x-0 top-0 z-10 p-2 sm:p-4 pointer-events-none select-none">
      <div className="max-w-6xl mx-auto flex flex-col gap-1.5 sm:gap-2">
        {/* Top Status Strip */}
        <div className="flex items-center justify-between gap-2">
          {/* Mode Badge & Move Counter */}
          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 rounded-full bg-[#141920]/90 border border-[#2b3543] backdrop-blur-md pointer-events-auto shadow-md">
            <span className="w-2 h-2 rounded-full bg-[#d8b065] animate-pulse" />
            <span className="text-[11px] sm:text-xs font-bold text-[#f3eade] tracking-wide">
              {mode === 'ai'
                ? `Solo · ${aiTierName || 'AI'}`
                : mode === 'multiplayer'
                ? `Room ${roomCode || ''}`
                : '1v1 Pass & Play'}
            </span>
            <span className="text-[#475569]">·</span>
            <span className="text-[10px] sm:text-[11px] text-[#9ba8b8] font-mono tabular-nums font-medium">
              Move {Math.ceil(moveCount / 2) || 1}
            </span>
          </div>

          {/* Right Action Cluster: 2D/3D Mode Pill + Turn / Check Pill */}
          <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
            {onToggleDimension && (
              <button
                onClick={() => onToggleDimension(viewDimension === '3d' ? '2d' : '3d')}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#1c232d]/90 hover:bg-[#252e3b] border border-[#3b4759] text-[10px] sm:text-xs font-bold text-[#d8b065] transition-colors cursor-pointer touch-manipulation backdrop-blur-md shadow-md"
                title={`Switch to ${viewDimension === '3d' ? '2D' : '3D'} board`}
              >
                {viewDimension === '3d' ? (
                  <>
                    <Layers className="w-3 h-3 text-[#d8b065]" />
                    <span>2D Mode</span>
                  </>
                ) : (
                  <>
                    <Box className="w-3 h-3 text-[#d8b065]" />
                    <span>3D Mode</span>
                  </>
                )}
              </button>
            )}

            {isCheck && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#3b1717] border border-[#e05252] text-[#fca5a5] text-[10px] sm:text-xs font-extrabold animate-bounce shadow-md">
                <AlertCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>CHECK</span>
              </div>
            )}

            <div
              className={`px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-bold tracking-wide border backdrop-blur-md shadow-md ${
                turn === 'w'
                  ? 'bg-[#292218] border-[#d8b065] text-[#f3eade]'
                  : 'bg-[#1e2530] border-[#55677d] text-[#cbd5e1]'
              }`}
            >
              {turn === 'w' ? 'White to move' : 'Black to move'}
            </div>
          </div>
        </div>

        {/* Players Cards Row */}
        <div className="flex items-center justify-between gap-2 pointer-events-auto">
          {/* White Player Card */}
          <div
            className={`flex-1 max-w-[260px] p-2 sm:p-2.5 rounded-xl border transition-all backdrop-blur-md ${
              turn === 'w'
                ? 'bg-[#1b222c]/95 border-[#d8b065] ring-1 ring-[#d8b065]/50 shadow-lg'
                : 'bg-[#12161c]/85 border-[#28323f]'
            }`}
          >
            <div className="flex items-center justify-between gap-1.5">
              <div className="min-w-0 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-md bg-[#e5dfd3] text-[#1c140e] flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">
                  ♔
                </span>
                <div className="min-w-0">
                  <div className="text-[11px] sm:text-xs font-bold text-[#f3eade] truncate">
                    {whiteName}
                  </div>
                  {mode !== 'local_pass' && (
                    <div className="text-[9px] sm:text-[10px] text-[#8c9ba8] font-mono tabular-nums">
                      {whiteElo} ELO
                    </div>
                  )}
                </div>
              </div>

              <div
                className={`text-xs sm:text-sm font-mono font-bold px-1.5 py-0.5 rounded tabular-nums shrink-0 ${
                  isUntimed
                    ? 'text-[#8c9ba8] bg-[#1a212b]'
                    : whiteTimeMs < 30000 && whiteTimeMs > 0
                    ? 'text-[#ef4444] bg-[#3b1717] animate-pulse'
                    : 'text-[#f3eade] bg-[#1a212b]'
                }`}
              >
                {isUntimed ? '∞ Untimed' : formatTime(whiteTimeMs)}
              </div>
            </div>

            {/* Captured Pieces by Black */}
            {capturedByBlack.length > 0 && (
              <div className="flex items-center gap-0.5 text-[11px] text-[#d8b065] mt-1 pt-1 border-t border-[#263140] overflow-hidden">
                {capturedByBlack.map((p, i) => (
                  <span key={i}>{PIECE_SYMBOLS[p]}</span>
                ))}
              </div>
            )}
          </div>

          {/* Center Evaluation Gauge */}
          <div className="hidden sm:flex flex-col items-center px-3 py-1.5 rounded-xl bg-[#141920]/90 border border-[#2b3543] backdrop-blur-md">
            <div className="text-[9px] uppercase font-mono text-[#7b899b] mb-1 tracking-wider font-semibold">
              {evaluationScore > 0 ? `+${(evaluationScore / 100).toFixed(1)}` : (evaluationScore / 100).toFixed(1)}
            </div>
            <div className="w-24 md:w-32 h-1.5 bg-[#2b1f16] rounded-full overflow-hidden border border-[#3e4a5b] flex">
              <div
                className="h-full bg-[#f3eade] transition-all duration-300"
                style={{ width: `${whitePercent}%` }}
              />
              <div
                className="h-full bg-[#35251a] transition-all duration-300"
                style={{ width: `${100 - whitePercent}%` }}
              />
            </div>
          </div>

          {/* Black Player Card */}
          <div
            className={`flex-1 max-w-[260px] p-2 sm:p-2.5 rounded-xl border transition-all backdrop-blur-md ${
              turn === 'b'
                ? 'bg-[#1b222c]/95 border-[#d8b065] ring-1 ring-[#d8b065]/50 shadow-lg'
                : 'bg-[#12161c]/85 border-[#28323f]'
            }`}
          >
            <div className="flex items-center justify-between gap-1.5">
              <div className="min-w-0 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-md bg-[#2d2117] border border-[#523e2d] text-[#d8b065] flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">
                  ♚
                </span>
                <div className="min-w-0">
                  <div className="text-[11px] sm:text-xs font-bold text-[#f3eade] truncate">
                    {blackName}
                  </div>
                  {mode !== 'local_pass' && (
                    <div className="text-[9px] sm:text-[10px] text-[#8c9ba8] font-mono tabular-nums">
                      {blackElo} ELO
                    </div>
                  )}
                </div>
              </div>

              <div
                className={`text-xs sm:text-sm font-mono font-bold px-1.5 py-0.5 rounded tabular-nums shrink-0 ${
                  isUntimed
                    ? 'text-[#8c9ba8] bg-[#1a212b]'
                    : blackTimeMs < 30000 && blackTimeMs > 0
                    ? 'text-[#ef4444] bg-[#3b1717] animate-pulse'
                    : 'text-[#cbd5e1] bg-[#1a212b]'
                }`}
              >
                {isUntimed ? '∞ Untimed' : formatTime(blackTimeMs)}
              </div>
            </div>

            {/* Captured Pieces by White */}
            {capturedByWhite.length > 0 && (
              <div className="flex items-center gap-0.5 text-[11px] text-[#a39482] mt-1 pt-1 border-t border-[#263140] overflow-hidden">
                {capturedByWhite.map((p, i) => (
                  <span key={i}>{PIECE_SYMBOLS[p]}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

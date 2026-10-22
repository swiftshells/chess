import React from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Home, Sparkles } from 'lucide-react';
import { PieceColor } from '../types/chess';

interface GameOverModalProps {
  isOpen: boolean;
  winner?: PieceColor | 'draw';
  endReason?: string;
  playerColor?: PieceColor;
  eloDelta: number;
  newElo: number;
  mode?: 'ai' | 'multiplayer' | 'local_pass';
  onRematch: () => void;
  onExit: () => void;
  rematchRequestedByOther?: boolean;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  winner,
  endReason,
  playerColor = 'w',
  eloDelta,
  newElo,
  mode = 'ai',
  onRematch,
  onExit,
  rematchRequestedByOther = false,
}) => {
  const isDraw = winner === 'draw';
  const isLocal = mode === 'local_pass';
  const isWinner = !isDraw && winner === playerColor;

  React.useEffect(() => {
    if (isOpen && (isWinner || (isLocal && !isDraw))) {
      try {
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 },
          colors: ['#D8B065', '#EFE5D5', '#3A271C', '#62A06E'],
        });
      } catch {
        // ignore
      }
    }
  }, [isOpen, isWinner, isLocal, isDraw]);

  if (!isOpen) return null;

  let title = 'Game Finished';
  if (isLocal) {
    if (isDraw) title = 'Game Drawn!';
    else if (winner === 'w') title = 'Player 1 (White) Wins!';
    else title = 'Player 2 (Black) Wins!';
  } else {
    if (isDraw) title = 'Game Drawn';
    else if (isWinner) title = 'Victory!';
    else title = 'Defeat';
  }

  const reasonLabel = endReason
    ? endReason.replace(/_/g, ' ').toUpperCase()
    : 'MATCH CONCLUDED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-2xl bg-[#141920] border border-[#3b4759] shadow-2xl p-6 text-center">
        {/* Trophy / Emblem */}
        <div className="w-16 h-16 rounded-full bg-[#271d15] border border-[#d8b065]/50 flex items-center justify-center mx-auto mb-4 text-[#d8b065] shadow-lg">
          {isDraw ? <Sparkles className="w-8 h-8" /> : <Trophy className="w-8 h-8" />}
        </div>

        <h2 className="text-2xl font-extrabold tracking-tight text-[#f3eade] mb-1">
          {title}
        </h2>
        <p className="text-xs font-semibold text-[#8c9ba8] tracking-widest uppercase mb-5">
          {reasonLabel}
        </p>

        {/* ELO Result Card (Hidden for local pass & play casual mode) */}
        {!isLocal && (
          <div className="p-4 rounded-xl bg-[#1b222c] border border-[#2b3543] mb-5">
            <div className="text-[11px] text-[#8c9ba8] uppercase font-semibold">Updated Rating</div>
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className="text-2xl font-extrabold font-mono text-[#d8b065]">
                {newElo}
              </span>
              <span
                className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                  eloDelta > 0
                    ? 'bg-[#1e3323] text-[#62a06e]'
                    : eloDelta < 0
                    ? 'bg-[#331c1e] text-[#e05252]'
                    : 'bg-[#252e3b] text-[#8c9ba8]'
                }`}
              >
                {eloDelta >= 0 ? `+${eloDelta}` : eloDelta}
              </span>
            </div>
          </div>
        )}

        {rematchRequestedByOther && (
          <div className="text-xs text-[#d8b065] font-semibold mb-4 animate-pulse">
            Opponent requested a rematch!
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={onRematch}
            className="w-full py-3.5 rounded-xl bg-[#d8b065] hover:bg-[#e8be72] active:scale-[0.98] text-[#1a120b] font-bold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#d8b065]/20 min-h-[46px]"
          >
            <RotateCcw className="w-4 h-4" />
            <span>PLAY AGAIN / REMATCH</span>
          </button>

          <button
            onClick={onExit}
            className="w-full py-2.5 rounded-xl bg-[#1c232d] hover:bg-[#252e3b] border border-[#2b3543] text-xs font-semibold text-[#8c9ba8] hover:text-[#f3eade] transition-colors flex items-center justify-center gap-2 cursor-pointer min-h-[40px]"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Main Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
};

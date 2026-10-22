import React from 'react';
import { PieceType, PieceColor } from '../types/chess';

interface PromotionModalProps {
  isOpen: boolean;
  color: PieceColor;
  onSelectPiece: (piece: PieceType) => void;
}

export const PromotionModal: React.FC<PromotionModalProps> = ({
  isOpen,
  color,
  onSelectPiece,
}) => {
  if (!isOpen) return null;

  const pieces: { type: PieceType; name: string; symbol: string }[] = [
    { type: 'q', name: 'Queen', symbol: color === 'w' ? '♕' : '♛' },
    { type: 'r', name: 'Rook', symbol: color === 'w' ? '♖' : '♜' },
    { type: 'b', name: 'Bishop', symbol: color === 'w' ? '♗' : '♝' },
    { type: 'n', name: 'Knight', symbol: color === 'w' ? '♘' : '♞' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-2xl bg-[#141920] border border-[#d8b065]/60 shadow-2xl p-6 text-center">
        <h3 className="text-base font-bold text-[#f3eade] mb-1">Pawn Promotion</h3>
        <p className="text-xs text-[#8c9ba8] mb-5">Choose piece to promote your pawn to</p>

        <div className="grid grid-cols-4 gap-3">
          {pieces.map((p) => (
            <button
              key={p.type}
              onClick={() => onSelectPiece(p.type)}
              className="p-3 rounded-xl bg-[#1b222c] hover:bg-[#283242] border border-[#3b4759] hover:border-[#d8b065] transition-all flex flex-col items-center gap-1 group cursor-pointer"
            >
              <span className="text-3xl text-[#d8b065] group-hover:scale-110 transition-transform">
                {p.symbol}
              </span>
              <span className="text-xs font-semibold text-[#f3eade]">{p.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Square, PieceColor, PieceType } from '../types/chess';
import { ChessPiece2D } from './ChessPieces2D';
import { RotateCcw } from 'lucide-react';

interface ChessBoard2DProps {
  fen: string;
  turn: PieceColor;
  playerColor: PieceColor;
  gameMode: 'ai' | 'multiplayer' | 'local_pass';
  selectedSquare: Square | null;
  legalMoves: Square[];
  lastMove: { from: Square; to: Square } | null;
  isCheck: boolean;
  onSquareClicked: (sq: Square) => void;
  isMatchEnded?: boolean;
}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['1', '2', '3', '4', '5', '6', '7', '8'];

export const ChessBoard2D: React.FC<ChessBoard2DProps> = ({
  fen,
  turn,
  playerColor,
  gameMode,
  selectedSquare,
  legalMoves,
  lastMove,
  isCheck,
  onSquareClicked,
  isMatchEnded = false,
}) => {
  // Allow manual flip or default to player color (Black at bottom if player is Black)
  const defaultOrientation: PieceColor = playerColor === 'b' ? 'b' : 'w';
  const [boardOrientation, setBoardOrientation] = useState<PieceColor>(defaultOrientation);

  // Sync orientation if player color changes
  React.useEffect(() => {
    setBoardOrientation(playerColor === 'b' ? 'b' : 'w');
  }, [playerColor]);

  // Parse FEN into 8x8 board matrix
  const boardMatrix: ({ type: PieceType; color: PieceColor } | null)[][] = Array(8)
    .fill(null)
    .map(() => Array(8).fill(null));

  const [positionPart] = fen.split(' ');
  const rows = positionPart.split('/');

  rows.forEach((rowStr, rIdx) => {
    let cIdx = 0;
    for (let i = 0; i < rowStr.length; i++) {
      const char = rowStr[i];
      if (char >= '1' && char <= '8') {
        cIdx += parseInt(char, 10);
      } else {
        const color: PieceColor = char === char.toUpperCase() ? 'w' : 'b';
        const type = char.toLowerCase() as PieceType;
        boardMatrix[rIdx][cIdx] = { type, color };
        cIdx++;
      }
    }
  });

  // Find King square if in check
  let checkKingSquare: Square | null = null;
  if (isCheck) {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = boardMatrix[r][c];
        if (p && p.type === 'k' && p.color === turn) {
          checkKingSquare = `${FILES[c]}${8 - r}` as Square;
        }
      }
    }
  }

  // Display ranks and files according to orientation
  const displayedRanks = boardOrientation === 'w' ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
  const displayedFiles = boardOrientation === 'w' ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];

  const handleSquareClick = (sq: Square) => {
    if (isMatchEnded) return;
    onSquareClicked(sq);
  };

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full p-2 pointer-events-auto select-none">
      {/* 2D Board Frame Container */}
      <div className="relative w-full max-w-[min(90vw,68vh,560px)] aspect-square p-2 sm:p-3 rounded-2xl bg-[#1d150f] border-2 border-[#3d2d20] shadow-[0_20px_50px_rgba(0,0,0,0.85)] flex flex-col">
        {/* Brass Inlay Border Accent */}
        <div className="relative w-full h-full rounded-xl overflow-hidden border border-[#d8b065]/50 shadow-inner flex flex-col bg-[#140e0a]">
          {/* 8x8 Grid */}
          <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
            {displayedRanks.map((r) =>
              displayedFiles.map((c) => {
                const sq = `${FILES[c]}${r + 1}` as Square;
                const isLight = (c + r) % 2 === 1;
                const piece = boardMatrix[7 - r][c];

                const isSelected = selectedSquare === sq;
                const isLegalTarget = legalMoves.includes(sq);
                const isLastMoveFrom = lastMove?.from === sq;
                const isLastMoveTo = lastMove?.to === sq;
                const isKingInCheck = checkKingSquare === sq;

                // Edge coordinate coordinates
                const isLeftEdge = displayedFiles[0] === c;
                const isBottomEdge = displayedRanks[7] === r;

                return (
                  <button
                    key={sq}
                    type="button"
                    onClick={() => handleSquareClick(sq)}
                    className={`relative w-full h-full flex items-center justify-center p-1 sm:p-1.5 transition-colors cursor-pointer touch-manipulation focus:outline-none ${
                      isLight
                        ? 'bg-[#EADECC] text-[#2c1d13]'
                        : 'bg-[#674834] text-[#F3EADE]'
                    } ${
                      isSelected
                        ? 'ring-4 ring-inset ring-[#d8b065] z-10'
                        : isKingInCheck
                        ? 'ring-4 ring-inset ring-[#ef4444] bg-[#a83232] z-10'
                        : isLastMoveFrom || isLastMoveTo
                        ? 'after:absolute after:inset-0 after:bg-[#d8b065]/30'
                        : ''
                    }`}
                  >
                    {/* Rank coordinate (top-left) */}
                    {isLeftEdge && (
                      <span
                        className={`absolute top-0.5 left-1 text-[9px] sm:text-[10px] font-bold font-mono pointer-events-none ${
                          isLight ? 'text-[#846b57]' : 'text-[#d6beaa]'
                        }`}
                      >
                        {r + 1}
                      </span>
                    )}

                    {/* File coordinate (bottom-right) */}
                    {isBottomEdge && (
                      <span
                        className={`absolute bottom-0.5 right-1 text-[9px] sm:text-[10px] font-bold font-mono pointer-events-none ${
                          isLight ? 'text-[#846b57]' : 'text-[#d6beaa]'
                        }`}
                      >
                        {FILES[c]}
                      </span>
                    )}

                    {/* Piece Rendering */}
                    {piece && (
                      <div className="relative z-10 w-full h-full flex items-center justify-center drop-shadow-md">
                        <ChessPiece2D type={piece.type} color={piece.color} />
                      </div>
                    )}

                    {/* Legal Target Overlay */}
                    {isLegalTarget && (
                      <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                        {piece ? (
                          // Capture Target: Distinct bracket/ring
                          <div className="w-[84%] h-[84%] rounded-full border-4 border-[#d8b065] opacity-90 animate-pulse" />
                        ) : (
                          // Move Target: Clean centered dot
                          <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#271d15]/50 border-2 border-[#d8b065] shadow-sm" />
                        )}
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Board Bottom Controls (Flip Orientation & Active Turn indicator) */}
        <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-[#a39482]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#d8b065]" />
            <span className="font-semibold text-[#f3eade]">
              {boardOrientation === 'w' ? 'White Perspective' : 'Black Perspective'}
            </span>
          </div>

          <button
            onClick={() => setBoardOrientation(boardOrientation === 'w' ? 'b' : 'w')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#271d15] hover:bg-[#382618] border border-[#3d2d20] hover:border-[#d8b065]/60 text-[#f3eade] text-[10px] sm:text-xs font-semibold transition-colors cursor-pointer touch-manipulation"
            title="Flip Board View"
          >
            <RotateCcw className="w-3 h-3 text-[#d8b065]" />
            <span>Flip Board</span>
          </button>
        </div>
      </div>
    </div>
  );
};

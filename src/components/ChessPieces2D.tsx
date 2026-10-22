import React from 'react';
import { PieceType, PieceColor } from '../types/chess';

interface Piece2DProps {
  type: PieceType;
  color: PieceColor;
  className?: string;
}

export const ChessPiece2D: React.FC<Piece2DProps> = ({ type, color, className = 'w-full h-full' }) => {
  const isWhite = color === 'w';

  // Nordic Birch for White, Smoked Walnut for Black
  const fill = isWhite ? '#F8F5EE' : '#231812';
  const stroke = isWhite ? '#3F2C1F' : '#D8B065';
  const secondary = isWhite ? '#E4D8C4' : '#170F0A';
  const highlight = isWhite ? '#FFFFFF' : '#3F2C1F';

  switch (type) {
    case 'p':
      return (
        <svg viewBox="0 0 45 45" className={className} xmlns="http://www.w3.org/2000/svg">
          {/* Base */}
          <path
            d="M 11,38 C 11,35 15,35 22.5,35 C 30,35 34,35 34,38 C 34,39 33,40 22.5,40 C 12,40 11,39 11,38 Z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Stem & Collar */}
          <path
            d="M 16,35 C 16,30 19,25 20,21 C 18,21 17,20 17,19 C 17,18 19,18 22.5,18 C 26,18 28,18 28,19 C 28,20 27,21 25,21 C 26,25 29,30 29,35 Z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Head dome */}
          <circle
            cx="22.5"
            cy="12.5"
            r="6"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
          />
          {/* Highlight sheen */}
          <path
            d="M 21,9.5 C 21,9.5 24,9.5 25,12"
            fill="none"
            stroke={highlight}
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'r':
      return (
        <svg viewBox="0 0 45 45" className={className} xmlns="http://www.w3.org/2000/svg">
          {/* Base */}
          <path
            d="M 9,39 L 36,39 L 35,35 L 10,35 Z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Lower plinth */}
          <path
            d="M 12,35 L 33,35 L 32,31 L 13,31 Z"
            fill={secondary}
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Tower shaft */}
          <path
            d="M 14,31 L 31,31 L 30,17 L 15,17 Z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Corbel & Battlements */}
          <path
            d="M 11,17 L 34,17 L 34,10 L 30,10 L 30,13 L 25,13 L 25,10 L 20,10 L 20,13 L 15,13 L 15,10 L 11,10 Z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Center crenel line */}
          <line x1="12" y1="17" x2="33" y2="17" stroke={stroke} strokeWidth="1.2" />
        </svg>
      );

    case 'n':
      return (
        <svg viewBox="0 0 45 45" className={className} xmlns="http://www.w3.org/2000/svg">
          {/* Base */}
          <path
            d="M 9,39 L 36,39 C 36,35 32,35 30,35 C 24,35 15,35 15,35 C 13,35 9,35 9,39 Z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Sculpted horse head & mane */}
          <path
            d="M 22,10 C 22,10 17,11 14,15 C 11,19 12,23 13,24 C 14,25 15,24 16,23 C 14,27 15,30 18,33 C 21,35 27,35 30,35 C 32,31 32,23 32,18 C 32,12 28,10 22,10 Z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Snout and jaw */}
          <path
            d="M 14,18 C 12,19 9,21 9,24 C 9,26 12,27 15,25"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Eye */}
          <circle cx="17.5" cy="17.5" r="1.5" fill={stroke} />
          {/* Mane ridges */}
          <path
            d="M 25,12 C 27,14 28,16 29,19"
            fill="none"
            stroke={stroke}
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <path
            d="M 27,17 C 29,19 29.5,22 30,25"
            fill="none"
            stroke={stroke}
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'b':
      return (
        <svg viewBox="0 0 45 45" className={className} xmlns="http://www.w3.org/2000/svg">
          {/* Base */}
          <path
            d="M 10,39 L 35,39 C 35,35 31,35 29,35 C 24,35 21,35 16,35 C 14,35 10,35 10,39 Z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Collar ring */}
          <path
            d="M 15,35 C 15,31 17,28 19,25 C 18,25 17,24 17,23 C 17,22 19,22 22.5,22 C 26,22 28,22 28,23 C 28,24 27,25 26,25 C 28,28 30,31 30,35 Z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Miter body */}
          <path
            d="M 16,22 C 14,18 16,11 22.5,9 C 29,11 31,18 29,22 Z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Miter cut slot */}
          <path
            d="M 20,13 L 26,17"
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          {/* Top finial orb */}
          <circle cx="22.5" cy="7.5" r="2" fill={fill} stroke={stroke} strokeWidth="1.2" />
        </svg>
      );

    case 'q':
      return (
        <svg viewBox="0 0 45 45" className={className} xmlns="http://www.w3.org/2000/svg">
          {/* Base */}
          <path
            d="M 9,39 L 36,39 C 36,35 32,35 30,35 C 24,35 21,35 15,35 C 13,35 9,35 9,39 Z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Lower waist & plinth */}
          <path
            d="M 12,35 L 33,35 L 31,31 L 14,31 Z"
            fill={secondary}
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Flared dress */}
          <path
            d="M 13,31 C 15,26 18,22 18,19 L 27,19 C 27,22 30,26 32,31 Z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Crown spikes */}
          <path
            d="M 11,15 L 14,24 L 31,24 L 34,15 L 28,21 L 22.5,13 L 17,21 Z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Pearls on crown spikes */}
          <circle cx="11" cy="14" r="1.8" fill={stroke} />
          <circle cx="17" cy="12" r="1.8" fill={stroke} />
          <circle cx="22.5" cy="10" r="2.2" fill={stroke} />
          <circle cx="28" cy="12" r="1.8" fill={stroke} />
          <circle cx="34" cy="14" r="1.8" fill={stroke} />
        </svg>
      );

    case 'k':
      return (
        <svg viewBox="0 0 45 45" className={className} xmlns="http://www.w3.org/2000/svg">
          {/* Base */}
          <path
            d="M 9,39 L 36,39 C 36,35 32,35 30,35 C 24,35 21,35 15,35 C 13,35 9,35 9,39 Z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Lower waist */}
          <path
            d="M 12,35 L 33,35 L 31,31 L 14,31 Z"
            fill={secondary}
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Robust stem */}
          <path
            d="M 14,31 C 16,25 18,21 18,18 L 27,18 C 27,21 29,25 31,31 Z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Imperial Arched Head */}
          <path
            d="M 14,18 C 14,13 18,11 22.5,11 C 27,11 31,13 31,18 Z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Nordic Cross Finial */}
          <line x1="22.5" y1="5" x2="22.5" y2="11" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
          <line x1="19.5" y1="7.5" x2="25.5" y2="7.5" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    default:
      return null;
  }
};

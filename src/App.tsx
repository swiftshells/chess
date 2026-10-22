import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Chess, Square as ChessSquare } from 'chess.js';
import { ChessSceneManager } from './3d/ChessScene';
import { sounds } from './audio/SoundManager';
import { getBestMove, evaluateBoard, calculateEloDelta, AI_TIERS } from './engine/chessEngine';
import {
  Square,
  PieceColor,
  PieceType,
  CameraPreset,
  UserProfile,
  AITier,
  TimeControlPreset,
  ChatMessage,
  MoveRecord,
  RoomState,
  ViewDimension,
} from './types/chess';

import { TitleScreen } from './components/TitleScreen';
import { GameHud } from './components/GameHud';
import { BottomDock } from './components/BottomDock';
import { ChatDrawer } from './components/ChatDrawer';
import { MultiplayerModal } from './components/MultiplayerModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { ProfileModal } from './components/ProfileModal';
import { PromotionModal } from './components/PromotionModal';
import { GameOverModal } from './components/GameOverModal';
import { ChessBoard2D } from './components/ChessBoard2D';

// Storage key for user profile
const PROFILE_KEY = 'nordic_chess_profile';

function getInitialProfile(): UserProfile {
  try {
    const saved = localStorage.getItem(PROFILE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // ignore
  }
  const id = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const defaultProf: UserProfile = {
    id,
    username: `Tactician_${Math.floor(100 + Math.random() * 900)}`,
    elo: 1200,
    wins: 0,
    losses: 0,
    draws: 0,
    recentMatches: [],
  };
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(defaultProf));
  } catch {
    // ignore
  }
  return defaultProf;
}

export default function App() {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<ChessSceneManager | null>(null);

  // Core Game State
  const chessRef = useRef<Chess>(new Chess());
  const [inGame, setInGame] = useState(false);
  const [gameMode, setGameMode] = useState<'ai' | 'multiplayer' | 'local_pass'>('ai');
  const [aiTier, setAiTier] = useState<AITier>('club');
  const [playerColor, setPlayerColor] = useState<PieceColor>('w');
  const [turn, setTurn] = useState<PieceColor>('w');
  const [isCheck, setIsCheck] = useState(false);
  const [evaluation, setEvaluation] = useState(0);
  const [moveCount, setMoveCount] = useState(0);
  const [movesHistory, setMovesHistory] = useState<MoveRecord[]>([]);
  const [capturedWhite, setCapturedWhite] = useState<PieceType[]>([]);
  const [capturedBlack, setCapturedBlack] = useState<PieceType[]>([]);

  // Match lifecycle guards
  const [isMatchEnded, setIsMatchEnded] = useState(false);
  const isMatchEndedRef = useRef(false);

  // Selection & Promotion
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<Square[]>([]);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Square; to: Square } | null>(null);

  // Mutable refs to decouple Three.js canvas from React state churn
  const selectedSquareRef = useRef<Square | null>(null);
  const legalMovesRef = useRef<Square[]>([]);
  const inGameRef = useRef(false);
  const gameModeRef = useRef<'ai' | 'multiplayer' | 'local_pass'>('ai');
  const playerColorRef = useRef<PieceColor>('w');
  const handleSquareClickedRef = useRef<(sq: Square) => void>(() => {});

  useEffect(() => {
    inGameRef.current = inGame;
    gameModeRef.current = gameMode;
    playerColorRef.current = playerColor;
  }, [inGame, gameMode, playerColor]);

  // Clocks
  const [whiteTimeMs, setWhiteTimeMs] = useState(10 * 60 * 1000);
  const [blackTimeMs, setBlackTimeMs] = useState(10 * 60 * 1000);

  // Audio & Camera
  const [isMuted, setIsMuted] = useState(sounds.getMuted());
  const [currentCamera, setCurrentCamera] = useState<CameraPreset>('perspective');

  // 3D vs 2D View Dimension (persisted)
  const [viewDimension, setViewDimension] = useState<ViewDimension>(() => {
    try {
      const saved = localStorage.getItem('nordic_chess_dimension');
      if (saved === '2d' || saved === '3d') return saved;
    } catch {
      // ignore
    }
    return '3d';
  });

  const handleToggleDimension = useCallback((dim: ViewDimension) => {
    setViewDimension(dim);
    try {
      localStorage.setItem('nordic_chess_dimension', dim);
    } catch {
      // ignore
    }
    if (dim === '3d' && sceneRef.current) {
      sceneRef.current.setBoardFromFen(chessRef.current.fen());
    }
  }, []);

  // Modals & Drawers
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [multiplayerModalOpen, setMultiplayerModalOpen] = useState(false);
  const [multiplayerTab, setMultiplayerTab] = useState<'create' | 'join'>('create');
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [gameOverModalOpen, setGameOverModalOpen] = useState(false);

  // Match Outcome
  const [matchWinner, setMatchWinner] = useState<PieceColor | 'draw' | undefined>();
  const [matchEndReason, setMatchEndReason] = useState<string | undefined>();
  const [eloDelta, setEloDelta] = useState(0);

  // Profile & Multiplayer Room
  const [userProfile, setUserProfile] = useState<UserProfile>(getInitialProfile);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [isWaitingForOpponent, setIsWaitingForOpponent] = useState(false);
  const [rematchRequestedByOther, setRematchRequestedByOther] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  // Sync profile to backend on boot
  useEffect(() => {
    fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userProfile),
    }).catch((err) => console.log('Offline profile sync:', err));
  }, []);

  // Update captured pieces & eval
  const updateGameStats = useCallback(() => {
    const chess = chessRef.current;
    setTurn(chess.turn() as PieceColor);
    setIsCheck(chess.inCheck());
    setEvaluation(evaluateBoard(chess));
    setMoveCount(chess.history().length);

    // Calculate captured pieces
    const board = chess.board();
    const whitePieces: Record<string, number> = { p: 0, n: 0, b: 0, r: 0, q: 0 };
    const blackPieces: Record<string, number> = { p: 0, n: 0, b: 0, r: 0, q: 0 };

    board.forEach((row) => {
      row.forEach((piece) => {
        if (!piece) return;
        if (piece.color === 'w') {
          if (whitePieces[piece.type] !== undefined) whitePieces[piece.type]++;
        } else {
          if (blackPieces[piece.type] !== undefined) blackPieces[piece.type]++;
        }
      });
    });

    const initCounts: Record<string, number> = { p: 8, n: 2, b: 2, r: 2, q: 1 };
    const capWhite: PieceType[] = [];
    const capBlack: PieceType[] = [];

    (Object.keys(initCounts) as PieceType[]).forEach((type) => {
      const missingWhite = initCounts[type] - (whitePieces[type] || 0);
      for (let i = 0; i < missingWhite; i++) capBlack.push(type);

      const missingBlack = initCounts[type] - (blackPieces[type] || 0);
      for (let i = 0; i < missingBlack; i++) capWhite.push(type);
    });

    setCapturedWhite(capWhite);
    setCapturedBlack(capBlack);
  }, []);

  // Centralized clean match reset helper
  const resetMatchState = useCallback(
    (mode: 'ai' | 'multiplayer' | 'local_pass', fen = new Chess().fen()) => {
      chessRef.current = new Chess(fen);
      isMatchEndedRef.current = false;
      setIsMatchEnded(false);
      setGameOverModalOpen(false);
      setMatchWinner(undefined);
      setMatchEndReason(undefined);
      setPendingPromotion(null);
      setSelectedSquare(null);
      setLegalMoves([]);
      selectedSquareRef.current = null;
      legalMovesRef.current = [];
      setMovesHistory([]);
      setUnreadChatCount(0);

      sceneRef.current?.setBoardFromFen(fen);
      sceneRef.current?.highlightSelectedSquare(null);
      sceneRef.current?.highlightLegalMoves([]);
      sceneRef.current?.highlightLastMove(null, null);
      sceneRef.current?.highlightCheck(null);

      setInGame(true);
      inGameRef.current = true;
      setGameMode(mode);
      gameModeRef.current = mode;
      updateGameStats();
    },
    [updateGameStats]
  );

  // End match handler
  const handleGameEnd = useCallback(
    (winner: PieceColor | 'draw', reason: string) => {
      if (isMatchEndedRef.current) return;
      isMatchEndedRef.current = true;
      setIsMatchEnded(true);

      setMatchWinner(winner);
      setMatchEndReason(reason);

      let result: 'win' | 'loss' | 'draw' = 'draw';
      if (winner === 'draw') result = 'draw';
      else if (winner === playerColor) result = 'win';
      else result = 'loss';

      if (result === 'win') sounds.playVictory();
      else if (result === 'loss') sounds.playDefeat();

      if (gameMode === 'local_pass') {
        setEloDelta(0);
        setGameOverModalOpen(true);
        return;
      }

      const opponentElo =
        gameMode === 'ai' ? AI_TIERS[aiTier].elo : 1200;
      const delta = calculateEloDelta(userProfile.elo, opponentElo, result);
      setEloDelta(delta);

      const updatedProfile: UserProfile = {
        ...userProfile,
        elo: Math.max(100, userProfile.elo + delta),
        wins: userProfile.wins + (result === 'win' ? 1 : 0),
        losses: userProfile.losses + (result === 'loss' ? 1 : 0),
        draws: userProfile.draws + (result === 'draw' ? 1 : 0),
        recentMatches: [
          {
            id: `m_${Date.now()}`,
            opponentName: gameMode === 'ai' ? AI_TIERS[aiTier].name : 'Multiplayer Opponent',
            opponentElo,
            result,
            mode: gameMode,
            eloDelta: delta,
            date: Date.now(),
            movesCount: chessRef.current.history().length,
          },
          ...userProfile.recentMatches.slice(0, 19),
        ],
      };

      setUserProfile(updatedProfile);
      localStorage.setItem(PROFILE_KEY, JSON.stringify(updatedProfile));

      // Sync match to server
      fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userProfile.id,
          opponentName: gameMode === 'ai' ? AI_TIERS[aiTier].name : 'Multiplayer Opponent',
          opponentElo,
          result,
          mode: gameMode,
          eloDelta: delta,
          movesCount: chessRef.current.history().length,
        }),
      }).catch((e) => console.log('Match record err:', e));

      setGameOverModalOpen(true);
    },
    [aiTier, gameMode, playerColor, userProfile]
  );

  const handleTimeout = useCallback(
    (timedOutColor: PieceColor) => {
      if (isMatchEndedRef.current) return;
      const winner = timedOutColor === 'w' ? 'b' : 'w';
      handleGameEnd(winner, 'timeout');
    },
    [handleGameEnd]
  );

  // Clock interval for Solo/AI mode: ONLY runs in AI mode when match is active
  useEffect(() => {
    if (!inGame || gameMode !== 'ai' || isMatchEnded) return;

    const timer = setInterval(() => {
      if (isMatchEndedRef.current || chessRef.current.isGameOver()) {
        clearInterval(timer);
        return;
      }

      const currentTurn = chessRef.current.turn() as PieceColor;
      if (currentTurn === 'w') {
        setWhiteTimeMs((prev) => {
          if (prev <= 1000) {
            clearInterval(timer);
            setTimeout(() => {
              if (!isMatchEndedRef.current) handleTimeout('w');
            }, 0);
            return 0;
          }
          const next = prev - 1000;
          if (next < 10000 && next > 0) sounds.playClockTick();
          return next;
        });
      } else {
        setBlackTimeMs((prev) => {
          if (prev <= 1000) {
            clearInterval(timer);
            setTimeout(() => {
              if (!isMatchEndedRef.current) handleTimeout('b');
            }, 0);
            return 0;
          }
          const next = prev - 1000;
          if (next < 10000 && next > 0) sounds.playClockTick();
          return next;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [inGame, gameMode, isMatchEnded, handleTimeout]);

  // Trigger AI Move
  const makeAIMove = useCallback(async () => {
    const chess = chessRef.current;
    if (chess.isGameOver() || isMatchEndedRef.current) return;

    const aiMove = await getBestMove(chess, aiTier);
    if (!aiMove || !sceneRef.current || isMatchEndedRef.current) return;

    const from = aiMove.from as Square;
    const to = aiMove.to as Square;
    const isCapture = Boolean(aiMove.captured);

    sceneRef.current.animateMove(from, to, isCapture, aiMove.promotion as PieceType | undefined, () => {
      chess.move(aiMove);
      sceneRef.current?.highlightLastMove(from, to);

      if (isCapture) sounds.playCapture();
      else sounds.playMove();

      if (chess.inCheck()) sounds.playCheck();

      // Highlight check
      if (chess.inCheck()) {
        const board = chess.board();
        let kingSq: Square | null = null;
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            const p = board[r][c];
            if (p && p.type === 'k' && p.color === chess.turn()) {
              kingSq = `${['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'][c]}${8 - r}` as Square;
            }
          }
        }
        sceneRef.current?.highlightCheck(kingSq);
      } else {
        sceneRef.current?.highlightCheck(null);
      }

      setMovesHistory((prev) => [
        ...prev,
        {
          from,
          to,
          san: aiMove.san,
          piece: aiMove.piece as PieceType,
          color: aiMove.color as PieceColor,
          captured: aiMove.captured as PieceType | undefined,
          promotion: aiMove.promotion as PieceType | undefined,
          fen: chess.fen(),
          timestamp: Date.now(),
        },
      ]);

      updateGameStats();

      // Check match termination
      if (chess.isGameOver()) {
        if (chess.isCheckmate()) {
          handleGameEnd(chess.turn() === 'w' ? 'b' : 'w', 'checkmate');
        } else if (chess.isDraw()) {
          handleGameEnd('draw', 'stalemate');
        }
      }
    });
  }, [aiTier, handleGameEnd, updateGameStats]);

  // Execute Player Move
  const executeMove = useCallback(
    (from: Square, to: Square, promotion?: PieceType) => {
      const chess = chessRef.current;
      if (chess.isGameOver() || isMatchEndedRef.current) return;

      const pieceOnTo = chess.get(to as ChessSquare);
      const isCapture = Boolean(pieceOnTo);

      // In multiplayer, send move to server
      if (gameMode === 'multiplayer' && socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(
          JSON.stringify({
            type: 'make_move',
            from,
            to,
            promotion: promotion || 'q',
          })
        );
        return;
      }

      // Local / AI execution
      try {
        const moveRes = chess.move({
          from,
          to,
          promotion: promotion || 'q',
        });

        if (!moveRes) return;

        sceneRef.current?.animateMove(from, to, isCapture, promotion, () => {
          sceneRef.current?.highlightLastMove(from, to);

          if (isCapture) sounds.playCapture();
          else sounds.playMove();

          if (chess.inCheck()) sounds.playCheck();

          // Highlight king if in check
          if (chess.inCheck()) {
            const board = chess.board();
            let kingSq: Square | null = null;
            for (let r = 0; r < 8; r++) {
              for (let c = 0; c < 8; c++) {
                const p = board[r][c];
                if (p && p.type === 'k' && p.color === chess.turn()) {
                  kingSq = `${['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'][c]}${8 - r}` as Square;
                }
              }
            }
            sceneRef.current?.highlightCheck(kingSq);
          } else {
            sceneRef.current?.highlightCheck(null);
          }

          setMovesHistory((prev) => [
            ...prev,
            {
              from,
              to,
              san: moveRes.san,
              piece: moveRes.piece as PieceType,
              color: moveRes.color as PieceColor,
              captured: moveRes.captured as PieceType | undefined,
              promotion: moveRes.promotion as PieceType | undefined,
              fen: chess.fen(),
              timestamp: Date.now(),
            },
          ]);

          updateGameStats();

          // Check if match ended
          if (chess.isGameOver()) {
            if (chess.isCheckmate()) {
              handleGameEnd(chess.turn() === 'w' ? 'b' : 'w', 'checkmate');
            } else if (chess.isDraw()) {
              handleGameEnd('draw', 'stalemate');
            }
            return;
          }

          // Trigger AI response if in AI mode
          if (gameMode === 'ai' && chess.turn() !== playerColor) {
            makeAIMove();
          }
        });
      } catch (err) {
        console.error('Invalid move attempted:', err);
      }
    },
    [gameMode, handleGameEnd, makeAIMove, playerColor, updateGameStats]
  );

  // Square Click Raycasting handler
  const handleSquareClicked = useCallback(
    (square: Square) => {
      const chess = chessRef.current;
      if (chess.isGameOver() || isMatchEndedRef.current) return;

      // Only allow moves during active match
      if (!inGameRef.current) return;

      // Turn validation
      if (gameModeRef.current === 'ai' && chess.turn() !== playerColorRef.current) return;
      if (gameModeRef.current === 'multiplayer' && chess.turn() !== playerColorRef.current) return;

      const piece = chess.get(square as ChessSquare);
      const currentSelected = selectedSquareRef.current;
      const currentLegal = legalMovesRef.current;

      // If no piece is currently selected:
      if (!currentSelected) {
        if (piece && piece.color === chess.turn()) {
          selectedSquareRef.current = square;
          setSelectedSquare(square);
          sceneRef.current?.highlightSelectedSquare(square);

          const moves = chess.moves({ square: square as ChessSquare, verbose: true });
          const targetSquares = moves.map((m) => m.to as Square);
          legalMovesRef.current = targetSquares;
          setLegalMoves(targetSquares);
          sceneRef.current?.highlightLegalMoves(targetSquares);
        }
        return;
      }

      // If clicked on the same square, deselect:
      if (currentSelected === square) {
        selectedSquareRef.current = null;
        legalMovesRef.current = [];
        setSelectedSquare(null);
        setLegalMoves([]);
        sceneRef.current?.highlightSelectedSquare(null);
        sceneRef.current?.highlightLegalMoves([]);
        return;
      }

      // If clicked square is among legal moves, make move:
      if (currentLegal.includes(square)) {
        const movingPiece = chess.get(currentSelected as ChessSquare);

        // Check pawn promotion
        const isPawnPromotion =
          movingPiece?.type === 'p' &&
          ((movingPiece.color === 'w' && square[1] === '8') ||
            (movingPiece.color === 'b' && square[1] === '1'));

        if (isPawnPromotion) {
          setPendingPromotion({ from: currentSelected, to: square });
        } else {
          executeMove(currentSelected, square);
        }

        selectedSquareRef.current = null;
        legalMovesRef.current = [];
        setSelectedSquare(null);
        setLegalMoves([]);
        sceneRef.current?.highlightSelectedSquare(null);
        sceneRef.current?.highlightLegalMoves([]);
        return;
      }

      // If clicked on another piece of current player's color, switch selection:
      if (piece && piece.color === chess.turn()) {
        selectedSquareRef.current = square;
        setSelectedSquare(square);
        sceneRef.current?.highlightSelectedSquare(square);

        const moves = chess.moves({ square: square as ChessSquare, verbose: true });
        const targetSquares = moves.map((m) => m.to as Square);
        legalMovesRef.current = targetSquares;
        setLegalMoves(targetSquares);
        sceneRef.current?.highlightLegalMoves(targetSquares);
      } else {
        // Deselect
        selectedSquareRef.current = null;
        legalMovesRef.current = [];
        setSelectedSquare(null);
        setLegalMoves([]);
        sceneRef.current?.highlightSelectedSquare(null);
        sceneRef.current?.highlightLegalMoves([]);
      }
    },
    [executeMove]
  );

  handleSquareClickedRef.current = handleSquareClicked;

  // Initialize Three.js scene once on mount - isolated from React state updates
  useEffect(() => {
    if (!canvasContainerRef.current) return;

    const sceneManager = new ChessSceneManager(canvasContainerRef.current, {
      onSquareClicked: (sq) => handleSquareClickedRef.current(sq),
      onPieceSelected: () => {},
    });

    sceneRef.current = sceneManager;
    sceneManager.setBoardFromFen(chessRef.current.fen());
    sceneManager.setCameraPreset('perspective');

    return () => {
      sceneManager.dispose();
      sceneRef.current = null;
    };
  }, []);

  // Connect WebSocket for multiplayer
  const connectWebSocket = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('Multiplayer WS connected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case 'room_created':
            setRoomCode(data.roomId);
            setIsWaitingForOpponent(true);
            setPlayerColor(data.yourColor);
            playerColorRef.current = data.yourColor;
            break;

          case 'room_joined': {
            setRoomCode(data.roomId);
            if (data.yourColor) {
              setPlayerColor(data.yourColor);
              playerColorRef.current = data.yourColor;
            }
            setMultiplayerModalOpen(false);
            setIsWaitingForOpponent(false);
            resetMatchState('multiplayer', data.state.fen);
            sceneRef.current?.setCameraPreset(data.yourColor === 'b' ? 'black' : 'white');
            setCurrentCamera(data.yourColor === 'b' ? 'black' : 'white');
            break;
          }

          case 'room_updated': {
            const state: RoomState = data.state;
            if (state.status === 'in_progress') {
              setIsWaitingForOpponent(false);
              setMultiplayerModalOpen(false);
              if (!inGameRef.current) {
                const myColor =
                  state.whitePlayer?.id === userProfile.id
                    ? 'w'
                    : state.blackPlayer?.id === userProfile.id
                    ? 'b'
                    : 'w';
                setPlayerColor(myColor);
                playerColorRef.current = myColor;
                resetMatchState('multiplayer', state.fen);
                sceneRef.current?.setCameraPreset(myColor === 'b' ? 'black' : 'white');
                setCurrentCamera(myColor === 'b' ? 'black' : 'white');
              }
            }
            break;
          }

          case 'timer_sync':
            setWhiteTimeMs(data.whiteTimeMs);
            setBlackTimeMs(data.blackTimeMs);
            break;

          case 'move_made': {
            const { move, state } = data;
            const chess = chessRef.current;
            const from = move.from as Square;
            const to = move.to as Square;
            const isCapture = Boolean(move.captured);

            sceneRef.current?.animateMove(from, to, isCapture, move.promotion, () => {
              chess.load(state.fen);
              sceneRef.current?.highlightLastMove(from, to);

              if (isCapture) sounds.playCapture();
              else sounds.playMove();

              if (chess.inCheck()) sounds.playCheck();

              setMovesHistory(state.moves);
              updateGameStats();
            });
            break;
          }

          case 'chat_received':
            setChatMessages((prev) => [...prev, data.message]);
            if (!isChatOpen) {
              setUnreadChatCount((c) => c + 1);
            }
            break;

          case 'game_over': {
            const state: RoomState = data.state;
            handleGameEnd(state.winner || 'draw', state.endReason || 'concluded');
            break;
          }

          case 'rematch_requested':
            setRematchRequestedByOther(true);
            break;

          case 'rematch_started': {
            const state: RoomState = data.state;
            const myColor = state.whitePlayer?.id === userProfile.id ? 'w' : 'b';
            setPlayerColor(myColor);
            playerColorRef.current = myColor;
            resetMatchState('multiplayer', state.fen);
            setRematchRequestedByOther(false);
            sceneRef.current?.setCameraPreset(myColor === 'b' ? 'black' : 'white');
            setCurrentCamera(myColor === 'b' ? 'black' : 'white');
            break;
          }

          case 'error':
            console.error('Multiplayer error:', data.message);
            break;
        }
      } catch (err) {
        console.error('WS parse error:', err);
      }
    };

    socketRef.current = ws;
  }, [handleGameEnd, isChatOpen, resetMatchState, updateGameStats, userProfile.id]);

  // Check URL query param for instant room invite
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      connectWebSocket();
      setMultiplayerTab('join');
      setMultiplayerModalOpen(true);
    }
  }, [connectWebSocket]);

  // Reliable WebSocket message sender
  const sendWsMessage = useCallback(
    (msg: object) => {
      connectWebSocket();
      const ws = socketRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(msg));
      } else if (ws) {
        const prevOnOpen = ws.onopen;
        ws.onopen = (ev) => {
          if (prevOnOpen) prevOnOpen.call(ws, ev);
          ws.send(JSON.stringify(msg));
        };
      }
    },
    [connectWebSocket]
  );

  // Start Solo AI match
  const handleStartAI = (tier: AITier, color: 'w' | 'b' | 'random') => {
    const chosenColor: PieceColor =
      color === 'random' ? (Math.random() < 0.5 ? 'w' : 'b') : color;

    setAiTier(tier);
    setPlayerColor(chosenColor);
    playerColorRef.current = chosenColor;
    setWhiteTimeMs(10 * 60 * 1000);
    setBlackTimeMs(10 * 60 * 1000);

    resetMatchState('ai');

    sceneRef.current?.setCameraPreset(chosenColor === 'b' ? 'black' : 'white');
    setCurrentCamera(chosenColor === 'b' ? 'black' : 'white');

    // If player is Black, AI makes opening move
    if (chosenColor === 'b') {
      setTimeout(() => {
        if (!isMatchEndedRef.current) {
          makeAIMove();
        }
      }, 400);
    }
  };

  // Start 1 vs 1 Local Pass & Play on one phone/device
  const handleStartLocalPass = () => {
    setPlayerColor('w');
    playerColorRef.current = 'w';
    setWhiteTimeMs(0);
    setBlackTimeMs(0);

    resetMatchState('local_pass');

    sceneRef.current?.setCameraPreset('top_down');
    setCurrentCamera('top_down');
  };

  // Create room
  const handleCreateRoom = (timeControl: TimeControlPreset, color: 'w' | 'b' | 'random') => {
    sendWsMessage({
      type: 'create_room',
      timeControl,
      preferredColor: color,
      player: {
        id: userProfile.id,
        name: userProfile.username,
        elo: userProfile.elo,
      },
    });
  };

  // Join room
  const handleJoinRoom = (code: string) => {
    sendWsMessage({
      type: 'join_room',
      roomId: code,
      player: {
        id: userProfile.id,
        name: userProfile.username,
        elo: userProfile.elo,
      },
    });
  };

  // Send in-game chat message
  const handleSendMessage = (text: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN && roomCode) {
      socketRef.current.send(
        JSON.stringify({
          type: 'chat_message',
          text,
        })
      );
    } else {
      // Local chat echo in AI mode
      const localMsg: ChatMessage = {
        id: `c_${Date.now()}`,
        senderId: userProfile.id,
        senderName: userProfile.username,
        senderColor: playerColor,
        text,
        timestamp: Date.now(),
      };
      setChatMessages((prev) => [...prev, localMsg]);
    }
  };

  // Best Move Hint calculation
  const handleGetHint = async () => {
    if (isMatchEndedRef.current) return;
    const hint = await getBestMove(chessRef.current, 'master');
    if (hint && sceneRef.current) {
      sceneRef.current.highlightLastMove(hint.from as Square, hint.to as Square);
      sounds.playCheck();
    }
  };

  // Undo move (in Solo AI and Local Pass & Play modes)
  const handleUndoMove = () => {
    if (isMatchEndedRef.current) return;
    const chess = chessRef.current;
    if (gameMode === 'local_pass') {
      chess.undo();
      sceneRef.current?.setBoardFromFen(chess.fen());
      sceneRef.current?.highlightSelectedSquare(null);
      sceneRef.current?.highlightLegalMoves([]);
      selectedSquareRef.current = null;
      legalMovesRef.current = [];
      setSelectedSquare(null);
      setLegalMoves([]);
      setMovesHistory((prev) => prev.slice(0, prev.length - 1));
      updateGameStats();
    } else if (gameMode === 'ai') {
      chess.undo(); // Undo AI move
      chess.undo(); // Undo player move
      sceneRef.current?.setBoardFromFen(chess.fen());
      sceneRef.current?.highlightSelectedSquare(null);
      sceneRef.current?.highlightLegalMoves([]);
      selectedSquareRef.current = null;
      legalMovesRef.current = [];
      setSelectedSquare(null);
      setLegalMoves([]);
      setMovesHistory((prev) => prev.slice(0, prev.length - 2));
      updateGameStats();
    }
  };

  // Resign match
  const handleResign = () => {
    if (isMatchEndedRef.current) return;
    if (confirm('Are you sure you want to resign this match?')) {
      if (gameMode === 'multiplayer' && socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'resign' }));
      } else {
        handleGameEnd(playerColor === 'w' ? 'b' : 'w', 'resignation');
      }
    }
  };

  // Offer draw
  const handleOfferDraw = () => {
    if (isMatchEndedRef.current) return;
    if (gameMode === 'multiplayer' && socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'offer_draw' }));
    }
  };

  // Rematch request
  const handleRematch = () => {
    if (gameMode === 'multiplayer' && socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'request_rematch' }));
    } else if (gameMode === 'local_pass') {
      handleStartLocalPass();
    } else {
      handleStartAI(aiTier, playerColor);
    }
  };

  // Exit match to main title
  const handleExitMatch = () => {
    if (inGame && !isMatchEndedRef.current && !chessRef.current.isGameOver()) {
      if (!confirm('Leave current match and return to main menu?')) return;
    }
    setInGame(false);
    inGameRef.current = false;
    isMatchEndedRef.current = true;
    setIsMatchEnded(true);
    setGameOverModalOpen(false);
    setSelectedSquare(null);
    setLegalMoves([]);
    selectedSquareRef.current = null;
    legalMovesRef.current = [];
    setWhiteTimeMs(10 * 60 * 1000);
    setBlackTimeMs(10 * 60 * 1000);

    chessRef.current = new Chess();
    sceneRef.current?.setBoardFromFen(chessRef.current.fen());
    sceneRef.current?.highlightSelectedSquare(null);
    sceneRef.current?.highlightLegalMoves([]);
    sceneRef.current?.highlightLastMove(null, null);
    sceneRef.current?.highlightCheck(null);
    sceneRef.current?.setCameraPreset('perspective');
    setCurrentCamera('perspective');
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0f1318] text-[#e5e9f0]">
      {/* Isolated Three.js WebGL Mount Ref Container */}
      <div
        ref={canvasContainerRef}
        className={`absolute inset-0 w-full h-full z-0 transition-opacity duration-300 ${
          viewDimension === '3d' ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* 2D Board Overlay (Active when in 2D mode during game) */}
      {inGame && viewDimension === '2d' && (
        <div className="absolute inset-0 z-5 flex items-center justify-center p-2 sm:p-4 pt-16 sm:pt-20 pb-16 sm:pb-20 pointer-events-none">
          <ChessBoard2D
            fen={chessRef.current.fen()}
            turn={turn}
            playerColor={playerColor}
            gameMode={gameMode}
            selectedSquare={selectedSquare}
            legalMoves={legalMoves}
            lastMove={
              movesHistory.length > 0
                ? {
                    from: movesHistory[movesHistory.length - 1].from as Square,
                    to: movesHistory[movesHistory.length - 1].to as Square,
                  }
                : null
            }
            isCheck={isCheck}
            onSquareClicked={handleSquareClicked}
            isMatchEnded={isMatchEnded}
          />
        </div>
      )}

      {/* Title Screen Overlay (when not in match) */}
      {!inGame && (
        <TitleScreen
          userProfile={userProfile}
          viewDimension={viewDimension}
          onToggleDimension={handleToggleDimension}
          onStartAI={handleStartAI}
          onStartLocalPass={handleStartLocalPass}
          onOpenMultiplayer={(mode) => {
            setMultiplayerTab(mode);
            setMultiplayerModalOpen(true);
          }}
          onOpenLeaderboard={() => setLeaderboardOpen(true)}
          onOpenProfile={() => setProfileOpen(true)}
        />
      )}

      {/* In-Game HUD & Dock (when playing) */}
      {inGame && (
        <>
          <GameHud
            whiteName={
              gameMode === 'ai'
                ? playerColor === 'w'
                  ? userProfile.username
                  : AI_TIERS[aiTier].name
                : gameMode === 'local_pass'
                ? 'Player 1 (White)'
                : 'White Player'
            }
            whiteElo={
              gameMode === 'ai'
                ? playerColor === 'w'
                  ? userProfile.elo
                  : AI_TIERS[aiTier].elo
                : 1200
            }
            whiteTimeMs={whiteTimeMs}
            blackName={
              gameMode === 'ai'
                ? playerColor === 'b'
                  ? userProfile.username
                  : AI_TIERS[aiTier].name
                : gameMode === 'local_pass'
                ? 'Player 2 (Black)'
                : 'Black Player'
            }
            blackElo={
              gameMode === 'ai'
                ? playerColor === 'b'
                  ? userProfile.elo
                  : AI_TIERS[aiTier].elo
                : 1200
            }
            blackTimeMs={blackTimeMs}
            turn={turn}
            isCheck={isCheck}
            evaluationScore={evaluation}
            capturedByWhite={capturedWhite}
            capturedByBlack={capturedBlack}
            moveCount={moveCount}
            mode={gameMode}
            aiTierName={AI_TIERS[aiTier]?.name}
            roomCode={roomCode || undefined}
            viewDimension={viewDimension}
            onToggleDimension={handleToggleDimension}
          />

          <BottomDock
            currentCamera={currentCamera}
            onSetCamera={(preset) => {
              setCurrentCamera(preset);
              sceneRef.current?.setCameraPreset(preset);
            }}
            viewDimension={viewDimension}
            onToggleDimension={handleToggleDimension}
            isMuted={isMuted}
            onToggleMute={() => setIsMuted(sounds.toggleMute())}
            onGetHint={handleGetHint}
            onUndoMove={handleUndoMove}
            canUndo={gameMode === 'local_pass' ? movesHistory.length >= 1 : movesHistory.length >= 2}
            onToggleChat={() => {
              setIsChatOpen(!isChatOpen);
              setUnreadChatCount(0);
            }}
            unreadChatCount={unreadChatCount}
            onResign={handleResign}
            onOfferDraw={handleOfferDraw}
            onExitMatch={handleExitMatch}
            mode={gameMode}
          />
        </>
      )}

      {/* Live Chat & Move History Drawer */}
      <ChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        messages={chatMessages}
        onSendMessage={handleSendMessage}
        moves={movesHistory}
        currentUserId={userProfile.id}
      />

      {/* Multiplayer Room Creation & Join Modal */}
      <MultiplayerModal
        isOpen={multiplayerModalOpen}
        onClose={() => setMultiplayerModalOpen(false)}
        initialTab={multiplayerTab}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        createdRoomCode={roomCode}
        isWaitingForOpponent={isWaitingForOpponent}
      />

      {/* Global Leaderboard Modal */}
      <LeaderboardModal
        isOpen={leaderboardOpen}
        onClose={() => setLeaderboardOpen(false)}
        currentUserId={userProfile.id}
      />

      {/* User Profile Career Modal */}
      <ProfileModal
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
        userProfile={userProfile}
        onUpdateUsername={(newName) => {
          const updated = { ...userProfile, username: newName };
          setUserProfile(updated);
          localStorage.setItem(PROFILE_KEY, JSON.stringify(updated));
          fetch('/api/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updated),
          }).catch((e) => console.log('Profile update err:', e));
        }}
      />

      {/* Pawn Promotion Dialog */}
      <PromotionModal
        isOpen={Boolean(pendingPromotion)}
        color={turn}
        onSelectPiece={(piece) => {
          if (pendingPromotion) {
            executeMove(pendingPromotion.from, pendingPromotion.to, piece);
            setPendingPromotion(null);
          }
        }}
      />

      {/* Match Result GameOver Dialog */}
      <GameOverModal
        isOpen={gameOverModalOpen}
        winner={matchWinner}
        endReason={matchEndReason}
        playerColor={playerColor}
        eloDelta={eloDelta}
        newElo={userProfile.elo}
        mode={gameMode}
        onRematch={handleRematch}
        onExit={handleExitMatch}
        rematchRequestedByOther={rematchRequestedByOther}
      />
    </div>
  );
}

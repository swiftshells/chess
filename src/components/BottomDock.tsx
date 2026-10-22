import React from 'react';
import {
  Camera,
  Volume2,
  VolumeX,
  Lightbulb,
  RotateCcw,
  MessageSquare,
  Flag,
  Handshake,
  LogOut,
  ChevronDown,
  ChevronUp,
  Box,
  Layers,
} from 'lucide-react';
import { CameraPreset, ViewDimension } from '../types/chess';

interface BottomDockProps {
  currentCamera: CameraPreset;
  onSetCamera: (preset: CameraPreset) => void;
  viewDimension: ViewDimension;
  onToggleDimension: (dim: ViewDimension) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onGetHint: () => void;
  onUndoMove?: () => void;
  canUndo?: boolean;
  onToggleChat: () => void;
  unreadChatCount: number;
  onResign: () => void;
  onOfferDraw: () => void;
  onExitMatch: () => void;
  mode: 'ai' | 'multiplayer' | 'local_pass';
}

export const BottomDock: React.FC<BottomDockProps> = ({
  currentCamera,
  onSetCamera,
  viewDimension,
  onToggleDimension,
  isMuted,
  onToggleMute,
  onGetHint,
  onUndoMove,
  canUndo = false,
  onToggleChat,
  unreadChatCount,
  onResign,
  onOfferDraw,
  onExitMatch,
  mode,
}) => {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  return (
    <div
      className="fixed bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-auto transition-transform duration-300 max-w-[98vw] sm:max-w-max"
      style={{
        transform: isCollapsed ? 'translate(-50%, calc(100% - 24px))' : 'translate(-50%, 0)',
      }}
    >
      {/* Collapse / Expand Tab */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="px-3.5 py-0.5 rounded-t-lg bg-[#141920]/95 hover:bg-[#1e2530] border-t border-x border-[#3b4759] text-[10px] font-medium text-[#a39482] hover:text-[#f3eade] transition-colors flex items-center gap-1 cursor-pointer backdrop-blur-md shadow-md min-h-[22px]"
        title="Toggle Dock"
      >
        {isCollapsed ? (
          <>
            <ChevronUp className="w-3 h-3" />
            <span>Show</span>
          </>
        ) : (
          <>
            <ChevronDown className="w-3 h-3" />
            <span>Hide</span>
          </>
        )}
      </button>

      {/* Main Unified Control Bar */}
      <div className="flex items-center justify-center gap-1 sm:gap-2 p-1.5 sm:p-2 rounded-xl sm:rounded-2xl bg-[#141920]/95 border border-[#303c4c] shadow-2xl backdrop-blur-md overflow-x-auto max-w-[96vw]">
        {/* 2D vs 3D Dimension Switcher */}
        <div className="flex items-center gap-0.5 p-0.5 bg-[#1a212b] rounded-lg border border-[#3b4759] shrink-0">
          <button
            onClick={() => onToggleDimension('3d')}
            className={`px-2 py-1 text-[11px] font-bold rounded flex items-center gap-1 transition-all cursor-pointer touch-manipulation min-h-[28px] ${
              viewDimension === '3d'
                ? 'bg-[#d8b065] text-[#1a120b] shadow-sm'
                : 'text-[#8c9ba8] hover:text-[#f3eade]'
            }`}
            title="3D Spatial Perspective"
          >
            <Box className="w-3 h-3" />
            <span>3D</span>
          </button>
          <button
            onClick={() => onToggleDimension('2d')}
            className={`px-2 py-1 text-[11px] font-bold rounded flex items-center gap-1 transition-all cursor-pointer touch-manipulation min-h-[28px] ${
              viewDimension === '2d'
                ? 'bg-[#d8b065] text-[#1a120b] shadow-sm'
                : 'text-[#8c9ba8] hover:text-[#f3eade]'
            }`}
            title="Classic 2D Board"
          >
            <Layers className="w-3 h-3" />
            <span>2D</span>
          </button>
        </div>

        <div className="h-4 w-px bg-[#2f3b4a] shrink-0" />

        {/* 3D Camera Angles (Active only in 3D mode) */}
        {viewDimension === '3d' && (
          <>
            <div className="flex items-center gap-0.5 p-0.5 bg-[#1c232d] rounded-lg border border-[#2b3543] shrink-0">
              <Camera className="w-3 h-3 text-[#a39482] ml-1 mr-0.5 hidden xs:inline" />
              {(
                [
                  { id: 'perspective', label: 'Angle' },
                  { id: 'white', label: 'White' },
                  { id: 'black', label: 'Black' },
                  { id: 'top_down', label: 'Top' },
                ] as const
              ).map((preset) => {
                const isActive = currentCamera === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => onSetCamera(preset.id)}
                    className={`px-1.5 sm:px-2 py-1 text-[11px] font-medium rounded transition-all cursor-pointer touch-manipulation min-h-[28px] ${
                      isActive
                        ? 'bg-[#d8b065] text-[#1a120b] font-bold shadow-sm'
                        : 'text-[#8c9ba8] hover:text-[#f3eade]'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
            <div className="h-4 w-px bg-[#2f3b4a] shrink-0" />
          </>
        )}

        {/* Tactical Hint */}
        <button
          onClick={onGetHint}
          className="px-2 sm:px-2.5 py-1 rounded-lg bg-[#1c232d] hover:bg-[#252e3b] active:scale-95 border border-[#2b3543] text-[11px] font-medium text-[#f3eade] transition-all flex items-center gap-1 cursor-pointer touch-manipulation min-h-[30px] shrink-0"
          title="Best Move Hint"
        >
          <Lightbulb className="w-3 h-3 text-[#d8b065]" />
          <span className="hidden sm:inline">Hint</span>
        </button>

        {/* Undo (in AI and Local Pass & Play modes) */}
        {(mode === 'ai' || mode === 'local_pass') && onUndoMove && (
          <button
            onClick={onUndoMove}
            disabled={!canUndo}
            className={`px-2 sm:px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all flex items-center gap-1 cursor-pointer touch-manipulation min-h-[30px] shrink-0 ${
              canUndo
                ? 'bg-[#1c232d] hover:bg-[#252e3b] active:scale-95 border-[#2b3543] text-[#f3eade]'
                : 'bg-[#141920] border-[#242c38] text-[#556372] cursor-not-allowed'
            }`}
            title="Take back move"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">Undo</span>
          </button>
        )}

        {/* In-Game Chat Toggle */}
        <button
          onClick={onToggleChat}
          className="relative px-2 sm:px-2.5 py-1 rounded-lg bg-[#1c232d] hover:bg-[#252e3b] active:scale-95 border border-[#2b3543] text-[11px] font-medium text-[#f3eade] transition-all flex items-center gap-1 cursor-pointer touch-manipulation min-h-[30px] shrink-0"
        >
          <MessageSquare className="w-3 h-3 text-[#d8b065]" />
          <span className="hidden sm:inline">Log</span>
          {unreadChatCount > 0 && (
            <span className="ml-0.5 px-1 py-0.2 text-[9px] font-bold bg-[#ef4444] text-white rounded-full">
              {unreadChatCount}
            </span>
          )}
        </button>

        {/* Sound Toggle */}
        <button
          onClick={onToggleMute}
          className="p-1.5 rounded-lg bg-[#1c232d] hover:bg-[#252e3b] active:scale-95 border border-[#2b3543] text-[#a39482] hover:text-[#f3eade] transition-all cursor-pointer touch-manipulation min-h-[30px] min-w-[30px] flex items-center justify-center shrink-0"
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5 text-[#ef4444]" /> : <Volume2 className="w-3.5 h-3.5 text-[#d8b065]" />}
        </button>

        <div className="h-4 w-px bg-[#2f3b4a] shrink-0" />

        {/* Offer Draw (Multiplayer only) */}
        {mode === 'multiplayer' && (
          <button
            onClick={onOfferDraw}
            className="px-2 py-1 rounded-lg bg-[#1c232d] hover:bg-[#252e3b] border border-[#2b3543] text-[11px] font-medium text-[#a39482] hover:text-[#f3eade] transition-all flex items-center gap-1 cursor-pointer touch-manipulation min-h-[30px] shrink-0"
            title="Offer Draw"
          >
            <Handshake className="w-3 h-3" />
            <span className="hidden sm:inline">Draw</span>
          </button>
        )}

        {/* Resign */}
        <button
          onClick={onResign}
          className="px-2 py-1 rounded-lg bg-[#1c232d] hover:bg-[#2c1d1f] border border-[#2b3543] hover:border-[#63292e] text-[11px] font-medium text-[#c07373] hover:text-[#ef4444] transition-all flex items-center gap-1 cursor-pointer touch-manipulation min-h-[30px] shrink-0"
          title="Resign Match"
        >
          <Flag className="w-3 h-3" />
          <span className="hidden sm:inline">Resign</span>
        </button>

        {/* Exit to Menu */}
        <button
          onClick={onExitMatch}
          className="p-1.5 rounded-lg bg-[#1c232d] hover:bg-[#252e3b] active:scale-95 border border-[#2b3543] text-[#a39482] hover:text-[#f3eade] transition-all cursor-pointer touch-manipulation min-h-[30px] min-w-[30px] flex items-center justify-center shrink-0"
          title="Exit to Main Menu"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

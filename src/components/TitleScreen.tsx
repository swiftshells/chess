import React from 'react';
import { Bot, Users, Trophy, User, ArrowRight, Shield, Smartphone, Box, Layers } from 'lucide-react';
import { UserProfile, AITier, ViewDimension } from '../types/chess';
import { AI_TIERS } from '../engine/chessEngine';

interface TitleScreenProps {
  userProfile: UserProfile;
  viewDimension: ViewDimension;
  onToggleDimension: (dim: ViewDimension) => void;
  onStartAI: (tier: AITier, playerColor: 'w' | 'b' | 'random') => void;
  onStartLocalPass: () => void;
  onOpenMultiplayer: (mode: 'create' | 'join') => void;
  onOpenLeaderboard: () => void;
  onOpenProfile: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  userProfile,
  viewDimension,
  onToggleDimension,
  onStartAI,
  onStartLocalPass,
  onOpenMultiplayer,
  onOpenLeaderboard,
  onOpenProfile,
}) => {
  const [selectedTier, setSelectedTier] = React.useState<AITier>('club');
  const [selectedColor, setSelectedColor] = React.useState<'w' | 'b' | 'random'>('w');
  const [showAiPicker, setShowAiPicker] = React.useState(false);

  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-between p-4 sm:p-6 md:p-12 pointer-events-none select-none bg-gradient-to-b from-[#0f1318]/70 via-transparent to-[#0f1318]/90 overflow-y-auto">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between w-full max-w-7xl mx-auto pointer-events-auto gap-2">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#271d15] border border-[#d8b065]/40 flex items-center justify-center text-[#d8b065] shadow-lg shrink-0">
            <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#f3eade]">NORDIC CHESS</h1>
            <p className="text-[10px] sm:text-xs text-[#a39482] tracking-wider uppercase font-medium">Scandinavian Tactile Craft</p>
          </div>
        </div>

        {/* View Mode & Profile Cluster */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* 3D vs 2D Selector */}
          <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-[#141920]/90 border border-[#2b3543] shadow-md">
            <button
              onClick={() => onToggleDimension('3d')}
              className={`px-2 py-1 text-[11px] font-bold rounded flex items-center gap-1 transition-all cursor-pointer touch-manipulation min-h-[28px] ${
                viewDimension === '3d'
                  ? 'bg-[#d8b065] text-[#1a120b] shadow-sm'
                  : 'text-[#8c9ba8] hover:text-[#f3eade]'
              }`}
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
            >
              <Layers className="w-3 h-3" />
              <span>2D</span>
            </button>
          </div>

          {/* User Profile Quick Badge */}
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-2 sm:gap-3 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-[#1a2028]/80 hover:bg-[#222b37] border border-[#303c4c] transition-colors text-left group cursor-pointer shadow-md"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#35251a] border border-[#d8b065]/50 flex items-center justify-center text-[#d8b065] text-xs font-bold shrink-0">
              {userProfile.username.slice(0, 2).toUpperCase()}
            </div>
            <div className="hidden xs:block">
              <div className="text-xs font-semibold text-[#f3eade] group-hover:text-[#d8b065] transition-colors truncate max-w-[100px]">
                {userProfile.username}
              </div>
              <div className="text-[10px] sm:text-[11px] text-[#9ba8b8] font-mono tabular-nums">
                ELO {userProfile.elo}
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Center Hero Title Lockup */}
      <div className="w-full max-w-xl mx-auto text-center pointer-events-auto my-auto py-6 sm:py-8">
        {/* Bespoke inline SVG emblem */}
        <div className="flex justify-center mb-3 sm:mb-4">
          <svg className="w-14 h-14 sm:w-16 sm:h-16 text-[#d8b065]" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M32 6L40 18H24L32 6Z" fill="currentColor" fillOpacity="0.8" />
            <path d="M22 22H42V30C42 35.5228 37.5228 40 32 40C26.4772 40 22 35.5228 22 30V22Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M18 48H46V56C46 57.1046 45.1046 58 44 58H20C18.8954 58 18 57.1046 18 56V48Z" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="2.5" />
            <line x1="32" y1="40" x2="32" y2="48" stroke="currentColor" strokeWidth="2.5" />
            <circle cx="32" cy="18" r="2.5" fill="currentColor" />
          </svg>
        </div>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#f5ede3] mb-2 sm:mb-3">
          Nordic Chess
        </h2>
        <p className="text-xs sm:text-sm md:text-base text-[#a39482] max-w-md mx-auto mb-6 sm:mb-8 font-normal leading-relaxed">
          Master classical tactics with birch and walnut craft, 3D & 2D switchable views, private multiplayer, and calibrated AI.
        </p>

        {/* Primary Action Buttons */}
        {!showAiPicker ? (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3 w-full max-w-lg mx-auto">
            <button
              onClick={() => setShowAiPicker(true)}
              className="w-full sm:flex-1 py-3.5 px-4 rounded-xl bg-[#d8b065] hover:bg-[#e8be72] active:scale-[0.98] text-[#1a120b] font-bold text-xs sm:text-sm tracking-wide transition-all shadow-lg shadow-[#d8b065]/15 flex items-center justify-center gap-2 cursor-pointer touch-manipulation min-h-[46px]"
            >
              <Bot className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">PLAY VS AI</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>

            <button
              onClick={onStartLocalPass}
              className="w-full sm:flex-1 py-3.5 px-4 rounded-xl bg-[#271d15] hover:bg-[#382618] active:scale-[0.98] border border-[#d8b065]/70 text-[#f3eade] font-bold text-xs sm:text-sm tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer touch-manipulation min-h-[46px]"
            >
              <Smartphone className="w-4 h-4 text-[#d8b065] shrink-0" />
              <span className="whitespace-nowrap">1 VS 1 PASS & PLAY</span>
            </button>

            <button
              onClick={() => onOpenMultiplayer('create')}
              className="w-full sm:flex-1 py-3.5 px-4 rounded-xl bg-[#1e2530]/90 hover:bg-[#283242] active:scale-[0.98] border border-[#3b4759] text-[#f3eade] font-semibold text-xs sm:text-sm tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer touch-manipulation min-h-[46px]"
            >
              <Users className="w-4 h-4 text-[#d8b065] shrink-0" />
              <span className="whitespace-nowrap">PRIVATE ROOM</span>
            </button>
          </div>
        ) : (
          /* AI Tier Selection Card */
          <div className="bg-[#161c24]/95 border border-[#3b4859] rounded-2xl p-4 sm:p-5 text-left max-w-md mx-auto shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-[#f3eade]">SELECT AI DIFFICULTY</h3>
                <p className="text-[11px] text-[#8c9ba8]">Calibrated engine ELO tiers</p>
              </div>
              <button
                onClick={() => setShowAiPicker(false)}
                className="text-xs font-semibold px-2.5 py-1 rounded bg-[#222c38] text-[#a39482] hover:text-[#f3eade] transition-colors cursor-pointer"
              >
                Back
              </button>
            </div>

            {/* Tier Selector */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              {(Object.keys(AI_TIERS) as AITier[]).map((tierKey) => {
                const tier = AI_TIERS[tierKey];
                const isSelected = selectedTier === tierKey;
                return (
                  <button
                    key={tierKey}
                    onClick={() => setSelectedTier(tierKey)}
                    className={`p-2 sm:p-2.5 rounded-xl border text-left transition-all cursor-pointer touch-manipulation ${
                      isSelected
                        ? 'bg-[#292218] border-[#d8b065] text-[#f3eade] shadow-sm ring-1 ring-[#d8b065]/40'
                        : 'bg-[#1a212b] border-[#2d3847] text-[#97a5b6] hover:border-[#415166]'
                    }`}
                  >
                    <div className="text-[11px] sm:text-xs font-semibold">{tier.name}</div>
                    <div className="text-[9px] sm:text-[10px] text-[#7d8c9d] mt-0.5 line-clamp-1">
                      {tier.description}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Color Selector */}
            <div className="mb-4">
              <label className="text-[10px] sm:text-[11px] font-semibold text-[#8c9ba8] block mb-1.5 uppercase tracking-wider">YOUR PIECES</label>
              <div className="grid grid-cols-3 gap-2">
                {(['w', 'b', 'random'] as const).map((color) => {
                  const isSelected = selectedColor === color;
                  const label = color === 'w' ? 'White' : color === 'b' ? 'Black' : 'Random';
                  return (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer touch-manipulation ${
                        isSelected
                          ? 'bg-[#d8b065] text-[#1a120b] border-[#d8b065] font-bold shadow-sm'
                          : 'bg-[#1a212b] text-[#97a5b6] border-[#2d3847] hover:border-[#415166]'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => onStartAI(selectedTier, selectedColor)}
              className="w-full py-3.5 rounded-xl bg-[#d8b065] hover:bg-[#e8be72] active:scale-[0.98] text-[#1a120b] font-bold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer touch-manipulation min-h-[46px] shadow-lg shadow-[#d8b065]/15"
            >
              <span>START MATCH NOW</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Secondary Navigation Row */}
        <div className="flex items-center justify-center gap-4 sm:gap-6 mt-5 sm:mt-6 text-xs text-[#a39482]">
          <button
            onClick={() => onOpenMultiplayer('join')}
            className="hover:text-[#f3eade] transition-colors flex items-center gap-1.5 cursor-pointer font-medium"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Join with Code</span>
          </button>
          <span>·</span>
          <button
            onClick={onOpenLeaderboard}
            className="hover:text-[#f3eade] transition-colors flex items-center gap-1.5 cursor-pointer font-medium"
          >
            <Trophy className="w-3.5 h-3.5 text-[#d8b065]" />
            <span>Leaderboard</span>
          </button>
          <span>·</span>
          <button
            onClick={onOpenProfile}
            className="hover:text-[#f3eade] transition-colors flex items-center gap-1.5 cursor-pointer font-medium"
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile</span>
          </button>
        </div>
      </div>

      {/* Control Hint Footer */}
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between text-[10px] sm:text-[11px] text-[#6d7988] font-mono tabular-nums pointer-events-auto">
        <div>
          <span>{viewDimension === '3d' ? '3D Spatial Arena' : 'Classic 2D Board'}</span>
          <span className="mx-2">·</span>
          <span>Switch 2D/3D anytime</span>
        </div>
        <div className="hidden sm:block">
          <span>Web Audio Synthesis Active</span>
        </div>
      </div>
    </div>
  );
};

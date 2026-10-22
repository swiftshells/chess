import React from 'react';
import { X, Copy, Check, Users, ArrowRight, Clock } from 'lucide-react';
import { TimeControlPreset, PieceColor } from '../types/chess';

interface MultiplayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'create' | 'join';
  onCreateRoom: (timeControl: TimeControlPreset, color: 'w' | 'b' | 'random') => void;
  onJoinRoom: (roomCode: string) => void;
  createdRoomCode?: string | null;
  isWaitingForOpponent?: boolean;
}

const TIME_OPTIONS: { id: TimeControlPreset; label: string; desc: string }[] = [
  { id: 'blitz_3_2', label: 'Blitz 3+2', desc: '3 min + 2s increment' },
  { id: 'rapid_5_0', label: 'Rapid 5+0', desc: '5 min sudden death' },
  { id: 'rapid_10_0', label: 'Rapid 10+0', desc: '10 min classic rapid' },
  { id: 'classical_15_10', label: 'Classical 15+10', desc: '15 min + 10s increment' },
  { id: 'untimed', label: 'Untimed', desc: 'No clocks, relaxed play' },
];

export const MultiplayerModal: React.FC<MultiplayerModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'create',
  onCreateRoom,
  onJoinRoom,
  createdRoomCode,
  isWaitingForOpponent = false,
}) => {
  const [activeTab, setActiveTab] = React.useState<'create' | 'join'>(initialTab);
  const [selectedTimeControl, setSelectedTimeControl] = React.useState<TimeControlPreset>('rapid_10_0');
  const [selectedColor, setSelectedColor] = React.useState<'w' | 'b' | 'random'>('w');
  const [joinCode, setJoinCode] = React.useState('');
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    if (!createdRoomCode) return;
    const url = `${window.location.origin}?room=${createdRoomCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.trim().length >= 4) {
      onJoinRoom(joinCode.trim().toUpperCase());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-[#141920] border border-[#303c4c] shadow-2xl p-6 text-left">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#242d38] mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#271d15] border border-[#d8b065]/40 flex items-center justify-center text-[#d8b065]">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#f3eade]">Private Multiplayer</h2>
              <p className="text-xs text-[#8c9ba8]">Play with friends via direct room code</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#8c9ba8] hover:text-[#f3eade] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle (if not waiting in active created room) */}
        {!createdRoomCode && (
          <div className="grid grid-cols-2 gap-1 p-1 bg-[#1a212b] rounded-lg border border-[#2b3543] mb-5">
            <button
              onClick={() => setActiveTab('create')}
              className={`py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeTab === 'create'
                  ? 'bg-[#d8b065] text-[#1a120b] shadow-sm'
                  : 'text-[#8c9ba8] hover:text-[#f3eade]'
              }`}
            >
              Create Room
            </button>
            <button
              onClick={() => setActiveTab('join')}
              className={`py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeTab === 'join'
                  ? 'bg-[#d8b065] text-[#1a120b] shadow-sm'
                  : 'text-[#8c9ba8] hover:text-[#f3eade]'
              }`}
            >
              Join Room
            </button>
          </div>
        )}

        {/* State: Waiting in Created Room */}
        {createdRoomCode && isWaitingForOpponent ? (
          <div className="text-center py-4 space-y-4">
            <div className="p-4 rounded-xl bg-[#1b222c] border border-[#d8b065]/30">
              <span className="text-xs text-[#8c9ba8] uppercase tracking-wider block mb-1">Your Match Room Code</span>
              <div className="text-3xl font-extrabold font-mono tracking-widest text-[#d8b065]">
                {createdRoomCode}
              </div>
            </div>

            <div className="flex items-center justify-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#d8b065]" />
              <span className="text-xs text-[#cbd5e1] font-medium">Waiting for opponent to connect...</span>
            </div>

            <button
              onClick={handleCopyLink}
              className="w-full py-3 rounded-lg bg-[#271d15] hover:bg-[#35251a] border border-[#d8b065] text-[#f3eade] text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-[#62a06e]" />
                  <span>Invite Link Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-[#d8b065]" />
                  <span>Copy Direct Invite Link</span>
                </>
              )}
            </button>

            <p className="text-[11px] text-[#64748b]">
              Share this code or link with your opponent. Match will start automatically when they join.
            </p>
          </div>
        ) : activeTab === 'create' ? (
          /* Tab 1: Create Room */
          <div className="space-y-4">
            {/* Time Control Options */}
            <div>
              <label className="text-xs font-semibold text-[#8c9ba8] flex items-center gap-1.5 mb-2">
                <Clock className="w-3.5 h-3.5 text-[#d8b065]" />
                <span>Time Control</span>
              </label>
              <div className="grid grid-cols-1 gap-2">
                {TIME_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedTimeControl(opt.id)}
                    className={`p-2.5 rounded-lg border text-left transition-all flex items-center justify-between cursor-pointer ${
                      selectedTimeControl === opt.id
                        ? 'bg-[#271d15] border-[#d8b065] text-[#f3eade]'
                        : 'bg-[#1a212b] border-[#29323f] text-[#8c9ba8] hover:border-[#3c4a5c]'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-semibold">{opt.label}</div>
                      <div className="text-[10px] text-[#64748b]">{opt.desc}</div>
                    </div>
                    {selectedTimeControl === opt.id && (
                      <div className="w-2 h-2 rounded-full bg-[#d8b065]" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Preferred Color */}
            <div>
              <label className="text-xs font-semibold text-[#8c9ba8] block mb-2">
                Your Starting Pieces
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['w', 'b', 'random'] as const).map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition-all cursor-pointer ${
                      selectedColor === color
                        ? 'bg-[#d8b065] text-[#1a120b] border-[#d8b065] font-bold'
                        : 'bg-[#1a212b] text-[#97a5b6] border-[#29323f] hover:border-[#3c4a5c]'
                    }`}
                  >
                    {color === 'w' ? 'White' : color === 'b' ? 'Black' : 'Random'}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => onCreateRoom(selectedTimeControl, selectedColor)}
              className="w-full py-3.5 rounded-lg bg-[#d8b065] hover:bg-[#e8be72] text-[#1a120b] font-bold text-xs tracking-wider uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer mt-4"
            >
              <span>GENERATE ROOM CODE</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* Tab 2: Join Room */
          <form onSubmit={handleJoinSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#8c9ba8] block mb-2">
                Enter 6-Character Room Code
              </label>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="e.g. NOR-742"
                maxLength={8}
                className="w-full bg-[#12161c] border border-[#2f3b4a] rounded-lg px-4 py-3 text-center text-lg font-mono tracking-widest text-[#d8b065] placeholder-[#475569] focus:outline-none focus:border-[#d8b065]"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={joinCode.trim().length < 4}
              className="w-full py-3.5 rounded-lg bg-[#d8b065] hover:bg-[#e8be72] disabled:opacity-40 disabled:cursor-not-allowed text-[#1a120b] font-bold text-xs tracking-wider uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>JOIN MATCH</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

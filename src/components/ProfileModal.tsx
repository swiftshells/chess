import React from 'react';
import { X, User, Check, Cloud, ShieldCheck } from 'lucide-react';
import { UserProfile } from '../types/chess';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onUpdateUsername: (newName: string) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onUpdateUsername,
}) => {
  const [nameInput, setNameInput] = React.useState(userProfile.username);
  const [isSaved, setIsSaved] = React.useState(false);

  React.useEffect(() => {
    setNameInput(userProfile.username);
  }, [userProfile.username]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim()) {
      onUpdateUsername(nameInput.trim());
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }
  };

  const totalMatches = userProfile.wins + userProfile.losses + userProfile.draws;
  const winRate = totalMatches > 0 ? Math.round((userProfile.wins / totalMatches) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-[#141920] border border-[#303c4c] shadow-2xl p-6 text-left flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#242d38] mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#271d15] border border-[#d8b065]/40 flex items-center justify-center text-[#d8b065]">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#f3eade]">Player Career</h2>
              <p className="text-xs text-[#8c9ba8]">Stats & cloud-saved identity</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#8c9ba8] hover:text-[#f3eade] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Username Edit */}
        <form onSubmit={handleSave} className="mb-5">
          <label className="text-xs font-semibold text-[#8c9ba8] block mb-1.5">
            Display Name
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              maxLength={24}
              className="flex-1 bg-[#12161c] border border-[#2f3b4a] rounded-lg px-3 py-2 text-xs text-[#f3eade] focus:outline-none focus:border-[#d8b065]"
            />
            <button
              type="submit"
              className="px-3.5 py-2 rounded-lg bg-[#d8b065] hover:bg-[#e8be72] text-[#1a120b] font-bold text-xs transition-colors cursor-pointer flex items-center gap-1"
            >
              {isSaved ? <Check className="w-3.5 h-3.5 text-[#1a120b]" /> : 'Save'}
            </button>
          </div>
        </form>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-2 mb-5">
          <div className="p-3 rounded-lg bg-[#1a212b] border border-[#2b3543] text-center">
            <div className="text-[10px] text-[#8c9ba8] uppercase">ELO Rating</div>
            <div className="text-base font-bold font-mono text-[#d8b065] mt-0.5">
              {userProfile.elo}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-[#1a212b] border border-[#2b3543] text-center">
            <div className="text-[10px] text-[#8c9ba8] uppercase">Wins</div>
            <div className="text-base font-bold font-mono text-[#62a06e] mt-0.5">
              {userProfile.wins}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-[#1a212b] border border-[#2b3543] text-center">
            <div className="text-[10px] text-[#8c9ba8] uppercase">Losses</div>
            <div className="text-base font-bold font-mono text-[#e05252] mt-0.5">
              {userProfile.losses}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-[#1a212b] border border-[#2b3543] text-center">
            <div className="text-[10px] text-[#8c9ba8] uppercase">Win Rate</div>
            <div className="text-base font-bold font-mono text-[#f3eade] mt-0.5">
              {winRate}%
            </div>
          </div>
        </div>

        {/* Recent Matches */}
        <div className="flex-1 overflow-y-auto mb-4">
          <h3 className="text-xs font-semibold text-[#8c9ba8] mb-2 uppercase tracking-wider">
            Recent Match History
          </h3>
          {userProfile.recentMatches.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#556372]">
              No matches recorded yet. Play vs AI or join a private room!
            </div>
          ) : (
            <div className="space-y-2">
              {userProfile.recentMatches.map((m) => (
                <div
                  key={m.id}
                  className="p-2.5 rounded-lg bg-[#1a212b] border border-[#252f3d] flex items-center justify-between text-xs font-mono tabular-nums"
                >
                  <div>
                    <div className="font-sans font-medium text-[#f3eade]">
                      vs {m.opponentName} ({m.opponentElo})
                    </div>
                    <div className="text-[10px] text-[#718294] mt-0.5">
                      {m.mode.toUpperCase()} · {m.movesCount} moves · {new Date(m.date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                        m.result === 'win'
                          ? 'bg-[#1e3323] text-[#62a06e]'
                          : m.result === 'loss'
                          ? 'bg-[#331c1e] text-[#e05252]'
                          : 'bg-[#282f3a] text-[#a39482]'
                      }`}
                    >
                      {m.result.toUpperCase()}
                    </span>
                    <span
                      className={`font-bold ${
                        m.eloDelta >= 0 ? 'text-[#62a06e]' : 'text-[#e05252]'
                      }`}
                    >
                      {m.eloDelta >= 0 ? `+${m.eloDelta}` : m.eloDelta}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cloud Sync Footer */}
        <div className="pt-3 border-t border-[#242d38] flex items-center justify-between text-[11px] text-[#64748b]">
          <div className="flex items-center gap-1.5 text-[#62a06e]">
            <Cloud className="w-3.5 h-3.5" />
            <span>Cloud Save Active</span>
          </div>
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#d8b065]" />
            <span>Cross-Platform Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
};

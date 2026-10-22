import React from 'react';
import { X, Trophy, Medal, RotateCw } from 'lucide-react';
import { LeaderboardEntry } from '../types/chess';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  currentUserId,
}) => {
  const [entries, setEntries] = React.useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchLeaderboard = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/leaderboard');
      const data = await res.json();
      if (data.leaderboard) {
        setEntries(data.leaderboard);
      }
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (isOpen) {
      fetchLeaderboard();
    }
  }, [isOpen, fetchLeaderboard]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-2xl bg-[#141920] border border-[#303c4c] shadow-2xl p-6 text-left flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#242d38] mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#271d15] border border-[#d8b065]/40 flex items-center justify-center text-[#d8b065]">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#f3eade]">Global Rankings</h2>
              <p className="text-xs text-[#8c9ba8]">Top rated Nordic Chess masters</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchLeaderboard}
              className="p-1.5 rounded-lg bg-[#1a212b] hover:bg-[#252e3b] text-[#8c9ba8] hover:text-[#f3eade] transition-colors cursor-pointer"
              title="Refresh Leaderboard"
            >
              <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded text-[#8c9ba8] hover:text-[#f3eade] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto pr-1">
          {isLoading && entries.length === 0 ? (
            <div className="py-16 text-center text-xs text-[#6d7988]">
              Loading rankings...
            </div>
          ) : (
            <table className="w-full text-left text-xs font-mono tabular-nums">
              <thead>
                <tr className="border-b border-[#242d38] text-[#6d7988] text-[11px] font-sans">
                  <th className="py-2.5 px-3">Rank</th>
                  <th className="py-2.5 px-3">Player</th>
                  <th className="py-2.5 px-3 text-right">ELO</th>
                  <th className="py-2.5 px-3 text-right hidden sm:table-cell">W / L / D</th>
                  <th className="py-2.5 px-3 text-right">Win Rate</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, idx) => {
                  const rank = idx + 1;
                  const isMe = entry.id === currentUserId;
                  const total = entry.wins + entry.losses + entry.draws;
                  const winRate = total > 0 ? Math.round((entry.wins / total) * 100) : 0;

                  return (
                    <tr
                      key={entry.id}
                      className={`border-b border-[#1c232d] transition-colors ${
                        isMe
                          ? 'bg-[#2a2016] text-[#f3eade]'
                          : 'hover:bg-[#1a212b] text-[#cbd5e1]'
                      }`}
                    >
                      <td className="py-3 px-3 font-bold">
                        <div className="flex items-center gap-1.5">
                          {rank === 1 ? (
                            <Medal className="w-4 h-4 text-[#e5a952]" />
                          ) : rank === 2 ? (
                            <Medal className="w-4 h-4 text-[#cbd5e1]" />
                          ) : rank === 3 ? (
                            <Medal className="w-4 h-4 text-[#b4815a]" />
                          ) : (
                            <span className="text-[#64748b] ml-1">{rank}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-sans font-medium">
                        <div className="flex items-center gap-2">
                          <span>{entry.username}</span>
                          {isMe && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#d8b065] text-[#1a120b] font-bold">
                              YOU
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-[#d8b065]">
                        {entry.elo}
                      </td>
                      <td className="py-3 px-3 text-right text-[#8c9ba8] hidden sm:table-cell">
                        {entry.wins} / {entry.losses} / {entry.draws}
                      </td>
                      <td className="py-3 px-3 text-right font-medium">
                        <span className={winRate >= 50 ? 'text-[#62a06e]' : 'text-[#8c9ba8]'}>
                          {winRate}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

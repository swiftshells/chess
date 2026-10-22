import React from 'react';
import { X, Send, Copy, Check, MessageSquare, ListOrdered } from 'lucide-react';
import { ChatMessage, MoveRecord } from '../types/chess';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  moves: MoveRecord[];
  currentUserId: string;
}

const QUICK_EMOJIS = ['👋', '♟️', '👏', '🤔', '🔥', '😮', '🤝', '👑'];

export const ChatDrawer: React.FC<ChatDrawerProps> = ({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  moves,
  currentUserId,
}) => {
  const [activeTab, setActiveTab] = React.useState<'chat' | 'moves'>('chat');
  const [inputText, setInputText] = React.useState('');
  const [copiedPgn, setCopiedPgn] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  if (!isOpen) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleCopyPgn = () => {
    // Generate simple PGN text
    let pgnText = '';
    for (let i = 0; i < moves.length; i += 2) {
      const moveNum = Math.floor(i / 2) + 1;
      const whiteMove = moves[i]?.san || '';
      const blackMove = moves[i + 1]?.san || '';
      pgnText += `${moveNum}. ${whiteMove} ${blackMove} `.trim() + ' ';
    }
    navigator.clipboard.writeText(pgnText);
    setCopiedPgn(true);
    setTimeout(() => setCopiedPgn(false), 2000);
  };

  return (
    <div className="fixed top-16 right-4 bottom-20 w-80 md:w-96 z-30 flex flex-col rounded-xl bg-[#141920]/95 border border-[#303c4c] shadow-2xl backdrop-blur-md overflow-hidden animate-in fade-in slide-in-from-right duration-200">
      {/* Header with Tabs */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2b3543] bg-[#1a212b]">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-[#d8b065] text-[#1a120b]'
                : 'text-[#8c9ba8] hover:text-[#f3eade]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat</span>
          </button>
          <button
            onClick={() => setActiveTab('moves')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'moves'
                ? 'bg-[#d8b065] text-[#1a120b]'
                : 'text-[#8c9ba8] hover:text-[#f3eade]'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>Moves ({moves.length})</span>
          </button>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded text-[#8c9ba8] hover:text-[#f3eade] transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tab 1: Chat Stream */}
      {activeTab === 'chat' ? (
        <div className="flex-1 flex flex-col justify-between overflow-hidden">
          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-xs text-[#6d7988]">
                <MessageSquare className="w-8 h-8 mb-2 opacity-40 text-[#d8b065]" />
                <p>No messages yet.</p>
                <p className="text-[11px] mt-1 text-[#556372]">Say hello or send a reaction!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderId === currentUserId;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] text-[#7d8c9d] mb-0.5">
                      <span className="font-medium text-[#f3eade]">{isMe ? 'You' : msg.senderName}</span>
                      {msg.senderColor && (
                        <span>({msg.senderColor === 'w' ? 'White' : 'Black'})</span>
                      )}
                      <span>·</span>
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div
                      className={`px-3 py-2 rounded-lg text-xs leading-relaxed max-w-[85%] break-words ${
                        isMe
                          ? 'bg-[#33261a] border border-[#d8b065]/40 text-[#f3eade]'
                          : 'bg-[#1c232d] border border-[#2e3947] text-[#e0e6ed]'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Reaction Emoji Bar */}
          <div className="px-3 py-1.5 bg-[#171d26] border-t border-[#252f3d] flex items-center justify-between gap-1">
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => onSendMessage(emoji)}
                className="p-1 hover:bg-[#252e3b] rounded transition-transform hover:scale-125 text-sm cursor-pointer"
                title={`Send ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Chat Input Form */}
          <form onSubmit={handleSend} className="p-3 bg-[#1a212b] border-t border-[#2b3543] flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Send a message..."
              className="flex-1 bg-[#12161c] border border-[#2f3b4a] rounded-lg px-3 py-2 text-xs text-[#f3eade] placeholder-[#5a6878] focus:outline-none focus:border-[#d8b065]"
              maxLength={200}
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2 bg-[#d8b065] hover:bg-[#e8be72] disabled:opacity-40 disabled:cursor-not-allowed text-[#1a120b] rounded-lg transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      ) : (
        /* Tab 2: Move Notation */
        <div className="flex-1 flex flex-col justify-between overflow-hidden p-4">
          <div className="flex-1 overflow-y-auto pr-1">
            {moves.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-[#6d7988]">
                No moves recorded yet.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-mono tabular-nums">
                {Array.from({ length: Math.ceil(moves.length / 2) }).map((_, i) => {
                  const whiteMove = moves[i * 2];
                  const blackMove = moves[i * 2 + 1];
                  return (
                    <React.Fragment key={i}>
                      <div className="flex items-center gap-2 py-1 px-1.5 rounded hover:bg-[#1f2733] text-[#f3eade]">
                        <span className="text-[#64748b] text-[11px] w-5">{i + 1}.</span>
                        <span className="font-semibold text-[#d8b065]">{whiteMove?.san}</span>
                      </div>
                      <div className="flex items-center gap-2 py-1 px-1.5 rounded hover:bg-[#1f2733] text-[#cbd5e1]">
                        {blackMove ? (
                          <span className="font-semibold">{blackMove.san}</span>
                        ) : (
                          <span className="text-[#4b5563]">...</span>
                        )}
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            )}
          </div>

          {/* Export PGN Button */}
          {moves.length > 0 && (
            <button
              onClick={handleCopyPgn}
              className="w-full py-2.5 rounded-lg bg-[#1c232d] hover:bg-[#252e3b] border border-[#2b3543] text-xs font-semibold text-[#f3eade] transition-colors flex items-center justify-center gap-2 cursor-pointer mt-3"
            >
              {copiedPgn ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#62a06e]" />
                  <span>PGN Copied to Clipboard</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#d8b065]" />
                  <span>Copy Notation (PGN)</span>
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

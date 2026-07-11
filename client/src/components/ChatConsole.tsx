"use client";

import { useEffect, useState, useRef } from "react";
import { Send, Globe, Users, X, AlertCircle } from "lucide-react";
import { socket } from "@/stores/socket-store";
import { useAuth } from "@/stores/auth-store";
import { cn } from "@/lib/utils";

interface ChatMessage {
  roomCode: string;
  scope: "global" | "team";
  team: "A" | "B";
  sender: {
    _id: string;
    username: string;
    fullName?: string;
  };
  message: string;
  createdAt: string | Date;
}

interface ChatConsoleProps {
  roomCode: string;
  isOpen: boolean;
  onClose: () => void;
  userTeam: "A" | "B" | null;
  roomStatus: string;
}

export function ChatConsole({ roomCode, isOpen, onClose, userTeam, roomStatus }: ChatConsoleProps) {
  const user = useAuth((s) => s.user);
  const [activeTab, setActiveTab] = useState<"team" | "global">("team");
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window !== "undefined" && roomCode) {
      const saved = localStorage.getItem(`devarena_chat_${roomCode}`);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return [];
        }
      }
    }
    return [];
  });
  const [chatError, setChatError] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Clean up localStorage if match is finished or cancelled
  useEffect(() => {
    if (roomStatus === "FINISHED" || roomStatus === "CANCELLED") {
      localStorage.removeItem(`devarena_chat_${roomCode}`);
    }
  }, [roomStatus, roomCode]);

  // Join chat channel on mount or when roomCode / userTeam changes
  useEffect(() => {
    if (!roomCode) return;

    // Join room chat
    socket.emit("battle:chat:join", { roomCode });

    const handleMessage = (msg: ChatMessage) => {
      if (msg.roomCode === roomCode) {
        setMessages((prev) => {
          const updated = [...prev, msg];
          localStorage.setItem(`devarena_chat_${roomCode}`, JSON.stringify(updated));
          return updated;
        });
      }
    };

    const handleError = (err: { message: string }) => {
      setChatError(err.message);
      setTimeout(() => setChatError(null), 4000);
    };

    socket.on("battle:chat:message", handleMessage);
    socket.on("battle:chat:error", handleError);

    return () => {
      socket.off("battle:chat:message", handleMessage);
      socket.off("battle:chat:error", handleError);
    };
  }, [roomCode, userTeam]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const text = messageText.trim();
    if (!text || !roomCode) return;

    // Global messages must be prefixed with "!!"
    const finalMessage = activeTab === "global" ? `!!${text}` : text;

    socket.emit("battle:chat:send", {
      roomCode,
      message: finalMessage,
    });

    setMessageText("");
  };

  // Filter messages based on active tab
  // - "global" tab: only show global room-wide messages
  // - "team" tab: only show team-only private messages
  const filteredMessages = messages.filter((msg) => {
    if (activeTab === "global") {
      return msg.scope === "global";
    }
    return msg.scope === "team" && msg.team === userTeam;
  });

  return (
    <div
      className={cn(
        "fixed top-14 bottom-0 right-0 z-45 w-80 bg-surface border-l border-border shadow-2xl flex flex-col transition-transform duration-300 ease-in-out select-none",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}
    >
      {/* Header */}
      <div className="h-12 border-b border-border/80 px-4 flex items-center justify-between shrink-0 bg-surface-2/60">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="text-xs font-bold font-mono tracking-wider text-text uppercase">Room Chat</h3>
        </div>
        <button
          onClick={onClose}
          className="text-text-faint hover:text-text p-1 rounded-md transition-colors cursor-pointer"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 h-10 border-b border-border/50 bg-surface-3/30 shrink-0">
        <button
          onClick={() => setActiveTab("team")}
          className={cn(
            "flex items-center justify-center gap-1.5 text-[11px] font-bold font-mono tracking-wider uppercase border-b-2 transition-all cursor-pointer",
            activeTab === "team"
              ? "border-primary text-text bg-surface-2/20"
              : "border-transparent text-text-faint hover:text-text-muted"
          )}
        >
          <Users className="size-3.5" />
          Team Chat {userTeam && `(${userTeam})`}
        </button>
        <button
          onClick={() => setActiveTab("global")}
          className={cn(
            "flex items-center justify-center gap-1.5 text-[11px] font-bold font-mono tracking-wider uppercase border-b-2 transition-all cursor-pointer",
            activeTab === "global"
              ? "border-primary text-text bg-surface-2/20"
              : "border-transparent text-text-faint hover:text-text-muted"
          )}
        >
          <Globe className="size-3.5" />
          Global Chat
        </button>
      </div>

      {/* Error Alert */}
      {chatError && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-3 py-1.5 flex items-center gap-1.5 text-[11px] text-red-500 shrink-0 font-mono">
          <AlertCircle className="size-3.5 shrink-0" />
          <span>{chatError}</span>
        </div>
      )}

      {/* Message List */}
      <div
        ref={scrollRef}
        className="flex-1 p-4 overflow-y-auto scrollbar-thin space-y-3 bg-surface/30 select-text"
      >
        {filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-1">
            <span className="text-text-faint text-[22px]">💬</span>
            <p className="text-[11px] text-text-faint font-mono">No messages yet.</p>
            <p className="text-[10px] text-text-faint font-mono max-w-[180px] leading-relaxed">
              {activeTab === "global" 
                ? "Send a message to both teams using Global chat."
                : "Coordinate with your teammates in confidence here."}
            </p>
          </div>
        ) : (
          filteredMessages.map((msg, idx) => {
            const isMe = msg.sender._id === user?._id;
            const timeStr = new Date(msg.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={idx}
                className={cn(
                  "flex flex-col max-w-[85%] space-y-0.5",
                  isMe ? "ml-auto items-end" : "mr-auto items-start"
                )}
              >
                {/* Sender Title details */}
                <div className="flex items-center gap-1.5 text-[10px] text-text-faint font-mono">
                  {!isMe && (
                    <span className="font-bold text-text-muted">
                      {msg.sender.username}
                    </span>
                  )}
                  <span>{timeStr}</span>
                  {msg.scope === "global" && (
                    <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1 rounded-[3px] text-[8px] font-bold uppercase tracking-wider scale-90">
                      Global
                    </span>
                  )}
                </div>

                {/* Message Bubble */}
                <div
                  className={cn(
                    "px-3 py-2 rounded-lg text-xs leading-relaxed break-words whitespace-pre-wrap font-sans",
                    isMe
                      ? msg.scope === "global"
                        ? "bg-indigo-600 text-white rounded-tr-none shadow-sm"
                        : "bg-primary text-white rounded-tr-none shadow-sm"
                      : msg.scope === "global"
                        ? "bg-indigo-500/10 text-text border border-indigo-500/20 rounded-tl-none"
                        : "bg-surface-3 border border-border/80 text-text rounded-tl-none"
                  )}
                >
                  {msg.message}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSend}
        className="p-3 border-t border-border/70 bg-surface-2/40 flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder={
            activeTab === "global"
              ? "Send global message..."
              : "Message your team..."
          }
          className="flex-1 bg-surface-3 border border-border/80 rounded-md px-3 py-1.5 text-xs text-text placeholder:text-text-faint outline-none font-mono focus:border-primary/50 transition-colors"
          maxLength={500}
        />
        <button
          type="submit"
          className="bg-primary hover:bg-primary-hover text-white p-1.5 rounded-md transition-colors cursor-pointer shrink-0 disabled:opacity-50"
          disabled={!messageText.trim()}
        >
          <Send className="size-4" />
        </button>
      </form>
    </div>
  );
}

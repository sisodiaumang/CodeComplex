"use client";

import { useEffect, useRef } from "react";
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoicePeer {
  socketId: string;
  username: string;
  isMuted: boolean;
  stream: MediaStream | null;
}

interface VoiceControlsProps {
  roomCode: string;
  voiceState: {
    isActive: boolean;
    isMuted: boolean;
    activePeers: VoicePeer[];
    locallyMutedPeers: string[];
    toggleLocalMute: (socketId: string) => void;
    joinVoice: (roomCode: string, scope?: "global" | "team") => Promise<void>;
    leaveVoice: () => void;
    toggleMute: () => void;
  };
}

/**
 * Renders a hidden <audio> element to output the remote WebRTC media stream.
 * React does not support assigning srcObject directly as a JSX prop, so we
 * must bind it procedurally within a useEffect.
 */
function AudioStream({ stream, muted }: { stream: MediaStream | null; muted: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current && stream) {
      audioRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <audio
      ref={audioRef}
      autoPlay
      playsInline
      controls={false}
      muted={muted}
      className="hidden"
    />
  );
}

export function VoiceControls({ roomCode, voiceState }: VoiceControlsProps) {
  const {
    isActive,
    isMuted,
    activePeers,
    locallyMutedPeers,
    toggleLocalMute,
    joinVoice,
    leaveVoice,
    toggleMute,
  } = voiceState;

  const handleJoinClick = () => {
    joinVoice(roomCode, "team");
  };

  return (
    <div className="flex items-center gap-2 select-none">
      {/* Hidden audio tracks list */}
      {isActive &&
        activePeers.map((peer) => (
          <AudioStream
            key={peer.socketId}
            stream={peer.stream}
            muted={locallyMutedPeers.includes(peer.socketId)}
          />
        ))}

      {/* Controller Buttons */}
      {!isActive ? (
        <button
          onClick={handleJoinClick}
          className="flex items-center gap-1.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-500 border border-emerald-500/20 px-3 py-1.5 rounded-md text-xs font-semibold font-mono transition-all cursor-pointer h-9 shadow-sm"
        >
          <Phone className="size-3.5" />
          <span>Join Voice</span>
        </button>
      ) : (
        <div className="flex items-center gap-1 bg-surface-2 border border-border px-2 py-1 rounded-md h-9 shadow-sm">
          {/* Mute toggle button */}
          <button
            onClick={toggleMute}
            className={cn(
              "p-1 rounded-md transition-colors cursor-pointer",
              isMuted
                ? "bg-red-500/10 hover:bg-red-500/20 text-red-500"
                : "bg-surface-3 hover:bg-surface-3/80 text-text-muted hover:text-text"
            )}
            title={isMuted ? "Unmute Mic" : "Mute Mic"}
          >
            {isMuted ? <MicOff className="size-3.5" /> : <Mic className="size-3.5" />}
          </button>

          {/* Voice list hover popup status badge */}
          <div className="relative group/voice px-1">
            <div className="flex items-center gap-1.5 text-[11px] font-mono font-semibold text-text-muted hover:text-text cursor-default px-1 py-0.5 rounded transition-all">
              <Volume2 className="size-3.5 text-emerald-500 animate-pulse" />
              <span>Voice ({activePeers.length + 1})</span>
            </div>

            {/* Float overlay list of members */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/voice:flex flex-col bg-surface border border-border/80 rounded-lg p-2.5 shadow-xl w-44 z-50 text-[11px] font-mono space-y-1.5">
              <div className="text-[9px] uppercase tracking-wider text-text-faint font-bold border-b border-border/50 pb-1">
                Active Speakers
              </div>
              
              {/* Local User */}
              <div className="flex items-center justify-between text-text gap-1">
                <span className="truncate flex items-center gap-1 text-emerald-500">
                  <User className="size-3 shrink-0" />
                  You (Speaker)
                </span>
                {isMuted && <MicOff className="size-3 text-red-500 shrink-0" />}
              </div>

              {/* Peers */}
              {activePeers.length === 0 ? (
                <div className="text-[10px] text-text-faint italic py-0.5">
                  No other peers online.
                </div>
              ) : (
                activePeers.map((peer) => {
                  const isLocallyMuted = locallyMutedPeers.includes(peer.socketId);
                  return (
                    <div
                      key={peer.socketId}
                      className="flex items-center justify-between text-text-muted gap-1 group/peer animate-fadeIn"
                    >
                      <span className="truncate flex items-center gap-1">
                        <User className="size-3 text-text-faint shrink-0" />
                        {peer.username}
                      </span>
                      <div className="flex items-center gap-1">
                        {peer.isMuted ? (
                          <MicOff className="size-3 text-red-500 shrink-0" />
                        ) : (
                          <Mic className="size-3 text-emerald-500 shrink-0" />
                        )}
                        <button
                          onClick={() => toggleLocalMute(peer.socketId)}
                          className={cn(
                            "p-0.5 rounded hover:bg-surface-3 transition-colors cursor-pointer",
                            isLocallyMuted ? "text-red-500" : "text-text-faint hover:text-text"
                          )}
                          title={isLocallyMuted ? "Unmute player locally" : "Mute player locally"}
                        >
                          {isLocallyMuted ? (
                            <VolumeX className="size-3" />
                          ) : (
                            <Volume2 className="size-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <span className="text-border mx-1">|</span>

          {/* Leave/disconnect button */}
          <button
            onClick={leaveVoice}
            className="p-1 rounded-md bg-surface-3 hover:bg-red-500/10 text-text-faint hover:text-red-500 transition-colors cursor-pointer"
            title="Disconnect Voice"
          >
            <PhoneOff className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

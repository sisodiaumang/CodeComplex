"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { socket } from "@/stores/socket-store";

interface VoicePeer {
  socketId: string;
  username: string;
  isMuted: boolean;
  stream: MediaStream | null;
}

export function useVoiceChat() {
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [activePeers, setActivePeers] = useState<VoicePeer[]>([]);
  const [locallyMutedPeers, setLocallyMutedPeers] = useState<string[]>([]);

  const toggleLocalMute = useCallback((socketId: string) => {
    setLocallyMutedPeers((prev) =>
      prev.includes(socketId) ? prev.filter((id) => id !== socketId) : [...prev, socketId]
    );
  }, []);
  
  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const peerStatesRef = useRef<Map<string, { username: string; isMuted: boolean }>>(new Map());
  const activeRoomCodeRef = useRef<string | null>(null);

  // Helper: clean up single peer connection
  const closePeerConnection = useCallback((socketId: string) => {
    const pc = peersRef.current.get(socketId);
    if (pc) {
      pc.close();
      peersRef.current.delete(socketId);
    }
    peerStatesRef.current.delete(socketId);
    setActivePeers((prev) => prev.filter((p) => p.socketId !== socketId));
  }, []);

  // Helper: clean up all voice connections
  const leaveVoice = useCallback(() => {
    if (activeRoomCodeRef.current) {
      socket.emit("battle:voice:leave", { roomCode: activeRoomCodeRef.current });
      activeRoomCodeRef.current = null;
    }

    // Stop local media
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    // Close peer connections
    peersRef.current.forEach((_, socketId) => closePeerConnection(socketId));
    peersRef.current.clear();
    peerStatesRef.current.clear();
    
    setIsActive(false);
    setIsMuted(false);
    setActivePeers([]);
  }, [closePeerConnection]);

  // Helper: Toggle mic mute state
  const toggleMute = useCallback(() => {
    if (!localStreamRef.current) return;
    
    const nextMute = !isMuted;
    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = !nextMute;
    });
    
    setIsMuted(nextMute);
    if (activeRoomCodeRef.current) {
      socket.emit("battle:voice:mute", { roomCode: activeRoomCodeRef.current, muted: nextMute });
    }
  }, [isMuted]);

  // WebRTC Connection Setup Logic
  const createPeerConnection = useCallback((
    targetSocketId: string, 
    username: string, 
    isPeerMuted: boolean,
    roomCode: string
  ): RTCPeerConnection => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    });

    peersRef.current.set(targetSocketId, pc);
    peerStatesRef.current.set(targetSocketId, { username, isMuted: isPeerMuted });

    // Handle local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle ICE Candidates negotiation
    pc.onicecandidate = (event) => {
      if (event.candidate && activeRoomCodeRef.current) {
        socket.emit("battle:voice:signal", {
          roomCode,
          to: targetSocketId,
          data: { candidate: event.candidate },
        });
      }
    };

    // Handle incoming audio track
    pc.ontrack = (event) => {
      const stream = event.streams[0];
      
      setActivePeers((prev) => {
        const existing = prev.find((p) => p.socketId === targetSocketId);
        if (existing) {
          return prev.map((p) => (p.socketId === targetSocketId ? { ...p, stream } : p));
        }
        return [
          ...prev,
          {
            socketId: targetSocketId,
            username,
            isMuted: isPeerMuted,
            stream,
          },
        ];
      });
    };

    return pc;
  }, []);

  const joinVoice = useCallback(async (roomCode: string, scope: "global" | "team" = "team") => {
    try {
      leaveVoice(); // safety cleanup

      // 1. Get User mic stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
      activeRoomCodeRef.current = roomCode;
      setIsActive(true);
      setIsMuted(false);

      // 2. Emit voice join
      socket.emit("battle:voice:join", { roomCode, scope });

    } catch (err) {
      console.error("[VoiceChat] Microphone permission denied:", err);
      alert("Could not access microphone. Please verify permission settings.");
      leaveVoice();
    }
  }, [leaveVoice]);

  // Handle Voice Chat Signal Events from Sockets
  useEffect(() => {
    if (!isActive) return;

    // A list of peers already in channel
    const handlePeers = async ({ peers }: { peers: Array<{ socketId: string; user: { username: string }; isMuted?: boolean }> }) => {
      const roomCode = activeRoomCodeRef.current;
      if (!roomCode) return;

      for (const p of peers) {
        const username = p.user?.username ?? "Player";
        const isPeerMuted = p.isMuted ?? false;
        const pc = createPeerConnection(p.socketId, username, isPeerMuted, roomCode);
        
        // Initiate connection via WebRTC Offer
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit("battle:voice:signal", {
            roomCode,
            to: p.socketId,
            data: { sdp: pc.localDescription },
          });
        } catch (err) {
          console.error("[VoiceChat] Failed to create WebRTC offer:", err);
        }
      }
    };

    // New participant joins the channel
    const handlePeerJoined = ({ socketId, user, isMuted: peerMuted }: { socketId: string; user?: { username: string }; isMuted?: boolean }) => {
      const roomCode = activeRoomCodeRef.current;
      if (!roomCode) return;

      const username = user?.username ?? "Player";
      const isPeerMuted = peerMuted ?? false;
      createPeerConnection(socketId, username, isPeerMuted, roomCode);
    };

    // Receive signal from peer (SDP Offer/Answer or ICE Candidate)
    const handleSignal = async ({ from, data }: { from: string; data: any }) => {
      const pc = peersRef.current.get(from);
      if (!pc) return;

      try {
        if (data.sdp) {
          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
          
          // If we received an Offer, we MUST generate an Answer
          if (data.sdp.type === "offer") {
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit("battle:voice:signal", {
              roomCode: activeRoomCodeRef.current,
              to: from,
              data: { sdp: pc.localDescription },
            });
          }
        } else if (data.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      } catch (err) {
        console.error("[VoiceChat] Signal handling failed:", err);
      }
    };

    // A peer mute status changes
    const handleMuteChanged = ({ socketId, muted }: { socketId: string; muted: boolean }) => {
      const state = peerStatesRef.current.get(socketId);
      if (state) {
        peerStatesRef.current.set(socketId, { ...state, isMuted: muted });
        setActivePeers((prev) =>
          prev.map((p) => (p.socketId === socketId ? { ...p, isMuted: muted } : p))
        );
      }
    };

    // A peer leaves the voice channel
    const handlePeerLeft = ({ socketId }: { socketId: string }) => {
      closePeerConnection(socketId);
    };

    // Receive socket errors
    const handleError = (err: { message: string }) => {
      console.error("[VoiceChat] Socket Error:", err.message);
      alert(`Voice Chat error: ${err.message}`);
    };

    socket.on("battle:voice:peers", handlePeers);
    socket.on("battle:voice:peer-joined", handlePeerJoined);
    socket.on("battle:voice:signal", handleSignal);
    socket.on("battle:voice:mute-changed", handleMuteChanged);
    socket.on("battle:voice:peer-left", handlePeerLeft);
    socket.on("battle:voice:error", handleError);

    return () => {
      socket.off("battle:voice:peers", handlePeers);
      socket.off("battle:voice:peer-joined", handlePeerJoined);
      socket.off("battle:voice:signal", handleSignal);
      socket.off("battle:voice:mute-changed", handleMuteChanged);
      socket.off("battle:voice:peer-left", handlePeerLeft);
      socket.off("battle:voice:error", handleError);
    };
  }, [isActive, createPeerConnection, closePeerConnection, leaveVoice]);

  // Safety cleanups on unmount
  useEffect(() => {
    return () => {
      leaveVoice();
    };
  }, [leaveVoice]);

  return {
    isActive,
    isMuted,
    activePeers,
    locallyMutedPeers,
    toggleLocalMute,
    joinVoice,
    leaveVoice,
    toggleMute,
    localStream: localStreamRef.current,
  };
}

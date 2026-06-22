import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

interface MatchTelemetry {
  userProgress: number;
  opponentProgress: number;
  verdictStream: Array<{ id: string; text: string; type: 'passed' | 'failed' | 'tle'; time?: string }>;
}

interface ArenaState {
  socket: Socket | null;
  isSearching: boolean;
  activeMatchId: string | null;
  opponentData: { name: string; rating: number } | null;
  matchTimer: number; // in seconds
  telemetry: MatchTelemetry;
  
  // Actions
  initializeSocket: () => void;
  startMatchmaking: (arenaType: 'dsa' | 'frontend' | 'backend') => void;
  cancelMatchmaking: () => void;
  updateCodeProgress: (progress: number) => void;
  disconnectSocket: () => void;
}

export const useArenaStore = create<ArenaState>((set, get) => ({
  socket: null,
  isSearching: false,
  activeMatchId: null,
  opponentData: null,
  matchTimer: 1500, // 25 minutes default [cite: 40, 347]
  telemetry: {
    userProgress: 0,
    opponentProgress: 0,
    verdictStream: [],
  },

  initializeSocket: () => {
    if (get().socket) return;

    // Point to your backend server port
    const socketInstance = io('http://localhost:5000', {
      autoConnect: true,
    });

    // Handle WebSocket event streams [cite: 326]
    socketInstance.on('match_found', (data) => {
      set({
        isSearching: false,
        activeMatchId: data.matchId,
        opponentData: { name: data.opponent.name, rating: data.opponent.rating },
        matchTimer: data.duration || 1500,
      });
    });

    socketInstance.on('timer_tick', (timeLeft: number) => {
      set({ matchTimer: timeLeft });
    });

    socketInstance.on('opponent_progress_update', (progress: number) => {
      set((state) => ({
        telemetry: { ...state.telemetry, opponentProgress: progress },
      }));
    });

    socketInstance.on('test_case_verdict', (verdict) => {
      set((state) => ({
        telemetry: {
          ...state.telemetry,
          verdictStream: [...state.telemetry.verdictStream, verdict],
        },
      }));
    });

    set({ socket: socketInstance });
  },

  startMatchmaking: (arenaType) => {
    const { socket } = get();
    if (!socket) return;
    
    set({ isSearching: true });
    socket.emit('join_queue', { arenaType }); // e.g., 'dsa' [cite: 43, 245]
  },

  cancelMatchmaking: () => {
    const { socket } = get();
    if (!socket) return;

    set({ isSearching: false });
    socket.emit('leave_queue');
  },

  updateCodeProgress: (progress) => {
    const { socket, activeMatchId } = get();
    if (socket && activeMatchId) {
      socket.emit('submit_progress', { matchId: activeMatchId, progress });
    }
    set((state) => ({
      telemetry: { ...state.telemetry, userProgress: progress },
    }));
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },
}));
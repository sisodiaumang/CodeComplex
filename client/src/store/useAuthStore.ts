import { create } from 'zustand';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  globalRank: string;
  dsaRating: number;
  frontendRating: number;
  backendRating: number;
}

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loginMock: (email: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  loginMock: async (email: string) => {
    set({ isLoading: true, error: null });
    
    // Simulating a short low-latency network handshake
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (!email.includes('@')) {
      set({ isLoading: false, error: "Invalid operational intelligence vector (Malformed Email)" });
      return false;
    }

    const mockUsername = email.split('@')[0];

    set({
      isLoading: false,
      isAuthenticated: true,
      user: {
        id: "usr_arena_9082",
        username: mockUsername.charAt(0).toUpperCase() + mockUsername.slice(1),
        email: email,
        globalRank: "#412",
        dsaRating: 1750,
        frontendRating: 1450,
        backendRating: 1620
      }
    });
    return true;
  },

  logout: () => {
    set({ user: null, isAuthenticated: false, error: null });
  },

  clearError: () => set({ error: null })
}));
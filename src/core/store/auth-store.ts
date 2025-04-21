import { create } from 'zustand';
import type { AuthUser } from '@/core/services/business/auth/types/auth-service';

interface AuthStoreState {
  user: AuthUser | null;
  token: string | null;
  setUser: (user: AuthUser | null) => void;
  setToken: (token: string | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthStoreState>((set) => ({
  user: null,
  token: null,
  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  clearAuth: () => set({ user: null, token: null }),
}));

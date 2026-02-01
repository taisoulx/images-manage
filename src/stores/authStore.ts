import { create } from 'zustand'

interface AuthState {
  token: string | null
  isAuthenticated: boolean
  user: string | null
}

interface AuthStore extends AuthState {
  setToken: (token: string) => void
  clearToken: () => void
  setUser: (user: string) => void
  clearUser: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  token: null,
  isAuthenticated: false,
  user: null,
  setToken: (token) => set({ token, isAuthenticated: !!token }),
  clearToken: () => set({ token: null, isAuthenticated: false }),
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}))

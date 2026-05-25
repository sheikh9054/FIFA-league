import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "./api";

interface AuthState {
  token: string | null;
  user: User | null;
  leagueId: string | null;
  theme: "dark" | "light";
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
  setLeagueId: (id: string) => void;
  setTheme: (theme: "dark" | "light") => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      leagueId: process.env.NEXT_PUBLIC_DEFAULT_LEAGUE_ID || "seed-league-1",
      theme: "dark",
      setAuth: (token, user) => set({ token, user }),
      clearAuth: () => set({ token: null, user: null }),
      setLeagueId: (leagueId) => set({ leagueId }),
      setTheme: (theme) => set({ theme }),
    }),
    { name: "fifa-league-auth" }
  )
);

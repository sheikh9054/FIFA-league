"use client";

import { useEffect } from "react";
import { getSocket } from "@/lib/socket";
import { useAuthStore } from "@/lib/store";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { token, leagueId, theme } = useAuthStore();

  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
    document.documentElement.classList.toggle("dark", theme !== "light");
  }, [theme]);

  useEffect(() => {
    if (!leagueId) return;
    const socket = getSocket(token);
    socket.emit("join:league", leagueId);
    return () => {
      socket.emit("leave:league", leagueId);
    };
  }, [leagueId, token]);

  return <>{children}</>;
}

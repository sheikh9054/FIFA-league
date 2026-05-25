"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSocket } from "@/lib/socket";
import { useAuthStore } from "@/lib/store";

export function useLeagueData<T>(
  fetcher: (leagueId: string, token?: string | null | undefined) => Promise<T>,
  events: string[] = ["standings:updated"]
) {
  const { leagueId, token } = useAuthStore();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const load = useCallback(async () => {
    if (!leagueId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetcherRef.current(leagueId, token ?? undefined);
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [leagueId, token]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!leagueId) return;
    const socket = getSocket(token);
    const handlers = events.map((event) => {
      const handler = () => load();
      socket.on(event, handler);
      return { event, handler };
    });
    return () => {
      handlers.forEach(({ event, handler }) => socket.off(event, handler));
    };
  }, [leagueId, token, load, events]);

  return { data, loading, error, refresh: load };
}

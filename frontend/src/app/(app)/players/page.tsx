"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { useState, useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { useLeagueData } from "@/hooks/useLeagueData";
import { getCountryFlag } from "@/lib/utils";

export default function PlayersPage() {
  const [search, setSearch] = useState("");
  const { data: players, loading } = useLeagueData(
    (id, token) => api.players.byLeague(id, token),
    ["standings:updated"]
  );

  const filtered = useMemo(() => {
    if (!players) return [];
    const q = search.toLowerCase();
    if (!q) return players;
    return players.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.nickname?.toLowerCase().includes(q)
    );
  }, [players, search]);

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-2 border-neon-blue border-t-transparent" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-black">Players</h1>
          <p className="text-muted-foreground">{players?.length ?? 0} registered players</p>
        </div>
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((player, i) => (
          <motion.div
            key={player.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link href={`/players/${player.id}`} className="glass-card block hover:border-neon-blue/40">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={player.avatar} />
                  <AvatarFallback className="text-lg">{player.nickname?.[0]}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-bold truncate">{player.nickname || player.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {getCountryFlag(player.country)} {player.favoriteClub}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <Badge>{player.points} pts</Badge>
                    <Badge variant="success">ELO {player.elo}</Badge>
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs">
                <div><p className="font-bold text-neon-green">{player.wins}</p><p className="text-muted-foreground">W</p></div>
                <div><p className="font-bold">{player.draws}</p><p className="text-muted-foreground">D</p></div>
                <div><p className="font-bold text-red-400">{player.losses}</p><p className="text-muted-foreground">L</p></div>
                <div><p className="font-bold">{player.winPercentage ?? 0}%</p><p className="text-muted-foreground">Win%</p></div>
              </div>
              {player.currentForm && (
                <div className="mt-3 flex gap-1">
                  {player.currentForm.split("").map((r, j) => (
                    <span
                      key={j}
                      className={`flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold ${
                        r === "W" ? "bg-neon-green/30 text-neon-green" :
                        r === "L" ? "bg-red-500/30 text-red-400" : "bg-white/20"
                      }`}
                    >
                      {r}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn, getCountryFlag } from "@/lib/utils";
import type { StandingPlayer } from "@/lib/api";

interface StandingsTableProps {
  standings: StandingPlayer[];
  live?: boolean;
}

export function StandingsTable({ standings, live }: StandingsTableProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return standings;
    return standings.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.nickname?.toLowerCase().includes(q) ||
        p.favoriteClub?.toLowerCase().includes(q)
    );
  }, [standings, search]);

  return (
    <div className="glass-card overflow-hidden p-0">
      <div className="flex flex-col gap-4 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">League Standings</h2>
          {live && (
            <Badge variant="success" className="animate-pulse">
              LIVE
            </Badge>
          )}
        </div>
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search players..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3 w-12">#</th>
              <th className="px-4 py-3">Player</th>
              <th className="px-4 py-3 text-center">P</th>
              <th className="px-4 py-3 text-center">W</th>
              <th className="px-4 py-3 text-center">D</th>
              <th className="px-4 py-3 text-center">L</th>
              <th className="px-4 py-3 text-center">GF</th>
              <th className="px-4 py-3 text-center">GA</th>
              <th className="px-4 py-3 text-center">GD</th>
              <th className="px-4 py-3 text-center font-bold">Pts</th>
              <th className="px-4 py-3 text-center">ELO</th>
              <th className="px-4 py-3 hidden md:table-cell">Form</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((player, idx) => {
              const rank = player.rank ?? idx + 1;
              const isChampions = rank <= 4;
              const isRelegation = rank > standings.length - 2 && standings.length > 4;

              return (
                <motion.tr
                  key={player.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.03 }}
                  className={cn(
                    "border-b border-white/5 transition-colors hover:bg-white/5",
                    isChampions && "standings-row-champions",
                    isRelegation && "standings-row-relegation"
                  )}
                >
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                        rank === 1 && "bg-neon-gold/30 text-neon-gold",
                        rank === 2 && "bg-gray-400/30 text-gray-300",
                        rank === 3 && "bg-amber-700/30 text-amber-600"
                      )}
                    >
                      {rank}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/players/${player.id}`} className="flex items-center gap-3 hover:text-neon-blue">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={player.avatar} />
                        <AvatarFallback>{player.nickname?.[0] || player.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{player.nickname || player.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {getCountryFlag(player.country)} {player.favoriteClub}
                        </p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-center">{player.played}</td>
                  <td className="px-4 py-3 text-center text-neon-green">{player.wins}</td>
                  <td className="px-4 py-3 text-center text-muted-foreground">{player.draws}</td>
                  <td className="px-4 py-3 text-center text-red-400">{player.losses}</td>
                  <td className="px-4 py-3 text-center">{player.goalsFor}</td>
                  <td className="px-4 py-3 text-center">{player.goalsAgainst}</td>
                  <td className={cn("px-4 py-3 text-center font-medium", player.goalDifference > 0 ? "text-neon-green" : player.goalDifference < 0 ? "text-red-400" : "")}>
                    {player.goalDifference > 0 ? "+" : ""}{player.goalDifference}
                  </td>
                  <td className="px-4 py-3 text-center text-lg font-black text-neon-blue">{player.points}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant="default">{player.elo}</Badge>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex gap-0.5">
                      {(player.currentForm || "").split("").map((r, i) => (
                        <span
                          key={i}
                          className={cn(
                            "flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold",
                            r === "W" && "bg-neon-green/30 text-neon-green",
                            r === "D" && "bg-white/20 text-muted-foreground",
                            r === "L" && "bg-red-500/30 text-red-400"
                          )}
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex gap-4 border-t border-white/10 p-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-neon-blue" /> Champions zone (Top 4)
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-red-500" /> Relegation zone
        </span>
      </div>
    </div>
  );
}

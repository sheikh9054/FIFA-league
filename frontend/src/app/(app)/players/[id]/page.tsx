"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MatchCard } from "@/components/matches/MatchCard";
import { EloChart } from "@/components/stats/EloChart";
import { api, type PlayerDetail } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { getCountryFlag } from "@/lib/utils";

export default function PlayerProfilePage() {
  const { id } = useParams();
  const { token } = useAuthStore();
  const [player, setPlayer] = useState<PlayerDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api.players.get(id as string, token).then(setPlayer).finally(() => setLoading(false));
  }, [id, token]);

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-2 border-neon-blue border-t-transparent" /></div>;
  }

  if (!player) return <p>Player not found</p>;

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card">
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <Avatar className="h-24 w-24 ring-4 ring-neon-blue/30">
            <AvatarImage src={player.avatar} />
            <AvatarFallback className="text-3xl">{player.nickname?.[0]}</AvatarFallback>
          </Avatar>
          <div className="text-center sm:text-left">
            <h1 className="font-display text-3xl font-black">{player.nickname || player.name}</h1>
            <p className="text-muted-foreground">{player.name}</p>
            <p className="mt-1">{getCountryFlag(player.country)} {player.favoriteClub}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              <Badge variant="success">ELO {player.elo}</Badge>
              <Badge>{player.points} Points</Badge>
              <Badge variant="warning">#{player.played} played</Badge>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4 lg:grid-cols-8">
        {[
          { label: "Played", value: player.played },
          { label: "Wins", value: player.wins, color: "text-neon-green" },
          { label: "Draws", value: player.draws },
          { label: "Losses", value: player.losses, color: "text-red-400" },
          { label: "GF", value: player.goalsFor },
          { label: "GA", value: player.goalsAgainst },
          { label: "GD", value: player.goalDifference },
          { label: "Win%", value: `${player.winPercentage ?? 0}%` },
        ].map((s) => (
          <div key={s.label} className="glass-card text-center p-4">
            <p className={`text-2xl font-black ${s.color || ""}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>ELO History</CardTitle></CardHeader>
          <CardContent>
            <EloChart data={player.eloHistory || []} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Current Form</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {(player.currentForm || "—").split("").map((r, i) => (
                <span
                  key={i}
                  className={`flex h-12 w-12 items-center justify-center rounded-xl text-lg font-black ${
                    r === "W" ? "bg-neon-green/30 text-neon-green" :
                    r === "L" ? "bg-red-500/30 text-red-400" : "bg-white/20"
                  }`}
                >
                  {r}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-4 text-xl font-bold">Match History</h2>
        <div className="space-y-2">
          {player.matchHistory?.map((m, i) => (
            <MatchCard key={m.id} match={m} index={i} />
          ))}
          {!player.matchHistory?.length && (
            <p className="text-muted-foreground">No matches yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

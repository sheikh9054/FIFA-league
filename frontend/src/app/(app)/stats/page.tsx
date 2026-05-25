"use client";

import { motion } from "framer-motion";
import { Target, Shield, Flame, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { api } from "@/lib/api";
import { useLeagueData } from "@/hooks/useLeagueData";

export default function StatsPage() {
  const { data: stats, loading } = useLeagueData(
    (id, token) => api.stats.get(id, token),
    ["standings:updated", "match:recorded"]
  );

  if (loading || !stats) {
    return <div className="flex h-64 items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-2 border-neon-blue border-t-transparent" /></div>;
  }

  const chartData = stats.topScorers?.map((p) => ({
    name: p.nickname || p.name,
    goals: p.goalsFor,
  })) ?? [];

  const highlights = [
    { icon: Target, label: "Best Attack", player: stats.bestAttack, value: stats.bestAttack?.goalsFor },
    { icon: Shield, label: "Best Defense", player: stats.bestDefense, value: stats.bestDefense?.goalsAgainst },
    { icon: Shield, label: "Most Clean Sheets", player: stats.mostCleanSheets, value: stats.mostCleanSheets?.cleanSheets },
    { icon: Flame, label: "Win Streak", player: stats.highestWinStreak?.player, value: stats.highestWinStreak?.streak },
    { icon: Activity, label: "Most Active", player: stats.mostActivePlayer, value: stats.mostActivePlayer?.played },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-black">Analytics</h1>
        <p className="text-muted-foreground">
          {stats.totalMatches} matches • {stats.totalGoals} goals • Avg {stats.avgGoalsPerMatch} per match
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {highlights.map((h, i) => (
          <motion.div key={h.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card>
              <CardContent className="flex items-center gap-4 pt-6">
                <h.icon className="h-8 w-8 text-neon-blue" />
                <div>
                  <p className="text-sm text-muted-foreground">{h.label}</p>
                  <p className="font-bold">{(h.player as { nickname?: string; name?: string })?.nickname || (h.player as { name?: string })?.name || "—"}</p>
                  <p className="text-2xl font-black text-neon-blue">{h.value ?? 0}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Top Scorers</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" />
                <Tooltip contentStyle={{ background: "rgba(10,22,40,0.9)", border: "1px solid rgba(0,212,255,0.3)" }} />
                <Bar dataKey="goals" fill="#00d4ff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>ELO Leaderboard</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {stats.eloLeaderboard?.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3">
                <span className="w-6 text-center font-bold text-muted-foreground">{i + 1}</span>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={p.avatar} />
                  <AvatarFallback>{p.nickname?.[0]}</AvatarFallback>
                </Avatar>
                <span className="flex-1 font-semibold">{p.nickname || p.name}</span>
                <Badge>{p.elo}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import { Trophy, Users, Swords, TrendingUp, Share2 } from "lucide-react";
import Link from "next/link";
import { StatCard } from "@/components/dashboard/StatCard";
import { MatchCard } from "@/components/matches/MatchCard";
import { StandingsTable } from "@/components/standings/StandingsTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { useLeagueData } from "@/hooks/useLeagueData";
import { shareWhatsApp } from "@/lib/utils";
export default function DashboardPage() {
  const { data, loading, error } = useLeagueData(
    (id, token) => api.leagues.dashboard(id, token),
    ["standings:updated", "match:recorded", "activity:new"]
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-neon-blue border-t-transparent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="glass-card text-center p-12">
        <p className="text-red-400">{error || "Could not load dashboard"}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Make sure the API is running on port 4000 and database is seeded.
        </p>
      </div>
    );
  }

  const { league, stats, topPlayers, recentMatches, upcomingFixtures, activities } = data;

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative overflow-hidden rounded-2xl glass border-neon-blue/20"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-neon-blue/10 via-neon-purple/10 to-neon-green/5" />
        <div className="relative flex flex-col gap-4 p-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Badge variant="warning" className="mb-2">{league.season}</Badge>
            <h1 className="font-display text-3xl font-black sm:text-4xl">{league.name}</h1>
            <p className="mt-1 text-muted-foreground">{league.description}</p>
            {league.inviteCode && (
              <p className="mt-2 text-sm">
                Invite code: <span className="font-mono text-neon-blue">{league.inviteCode}</span>
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Link href="/matches">
              <Button>Record Match</Button>
            </Link>
            <Button
              variant="secondary"
              onClick={() =>
                shareWhatsApp(
                  `🏆 ${league.name} Standings\nLeader: ${topPlayers[0]?.nickname || topPlayers[0]?.name} (${topPlayers[0]?.points} pts)`
                )
              }
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Matches Played" value={stats.totalMatches} icon={Swords} color="blue" delay={0} />
        <StatCard title="Players" value={stats.totalPlayers} icon={Users} color="purple" delay={1} />
        <StatCard
          title="League Leader"
          value={stats.topPlayer?.nickname || stats.topPlayer?.name || "—"}
          subtitle={`${stats.topPlayer?.points ?? 0} pts`}
          icon={Trophy}
          color="gold"
          delay={2}
        />
        <StatCard
          title="Leader ELO"
          value={stats.topPlayer?.elo ?? 1500}
          icon={TrendingUp}
          color="green"
          delay={3}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Matches */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Recent Matches</h2>
            <Link href="/matches" className="text-sm text-neon-blue hover:underline">View all</Link>
          </div>
          <div className="space-y-2">
            {recentMatches.length ? (
              recentMatches.map((m, i) => <MatchCard key={m.id} match={m} index={i} />)
            ) : (
              <p className="text-muted-foreground text-sm">No matches yet</p>
            )}
          </div>
        </div>

        {/* Activity Feed */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Live Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-80 overflow-y-auto">
            {activities.map((a) => (
              <div key={a.id} className="rounded-lg bg-white/5 p-3 text-sm">
                <p>{a.message}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(a.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
            {!activities.length && (
              <p className="text-sm text-muted-foreground">No activity yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Fixtures */}
      {upcomingFixtures.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Fixtures</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2">
              {upcomingFixtures.map((f) => (
                <div key={f.id} className="rounded-lg border border-white/10 p-3 text-sm">
                  <Badge variant="muted" className="mb-1">MD {f.matchday}</Badge>
                  <p>Matchday fixture scheduled</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mini Standings */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Standings Preview</h2>
          <Link href="/standings">
            <Button variant="secondary" size="sm">Full Table</Button>
          </Link>
        </div>
        <StandingsTable standings={topPlayers} live />
      </div>
    </div>
  );
}

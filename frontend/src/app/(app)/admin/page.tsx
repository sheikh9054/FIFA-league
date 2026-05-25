"use client";

import { useState } from "react";
import { Download, RefreshCw, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { useLeagueData } from "@/hooks/useLeagueData";

export default function AdminPage() {
  const { token, user, leagueId } = useAuthStore();
  const [newPlayer, setNewPlayer] = useState({ name: "", nickname: "", country: "", favoriteClub: "" });
  const { data: players, refresh } = useLeagueData(
    (id, t) => api.players.byLeague(id, t),
    []
  );

  if (user?.role !== "ADMIN") {
    return (
      <div className="glass-card text-center p-12">
        <p className="text-red-400">Admin access required</p>
        <p className="mt-2 text-sm text-muted-foreground">Login as admin@fifaleague.local</p>
      </div>
    );
  }

  async function addPlayer() {
    if (!token || !leagueId) return;
    await api.players.create({ ...newPlayer, leagueId }, token);
    setNewPlayer({ name: "", nickname: "", country: "", favoriteClub: "" });
    refresh();
  }

  async function exportData() {
    if (!token || !leagueId) return;
    const data = await api.admin.export(leagueId, token);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `league-export-${Date.now()}.json`;
    a.click();
  }

  async function resetElo() {
    if (!token || !leagueId || !confirm("Reset all ELO to 1500?")) return;
    await api.admin.resetElo(leagueId, token);
    refresh();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-black">Admin Panel</h1>
        <p className="text-muted-foreground">Manage players, export data, reset season</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" /> Add Player
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Full name" value={newPlayer.name} onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })} />
            <Input placeholder="Gamer tag" value={newPlayer.nickname} onChange={(e) => setNewPlayer({ ...newPlayer, nickname: e.target.value })} />
            <Input placeholder="Country code (ES, GB...)" value={newPlayer.country} onChange={(e) => setNewPlayer({ ...newPlayer, country: e.target.value })} />
            <Input placeholder="Favorite club" value={newPlayer.favoriteClub} onChange={(e) => setNewPlayer({ ...newPlayer, favoriteClub: e.target.value })} />
            <Button onClick={addPlayer} className="w-full">Add Player</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>League Actions</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Button variant="secondary" className="w-full" onClick={exportData}>
              <Download className="mr-2 h-4 w-4" /> Export All Data (JSON)
            </Button>
            <Button variant="secondary" className="w-full" onClick={resetElo}>
              <RefreshCw className="mr-2 h-4 w-4" /> Reset ELO Ratings
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Players ({players?.length ?? 0})</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {players?.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg bg-white/5 p-3">
                <span className="font-semibold">{p.nickname || p.name}</span>
                <span className="text-sm text-muted-foreground">{p.points} pts • ELO {p.elo}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

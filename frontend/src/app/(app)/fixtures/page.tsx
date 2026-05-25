"use client";

import { useState } from "react";
import { Calendar, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { useLeagueData } from "@/hooks/useLeagueData";
import { useAuthStore } from "@/lib/store";
import { formatDate } from "@/lib/utils";

export default function FixturesPage() {
  const { token, leagueId } = useAuthStore();
  const [generating, setGenerating] = useState(false);
  const { data: fixtures, loading, refresh } = useLeagueData(
    (id, token) => api.fixtures.byLeague(id, token),
    []
  );
  const { data: players } = useLeagueData(
    (id, token) => api.players.byLeague(id, token),
    []
  );

  async function generateFixtures(format: "round_robin" | "knockout" | "groups") {
    if (!token || !leagueId || !players?.length) return;
    setGenerating(true);
    try {
      await api.fixtures.generate(
        {
          leagueId,
          format,
          playerIds: players.map((p) => p.id),
        },
        token
      );
      refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    } finally {
      setGenerating(false);
    }
  }

  const byMatchday = fixtures?.reduce((acc, f) => {
    if (!acc[f.matchday]) acc[f.matchday] = [];
    acc[f.matchday].push(f);
    return acc;
  }, {} as Record<number, typeof fixtures>) ?? {};

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-black">Fixtures</h1>
          <p className="text-muted-foreground">Round robin, knockout & group schedules</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" disabled={generating} onClick={() => generateFixtures("round_robin")}>
            <Shuffle className="mr-2 h-4 w-4" /> Round Robin
          </Button>
          <Button variant="secondary" disabled={generating} onClick={() => generateFixtures("knockout")}>
            Knockout
          </Button>
          <Button variant="secondary" disabled={generating} onClick={() => generateFixtures("groups")}>
            Groups (UCL)
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-neon-blue border-t-transparent" />
      ) : Object.keys(byMatchday).length ? (
        Object.entries(byMatchday)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([md, fixs]) => (
            <Card key={md}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-neon-blue" />
                  Matchday {md}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 sm:grid-cols-2">
                {fixs?.map((f) => (
                  <div key={f.id} className="rounded-lg border border-white/10 p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">
                        {f.homePlayer?.nickname || "TBD"} vs {f.awayPlayer?.nickname || "TBD"}
                      </span>
                      <Badge variant={f.status === "SCHEDULED" ? "default" : "muted"}>{f.status}</Badge>
                    </div>
                    {f.scheduledAt && (
                      <p className="mt-1 text-xs text-muted-foreground">{formatDate(f.scheduledAt)}</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))
      ) : (
        <div className="glass-card text-center p-12">
          <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">No fixtures yet. Generate a schedule above.</p>
        </div>
      )}
    </div>
  );
}

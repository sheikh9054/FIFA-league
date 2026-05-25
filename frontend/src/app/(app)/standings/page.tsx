"use client";

import { Share2 } from "lucide-react";
import { StandingsTable } from "@/components/standings/StandingsTable";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useLeagueData } from "@/hooks/useLeagueData";
import { shareWhatsApp } from "@/lib/utils";

export default function StandingsPage() {
  const { data, loading, error } = useLeagueData(
    (id, token) => api.standings.get(id, token),
    ["standings:updated", "match:recorded"]
  );

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-2 border-neon-blue border-t-transparent" /></div>;
  }

  if (error || !data) {
    return <p className="text-red-400">{error}</p>;
  }

  const shareText = data
    .slice(0, 5)
    .map((p) => `${p.rank}. ${p.nickname || p.name} - ${p.points}pts`)
    .join("\n");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-black">Standings</h1>
          <p className="text-muted-foreground">Live league table • Top 4 highlighted</p>
        </div>
        <Button
          variant="secondary"
          onClick={() => shareWhatsApp(`🏆 League Standings\n\n${shareText}`)}
        >
          <Share2 className="mr-2 h-4 w-4" /> Share
        </Button>
      </div>
      <StandingsTable standings={data} live />
    </div>
  );
}

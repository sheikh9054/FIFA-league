"use client";

import { RecordMatchForm } from "@/components/matches/RecordMatchForm";
import { MatchCard } from "@/components/matches/MatchCard";
import { api } from "@/lib/api";
import { useLeagueData } from "@/hooks/useLeagueData";
import { useAuthStore } from "@/lib/store";

export default function MatchesPage() {
  const { leagueId } = useAuthStore();
  const { data: matches, loading, refresh } = useLeagueData(
    (id, token) => api.matches.byLeague(id, token),
    ["match:recorded", "standings:updated"]
  );
  const { data: players } = useLeagueData(
    (id, token) => api.players.byLeague(id, token),
    []
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-black">Matches</h1>
        <p className="text-muted-foreground">Record league results • Auto-updates standings & ELO</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {players && leagueId && (
          <RecordMatchForm
            leagueId={leagueId}
            players={players}
            onSuccess={refresh}
          />
        )}
        <div className="space-y-2">
          <h2 className="text-lg font-bold">Match History</h2>
          {loading ? (
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-neon-blue border-t-transparent" />
          ) : matches?.length ? (
            matches.map((m, i) => <MatchCard key={m.id} match={m} index={i} />)
          ) : (
            <p className="text-muted-foreground">No matches recorded</p>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { RecordMatchForm } from "@/components/matches/RecordMatchForm";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { useLeagueData } from "@/hooks/useLeagueData";
import { formatDate } from "@/lib/utils";

export default function FriendliesPage() {
  const { data: friendlies, loading, refresh } = useLeagueData(
    (id, token) => api.friendlies.byLeague(id, token),
    ["friendly:recorded"]
  );
  const { data: players } = useLeagueData(
    (id, token) => api.players.byLeague(id, token),
    []
  );
  const { data: leaderboard } = useLeagueData(
    (id, token) => api.friendlies.leaderboard(id, token),
    ["friendly:recorded"]
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-black">Friendly Matches</h1>
        <p className="text-muted-foreground">
          Casual games • Does not affect league standings • Optional ELO toggle
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {players && (
          <RecordMatchForm players={players} leagueId="" friendly onSuccess={refresh} />
        )}

        <Card>
          <CardHeader>
            <CardTitle>Friendly Leaderboard</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {leaderboard?.map((entry, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-white/5 p-3">
                <span className="font-semibold">
                  {(entry.player as { nickname?: string; name: string })?.nickname ||
                    (entry.player as { name: string })?.name}
                </span>
                <div className="flex gap-2 text-sm">
                  <Badge variant="success">{entry.wins}W</Badge>
                  <span className="text-muted-foreground">{entry.played} played</span>
                </div>
              </div>
            ))}
            {!leaderboard?.length && <p className="text-sm text-muted-foreground">No friendlies yet</p>}
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-bold">Recent Friendlies</h2>
        <div className="space-y-2">
          {loading ? null : friendlies?.map((m) => (
            <div key={m.id} className="glass-card flex items-center justify-between p-4">
              <span>
                {m.homePlayer?.nickname} <strong>{m.homeScore}-{m.awayScore}</strong> {m.awayPlayer?.nickname}
              </span>
              <div className="flex gap-2">
                {m.affectsElo && <Badge variant="warning">ELO</Badge>}
                <span className="text-xs text-muted-foreground">{formatDate(m.playedAt)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

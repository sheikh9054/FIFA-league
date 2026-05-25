"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api, type Player } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

interface RecordMatchFormProps {
  leagueId: string;
  players: Player[];
  onSuccess?: () => void;
  friendly?: boolean;
}

export function RecordMatchForm({ leagueId, players, onSuccess, friendly }: RecordMatchFormProps) {
  const { token } = useAuthStore();
  const [homeId, setHomeId] = useState("");
  const [awayId, setAwayId] = useState("");
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [notes, setNotes] = useState("");
  const [affectsElo, setAffectsElo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      setError("Please login first");
      return;
    }
    if (!homeId || !awayId || homeId === awayId) {
      setError("Select two different players");
      return;
    }

    setLoading(true);
    setError("");
    try {
      if (friendly) {
        await api.friendlies.record(
          { homePlayerId: homeId, awayPlayerId: awayId, homeScore, awayScore, affectsElo, notes },
          token
        );
      } else {
        await api.matches.record(
          { leagueId, homePlayerId: homeId, awayPlayerId: awayId, homeScore, awayScore, notes },
          token
        );
      }
      setHomeId("");
      setAwayId("");
      setHomeScore(0);
      setAwayScore(0);
      setNotes("");
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record match");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{friendly ? "Record Friendly" : "Record League Match"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">Home Player</label>
              <select
                className="input-field"
                value={homeId}
                onChange={(e) => setHomeId(e.target.value)}
                required
              >
                <option value="">Select player</option>
                {players.map((p) => (
                  <option key={p.id} value={p.id}>{p.nickname || p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">Away Player</label>
              <select
                className="input-field"
                value={awayId}
                onChange={(e) => setAwayId(e.target.value)}
                required
              >
                <option value="">Select player</option>
                {players.map((p) => (
                  <option key={p.id} value={p.id}>{p.nickname || p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4">
            <Input
              type="number"
              min={0}
              max={20}
              value={homeScore}
              onChange={(e) => setHomeScore(parseInt(e.target.value, 10) || 0)}
              className="w-20 text-center text-2xl font-black"
            />
            <span className="text-2xl font-bold text-muted-foreground">VS</span>
            <Input
              type="number"
              min={0}
              max={20}
              value={awayScore}
              onChange={(e) => setAwayScore(parseInt(e.target.value, 10) || 0)}
              className="w-20 text-center text-2xl font-black"
            />
          </div>

          <Input
            placeholder="Match notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          {friendly && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={affectsElo}
                onChange={(e) => setAffectsElo(e.target.checked)}
                className="rounded"
              />
              Affect ELO rating (optional)
            </label>
          )}

          {error && <p className="text-sm text-red-400">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Recording..." : "Record Match"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import type { EloHistoryPoint } from "@/lib/api";

export function EloChart({ data }: { data: EloHistoryPoint[] }) {
  const chartData = data.map((d, i) => ({
    name: `#${i + 1}`,
    elo: d.eloAfter,
    change: d.change,
  }));

  if (!chartData.length) {
    return (
      <div className="flex h-48 items-center justify-center text-muted-foreground text-sm">
        No ELO history yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
        <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
        <YAxis stroke="#64748b" fontSize={12} domain={["auto", "auto"]} />
        <Tooltip
          contentStyle={{
            background: "rgba(10, 22, 40, 0.9)",
            border: "1px solid rgba(0,212,255,0.3)",
            borderRadius: "8px",
          }}
        />
        <Line
          type="monotone"
          dataKey="elo"
          stroke="#00d4ff"
          strokeWidth={2}
          dot={{ fill: "#00d4ff", r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

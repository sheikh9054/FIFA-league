"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { Match } from "@/lib/api";

export function MatchCard({ match, index = 0 }: { match: Match; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link
        href={`/matches/${match.id}`}
        className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4 transition-all hover:border-neon-blue/30 hover:bg-white/10"
      >
        <div className="flex flex-1 items-center gap-3 min-w-0">
          <span className="truncate font-semibold text-right flex-1">
            {match.homePlayer?.nickname || match.homePlayer?.name}
          </span>
          <div className="flex shrink-0 items-center gap-2 rounded-lg bg-champions-navy px-4 py-2 font-black text-xl">
            <span className={match.homeScore > match.awayScore ? "text-neon-green" : ""}>{match.homeScore}</span>
            <span className="text-muted-foreground text-sm">-</span>
            <span className={match.awayScore > match.homeScore ? "text-neon-green" : ""}>{match.awayScore}</span>
          </div>
          <span className="truncate font-semibold flex-1">
            {match.awayPlayer?.nickname || match.awayPlayer?.name}
          </span>
        </div>
        <div className="ml-4 hidden flex-col items-end gap-1 sm:flex">
          <Badge variant="muted">{match.matchType}</Badge>
          <span className="text-xs text-muted-foreground">{formatDate(match.playedAt)}</span>
        </div>
      </Link>
    </motion.div>
  );
}

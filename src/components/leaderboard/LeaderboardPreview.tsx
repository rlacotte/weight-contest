"use client";

import { useEffect, useState } from "react";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import type { LeaderboardEntry } from "@/types/database";

const MEDALS = ["🥇", "🥈", "🥉"];

export function LeaderboardPreview({ contestId }: { contestId: string }) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/contests/${contestId}/leaderboard`)
      .then((res) => res.json())
      .then((data) => {
        setEntries(data.slice(0, 5));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [contestId]);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-10 bg-muted animate-pulse rounded" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return <p className="text-muted-foreground text-center py-4">No rankings yet</p>;
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <div
          key={entry.user_id}
          className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted/50"
        >
          <span className="w-8 text-center font-bold">
            {entry.rank <= 3 ? MEDALS[entry.rank - 1] : `#${entry.rank}`}
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
            {entry.profile?.full_name?.charAt(0)?.toUpperCase() ?? "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {entry.profile?.full_name ?? "Anonymous"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold">{entry.metric_label}</span>
            {entry.momentum === "down" ? (
              <TrendingDown className="h-4 w-4 text-green-500" />
            ) : entry.momentum === "up" ? (
              <TrendingUp className="h-4 w-4 text-red-500" />
            ) : (
              <Minus className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

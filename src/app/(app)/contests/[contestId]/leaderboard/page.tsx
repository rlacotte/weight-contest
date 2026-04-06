"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingDown, TrendingUp, Minus, Flame } from "lucide-react";
import { format } from "date-fns";
import type { LeaderboardEntry } from "@/types/database";

const MEDALS = ["🥇", "🥈", "🥉"];

function IndexBadge({ value }: { value: number }) {
  const diff = value - 100;
  const color =
    diff < -3
      ? "bg-green-100 text-green-800"
      : diff < 0
      ? "bg-green-50 text-green-700"
      : diff === 0
      ? "bg-gray-100 text-gray-700"
      : "bg-red-100 text-red-800";

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-bold ${color}`}>
      {value.toFixed(1)}
    </span>
  );
}

export default function LeaderboardPage() {
  const params = useParams();
  const contestId = params.contestId as string;
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 30000);
    return () => clearInterval(interval);
  }, [contestId]);

  async function fetchLeaderboard() {
    const res = await fetch(`/api/contests/${contestId}/leaderboard`);
    const data = await res.json();
    setEntries(data);
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Weight index: everyone starts at 100. Lower = more weight lost.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Rank</TableHead>
                <TableHead>Participant</TableHead>
                <TableHead>Index</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Streak</TableHead>
                <TableHead>Last Weigh-In</TableHead>
                <TableHead className="w-16">Trend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7}>
                      <div className="h-8 bg-muted animate-pulse rounded" />
                    </TableCell>
                  </TableRow>
                ))
              ) : entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No rankings yet.
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => (
                  <TableRow key={entry.user_id}>
                    <TableCell className="font-bold text-center">
                      {entry.rank <= 3 ? (
                        <span className="text-xl">{MEDALS[entry.rank - 1]}</span>
                      ) : (
                        `#${entry.rank}`
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                          {entry.profile?.full_name?.charAt(0)?.toUpperCase() ?? "?"}
                        </div>
                        <span className="font-medium">
                          {entry.profile?.full_name ?? "Anonymous"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <IndexBadge value={entry.index_value} />
                    </TableCell>
                    <TableCell>
                      <span className="font-bold text-green-600">{entry.metric_label}</span>
                    </TableCell>
                    <TableCell>
                      {entry.streak > 0 && (
                        <div className="flex items-center gap-1">
                          <Flame className="h-4 w-4 text-orange-500" />
                          <span>{entry.streak}d</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {entry.last_weigh_in
                        ? format(new Date(entry.last_weigh_in), "MMM dd")
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {entry.momentum === "down" ? (
                        <TrendingDown className="h-5 w-5 text-green-500" />
                      ) : entry.momentum === "up" ? (
                        <TrendingUp className="h-5 w-5 text-red-500" />
                      ) : (
                        <Minus className="h-5 w-5 text-muted-foreground" />
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

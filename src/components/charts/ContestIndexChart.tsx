"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface MemberSeries {
  name: string;
  color: string;
  data: { date: string; index: number }[];
}

const COLORS = [
  "hsl(221, 83%, 53%)", // blue
  "hsl(0, 84%, 60%)",   // red
  "hsl(142, 76%, 36%)", // green
  "hsl(280, 67%, 50%)", // purple
  "hsl(35, 92%, 50%)",  // orange
  "hsl(190, 90%, 40%)", // cyan
  "hsl(340, 75%, 55%)", // pink
  "hsl(60, 70%, 45%)",  // yellow
];

export function ContestIndexChart({ contestId }: { contestId: string }) {
  const [series, setSeries] = useState<MemberSeries[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/contests/${contestId}/chart`)
      .then((r) => r.json())
      .then((data) => {
        setSeries(data.series ?? []);
        setChartData(data.chartData ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [contestId]);

  if (loading) {
    return (
      <Card>
        <CardHeader><CardTitle>Progress</CardTitle></CardHeader>
        <CardContent className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (series.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle>Progress</CardTitle></CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Not enough data yet. Members need to log weigh-ins.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Progress (Index 100 = Start)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis
              domain={["auto", "auto"]}
              tick={{ fontSize: 11 }}
              label={{ value: "Index", angle: -90, position: "insideLeft", style: { fontSize: 11 } }}
            />
            <Tooltip
              formatter={(value, name) => [Number(value).toFixed(1), String(name)]}
              labelFormatter={(label) => String(label)}
            />
            <ReferenceLine
              y={100}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="5 5"
              label={{ value: "Start", position: "right", style: { fontSize: 10 } }}
            />
            <Legend />
            {series.map((s, i) => (
              <Line
                key={s.name}
                type="monotone"
                dataKey={s.name}
                stroke={s.color}
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, startOfWeek, endOfWeek } from "date-fns";
import type { WeighIn } from "@/types/database";

interface Props {
  weighIns: WeighIn[];
  units: "kg" | "lbs";
}

export function RateOfChange({ weighIns, units }: Props) {
  const conversionFactor = units === "lbs" ? 2.20462 : 1;

  // Group weigh-ins by week
  const weeklyData = new Map<string, { weights: number[] }>();

  weighIns.forEach((w) => {
    const weekStart = startOfWeek(new Date(w.weighed_at), { weekStartsOn: 1 });
    const key = weekStart.toISOString();
    if (!weeklyData.has(key)) {
      weeklyData.set(key, { weights: [] });
    }
    weeklyData.get(key)!.weights.push(w.weight * conversionFactor);
  });

  const sortedWeeks = Array.from(weeklyData.entries())
    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
    .slice(-12);

  const chartData = sortedWeeks.map(([weekStr, data], i) => {
    const avgWeight = data.weights.reduce((s, w) => s + w, 0) / data.weights.length;
    const prevWeek = i > 0 ? sortedWeeks[i - 1] : null;
    const prevAvg = prevWeek
      ? prevWeek[1].weights.reduce((s, w) => s + w, 0) / prevWeek[1].weights.length
      : avgWeight;

    return {
      week: format(new Date(weekStr), "MMM dd"),
      change: Math.round((avgWeight - prevAvg) * 10) / 10,
    };
  });

  if (chartData.length < 2) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Change ({units})</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="week" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(value) => [`${value} ${units}`, "Change"]} />
            <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
            <Bar dataKey="change" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={
                    entry.change <= 0
                      ? "hsl(142, 76%, 36%)"
                      : "hsl(0, 84%, 60%)"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

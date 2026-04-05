"use client";

import { useState } from "react";
import {
  ComposedChart,
  Scatter,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, subDays, subMonths, subYears } from "date-fns";
import type { WeighIn } from "@/types/database";

const TIME_RANGES = [
  { label: "1W", days: 7 },
  { label: "1M", days: 30 },
  { label: "3M", days: 90 },
  { label: "6M", days: 180 },
  { label: "1Y", days: 365 },
  { label: "All", days: 0 },
] as const;

interface Props {
  weighIns: WeighIn[];
  goalWeight?: number | null;
  units: "kg" | "lbs";
}

export function WeightOverTime({ weighIns, goalWeight, units }: Props) {
  const [range, setRange] = useState(90);

  const conversionFactor = units === "lbs" ? 2.20462 : 1;

  const filteredData = weighIns
    .filter((w) => {
      if (range === 0) return true;
      const cutoff = subDays(new Date(), range);
      return new Date(w.weighed_at) >= cutoff;
    })
    .sort((a, b) => new Date(a.weighed_at).getTime() - new Date(b.weighed_at).getTime())
    .map((w) => ({
      date: format(new Date(w.weighed_at), "MMM dd"),
      timestamp: new Date(w.weighed_at).getTime(),
      weight: Math.round(w.weight * conversionFactor * 10) / 10,
      smoothed: w.smoothed_weight
        ? Math.round(w.smoothed_weight * conversionFactor * 10) / 10
        : null,
    }));

  const goalLine = goalWeight ? Math.round(goalWeight * conversionFactor * 10) / 10 : null;

  if (filteredData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weight Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No weigh-ins yet. Log your first weigh-in to see your chart.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Weight Over Time</CardTitle>
        <div className="flex gap-1">
          {TIME_RANGES.map((r) => (
            <Button
              key={r.label}
              variant={range === r.days ? "default" : "ghost"}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setRange(r.days)}
            >
              {r.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={filteredData}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis
              domain={["auto", "auto"]}
              tick={{ fontSize: 12 }}
              tickFormatter={(v) => `${v}`}
              label={{
                value: units,
                angle: -90,
                position: "insideLeft",
                style: { fontSize: 12 },
              }}
            />
            <Tooltip
              formatter={(value) => [`${value} ${units}`, ""]}
              labelFormatter={(label) => String(label)}
            />
            <Scatter
              dataKey="weight"
              fill="hsl(var(--primary))"
              opacity={0.5}
              r={3}
              name="Actual"
            />
            <Line
              dataKey="smoothed"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={false}
              name="Trend"
              connectNulls
            />
            {goalLine && (
              <ReferenceLine
                y={goalLine}
                stroke="hsl(var(--chart-1))"
                strokeDasharray="5 5"
                label={{
                  value: `Goal: ${goalLine} ${units}`,
                  position: "right",
                  style: { fontSize: 11 },
                }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

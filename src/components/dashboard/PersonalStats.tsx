"use client";

import { Card, CardContent } from "@/components/ui/card";
import { TrendingDown, TrendingUp, Target, Activity, Flame, Scale } from "lucide-react";
import { formatWeight, calculateBMI, getBMICategory, fromKg, estimateCompletionDate } from "@/lib/utils/weight";
import { format } from "date-fns";
import type { Profile, WeighIn } from "@/types/database";

interface Props {
  profile: Profile;
  latestWeighIn: WeighIn | null;
  weekAgoWeighIn: WeighIn | null;
}

export function PersonalStats({ profile, latestWeighIn, weekAgoWeighIn }: Props) {
  const currentWeight = latestWeighIn?.weight ?? profile.starting_weight ?? 0;
  const units = profile.units_weight;
  const displayWeight = fromKg(currentWeight, units);

  const totalLost = (profile.starting_weight ?? 0) - currentWeight;
  const totalLostPct =
    profile.starting_weight && profile.starting_weight > 0
      ? (totalLost / profile.starting_weight) * 100
      : 0;

  const bmi =
    currentWeight > 0 && profile.height_cm
      ? calculateBMI(currentWeight, profile.height_cm)
      : null;
  const bmiInfo = bmi ? getBMICategory(bmi) : null;

  // Weekly rate of change
  const weekAgoWeight = weekAgoWeighIn?.weight ?? currentWeight;
  const weeklyChange = currentWeight - weekAgoWeight;

  const completionDate = estimateCompletionDate(
    currentWeight,
    profile.goal_weight ?? 0,
    Math.abs(weeklyChange) || 0.3
  );

  const stats = [
    {
      label: "Current Weight",
      value: `${displayWeight.toFixed(1)} ${units}`,
      change: weeklyChange !== 0 ? `${weeklyChange > 0 ? "+" : ""}${fromKg(weeklyChange, units).toFixed(1)} this week` : null,
      changeColor: weeklyChange <= 0 ? "text-green-500" : "text-red-500",
      icon: Scale,
    },
    {
      label: "Total Lost",
      value: `${fromKg(Math.abs(totalLost), units).toFixed(1)} ${units}`,
      change: `${totalLostPct.toFixed(1)}%`,
      changeColor: totalLost >= 0 ? "text-green-500" : "text-red-500",
      icon: totalLost >= 0 ? TrendingDown : TrendingUp,
    },
    {
      label: "BMI",
      value: bmi ? bmi.toFixed(1) : "N/A",
      change: bmiInfo?.label ?? null,
      changeColor: bmiInfo?.color ?? "text-muted-foreground",
      icon: Activity,
    },
    {
      label: "Est. Goal Date",
      value: completionDate ? format(completionDate, "MMM dd, yyyy") : "N/A",
      change: profile.goal_weight
        ? `Goal: ${fromKg(profile.goal_weight, units).toFixed(1)} ${units}`
        : null,
      changeColor: "text-muted-foreground",
      icon: Target,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-1 text-2xl font-bold">{stat.value}</p>
            {stat.change && (
              <p className={`mt-1 text-xs ${stat.changeColor}`}>{stat.change}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function StreakCounter({
  current,
  longest,
}: {
  current: number;
  longest: number;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
          <Flame className="h-6 w-6 text-orange-500" />
        </div>
        <div>
          <p className="text-2xl font-bold">{current} days</p>
          <p className="text-sm text-muted-foreground">
            Current streak {longest > current && `(best: ${longest})`}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function GoalProgress({
  startWeight,
  currentWeight,
  goalWeight,
  units,
}: {
  startWeight: number;
  currentWeight: number;
  goalWeight: number;
  units: "kg" | "lbs";
}) {
  const totalToLose = startWeight - goalWeight;
  const totalLost = startWeight - currentWeight;
  const progress = totalToLose > 0 ? Math.min(100, Math.max(0, (totalLost / totalToLose) * 100)) : 0;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-muted-foreground">Goal Progress</span>
          <span className="font-medium">{progress.toFixed(0)}%</span>
        </div>
        <div className="h-3 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>Start: {fromKg(startWeight, units).toFixed(1)}</span>
          <span>Goal: {fromKg(goalWeight, units).toFixed(1)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PersonalStats, StreakCounter, GoalProgress } from "@/components/dashboard/PersonalStats";
import { WeightOverTime } from "@/components/charts/WeightOverTime";
import { RateOfChange } from "@/components/charts/RateOfChange";
import { subDays } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Scale } from "lucide-react";

function toNum(v: any): number {
  return v ? Number(v) : 0;
}

function serializeWeighIn(w: any) {
  return {
    ...w,
    weight: Number(w.weight),
    body_fat_pct: w.body_fat_pct ? Number(w.body_fat_pct) : null,
    smoothed_weight: w.smoothed_weight ? Number(w.smoothed_weight) : null,
    weight_change: w.weight_change ? Number(w.weight_change) : null,
    total_change: w.total_change ? Number(w.total_change) : null,
    total_change_pct: w.total_change_pct ? Number(w.total_change_pct) : null,
    muscle_mass: w.muscle_mass ? Number(w.muscle_mass) : null,
    water_pct: w.water_pct ? Number(w.water_pct) : null,
    waist_cm: w.waist_cm ? Number(w.waist_cm) : null,
    hip_cm: w.hip_cm ? Number(w.hip_cm) : null,
    chest_cm: w.chest_cm ? Number(w.chest_cm) : null,
    weighed_at: w.weighed_at.toISOString(),
    created_at: w.created_at.toISOString(),
  };
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const [profile, weighIns, weekAgoWeighIn] = await Promise.all([
    prisma.profiles.findUnique({ where: { user_id: session.user.id } }),
    prisma.weigh_ins.findMany({
      where: { user_id: session.user.id },
      orderBy: { weighed_at: "desc" },
      take: 365,
    }),
    prisma.weigh_ins.findFirst({
      where: {
        user_id: session.user.id,
        weighed_at: { lte: subDays(new Date(), 6) },
      },
      orderBy: { weighed_at: "desc" },
    }),
  ]);

  if (!profile || !profile.onboarding_completed) redirect("/auth/onboarding");

  const serializedWeighIns = weighIns.map(serializeWeighIn);
  const latestWeighIn = serializedWeighIns[0] ?? null;
  const serializedWeekAgo = weekAgoWeighIn ? serializeWeighIn(weekAgoWeighIn) : null;

  const profileData = {
    ...profile,
    height_cm: toNum(profile.height_cm),
    starting_weight: toNum(profile.starting_weight),
    goal_weight: toNum(profile.goal_weight),
    streak_last_weigh_in: profile.streak_last_weigh_in?.toISOString().split("T")[0] ?? null,
    created_at: profile.created_at.toISOString(),
    updated_at: profile.updated_at.toISOString(),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome back, {profile.full_name?.split(" ")[0] ?? "there"}
          </h1>
          <p className="text-muted-foreground">Here&apos;s your progress overview</p>
        </div>
        <Link href="/weigh-in">
          <Button>
            <Scale className="mr-2 h-4 w-4" />
            Log Weigh-In
          </Button>
        </Link>
      </div>

      <PersonalStats
        profile={profileData as any}
        latestWeighIn={latestWeighIn}
        weekAgoWeighIn={serializedWeekAgo}
      />

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <WeightOverTime
            weighIns={serializedWeighIns}
            goalWeight={toNum(profile.goal_weight)}
            units={profile.units_weight as "kg" | "lbs"}
          />
        </div>
        <div className="space-y-4">
          <StreakCounter current={profile.streak_current} longest={profile.streak_longest} />
          {profile.starting_weight && profile.goal_weight && (
            <GoalProgress
              startWeight={toNum(profile.starting_weight)}
              currentWeight={latestWeighIn?.weight ?? toNum(profile.starting_weight)}
              goalWeight={toNum(profile.goal_weight)}
              units={profile.units_weight as "kg" | "lbs"}
            />
          )}
        </div>
      </div>

      <RateOfChange weighIns={serializedWeighIns} units={profile.units_weight as "kg" | "lbs"} />
    </div>
  );
}

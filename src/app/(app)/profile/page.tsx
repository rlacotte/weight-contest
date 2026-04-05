import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatWeight, formatHeight, calculateBMI, getBMICategory, fromKg } from "@/lib/utils/weight";
import { calculateLevel } from "@/lib/constants";
import { format } from "date-fns";
import { Scale, Flame, Award, Target } from "lucide-react";
import type { WeightUnit, HeightUnit } from "@/types/database";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const [profile, weighInCount, contestCount, achievementCount, latestWeighIn] = await Promise.all([
    prisma.profiles.findUnique({ where: { user_id: session.user.id } }),
    prisma.weigh_ins.count({ where: { user_id: session.user.id } }),
    prisma.contest_members.count({ where: { user_id: session.user.id, status: "approved" } }),
    prisma.user_achievements.count({ where: { user_id: session.user.id } }),
    prisma.weigh_ins.findFirst({ where: { user_id: session.user.id }, orderBy: { weighed_at: "desc" }, select: { weight: true } }),
  ]);

  if (!profile) redirect("/auth/onboarding");

  const units = profile.units_weight as WeightUnit;
  const heightUnits = profile.units_height as HeightUnit;
  const levelInfo = calculateLevel(profile.xp_total);
  const currentWeight = latestWeighIn ? Number(latestWeighIn.weight) : Number(profile.starting_weight ?? 0);
  const bmi = profile.height_cm ? calculateBMI(currentWeight, Number(profile.height_cm)) : null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground text-3xl font-bold mb-4">{profile.full_name?.charAt(0)?.toUpperCase() ?? "?"}</div>
        <h1 className="text-2xl font-bold">{profile.full_name}</h1>
        <div className="flex items-center justify-center gap-2 mt-2"><Badge>Level {levelInfo.level}</Badge><Badge variant="outline">{profile.xp_total} XP</Badge></div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center"><Scale className="h-5 w-5 mx-auto text-muted-foreground mb-1" /><p className="font-bold">{weighInCount}</p><p className="text-xs text-muted-foreground">Weigh-ins</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><Flame className="h-5 w-5 mx-auto text-orange-500 mb-1" /><p className="font-bold">{profile.streak_longest}</p><p className="text-xs text-muted-foreground">Best Streak</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><Award className="h-5 w-5 mx-auto text-muted-foreground mb-1" /><p className="font-bold">{achievementCount}</p><p className="text-xs text-muted-foreground">Badges</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><Target className="h-5 w-5 mx-auto text-muted-foreground mb-1" /><p className="font-bold">{contestCount}</p><p className="text-xs text-muted-foreground">Contests</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Body Stats</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {profile.height_cm && <div className="flex justify-between"><span className="text-muted-foreground">Height</span><span className="font-medium">{formatHeight(Number(profile.height_cm), heightUnits)}</span></div>}
          <div className="flex justify-between"><span className="text-muted-foreground">Current Weight</span><span className="font-medium">{fromKg(currentWeight, units).toFixed(1)} {units}</span></div>
          {profile.starting_weight && <div className="flex justify-between"><span className="text-muted-foreground">Starting Weight</span><span className="font-medium">{fromKg(Number(profile.starting_weight), units).toFixed(1)} {units}</span></div>}
          {profile.goal_weight && <div className="flex justify-between"><span className="text-muted-foreground">Goal Weight</span><span className="font-medium">{fromKg(Number(profile.goal_weight), units).toFixed(1)} {units}</span></div>}
          {bmi && <div className="flex justify-between"><span className="text-muted-foreground">BMI</span><span className={`font-medium ${getBMICategory(bmi).color}`}>{bmi.toFixed(1)} ({getBMICategory(bmi).label})</span></div>}
          <div className="flex justify-between"><span className="text-muted-foreground">Member Since</span><span className="font-medium">{format(profile.created_at, "MMMM yyyy")}</span></div>
        </CardContent>
      </Card>
    </div>
  );
}

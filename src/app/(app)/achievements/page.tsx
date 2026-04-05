import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { calculateLevel } from "@/lib/constants";

const rarityColors: Record<string, string> = { common: "bg-gray-100 text-gray-800", uncommon: "bg-green-100 text-green-800", rare: "bg-blue-100 text-blue-800", epic: "bg-purple-100 text-purple-800", legendary: "bg-amber-100 text-amber-800" };
const categoryLabels: Record<string, string> = { weigh_in: "Weigh-ins", streak: "Streaks", progress: "Progress", social: "Social", contest: "Contests", special: "Special" };

export default async function AchievementsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const [profile, achievements, userAchievements] = await Promise.all([
    prisma.profiles.findUnique({ where: { user_id: session.user.id }, select: { xp_total: true, level: true } }),
    prisma.achievements.findMany({ orderBy: { sort_order: "asc" } }),
    prisma.user_achievements.findMany({ where: { user_id: session.user.id }, select: { achievement_id: true } }),
  ]);

  const earnedIds = new Set(userAchievements.map((ua) => ua.achievement_id));
  const levelInfo = calculateLevel(profile?.xp_total ?? 0);

  const grouped: Record<string, typeof achievements> = {};
  for (const a of achievements) {
    if (!grouped[a.category]) grouped[a.category] = [];
    grouped[a.category].push(a);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Achievements</h1>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div><p className="text-3xl font-bold">Level {levelInfo.level}</p><p className="text-muted-foreground">{profile?.xp_total ?? 0} XP total</p></div>
            <p className="text-sm text-muted-foreground">{earnedIds.size} / {achievements.length} badges</p>
          </div>
          <Progress value={levelInfo.progress} />
        </CardContent>
      </Card>

      {Object.entries(grouped).map(([category, items]) => (
        <div key={category}>
          <h2 className="text-lg font-semibold mb-3">{categoryLabels[category] ?? category}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {items.map((a) => {
              const earned = earnedIds.has(a.id);
              return (
                <Card key={a.id} className={earned ? "" : "opacity-40 grayscale"}>
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl mb-2">{a.icon}</div>
                    <p className="font-medium text-sm">{a.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{a.description}</p>
                    <div className="mt-2 flex items-center justify-center gap-2">
                      <Badge className={`text-xs ${rarityColors[a.rarity] ?? ""}`}>{a.rarity}</Badge>
                      <span className="text-xs text-muted-foreground">+{a.xp_reward} XP</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

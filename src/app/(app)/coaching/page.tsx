import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Brain, AlertTriangle, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default async function CoachingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const [profile, reports, weighIns] = await Promise.all([
    prisma.profiles.findUnique({ where: { user_id: session.user.id } }),
    prisma.weekly_reports.findMany({ where: { user_id: session.user.id }, orderBy: { report_week: "desc" }, take: 4 }),
    prisma.weigh_ins.findMany({ where: { user_id: session.user.id }, orderBy: { weighed_at: "desc" }, take: 30, select: { weight: true, weighed_at: true } }),
  ]);

  if (!profile) redirect("/auth/onboarding");

  const latestWeight = weighIns[0] ? Number(weighIns[0].weight) : Number(profile.starting_weight ?? 0);
  const startWeight = Number(profile.starting_weight ?? 0);
  const goalWeight = Number(profile.goal_weight ?? 0);
  const totalLossPct = startWeight > 0 ? ((startWeight - latestWeight) / startWeight) * 100 : 0;
  const progressToGoal = startWeight > goalWeight ? ((startWeight - latestWeight) / (startWeight - goalWeight)) * 100 : 0;

  const latestReport = reports[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3"><Brain className="h-7 w-7 text-primary" /><h1 className="text-2xl font-bold">AI Coach</h1></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{totalLossPct.toFixed(1)}%</p><p className="text-xs text-muted-foreground">Total Lost</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{progressToGoal.toFixed(0)}%</p><p className="text-xs text-muted-foreground">To Goal</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{profile.streak_current}</p><p className="text-xs text-muted-foreground">Day Streak</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">Level {profile.level}</p><p className="text-xs text-muted-foreground">{profile.xp_total} XP</p></CardContent></Card>
      </div>

      {latestReport?.ai_insights ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /><CardTitle>Weekly Insights</CardTitle></div>
            <CardDescription>Week of {format(latestReport.report_week, "MMM dd, yyyy")}</CardDescription>
          </CardHeader>
          <CardContent><div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">{latestReport.ai_insights}</div></CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Brain className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">AI insights coming soon</h3>
            <p className="text-muted-foreground text-center">Keep logging your weigh-ins. Your first weekly AI coaching report will be generated after your first full week of data.</p>
          </CardContent>
        </Card>
      )}

      {latestReport?.ai_motivation && (
        <Card><CardHeader><CardTitle className="text-lg">Motivation</CardTitle></CardHeader><CardContent><p className="text-lg italic">&ldquo;{latestReport.ai_motivation}&rdquo;</p></CardContent></Card>
      )}
    </div>
  );
}

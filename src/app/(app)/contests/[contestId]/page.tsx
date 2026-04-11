import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Scale, Settings, Copy, Users, Calendar, Trophy, Flame } from "lucide-react";
import { format, differenceInDays, differenceInCalendarDays } from "date-fns";
import { LeaderboardPreview } from "@/components/leaderboard/LeaderboardPreview";
import { ContestIndexChart } from "@/components/charts/ContestIndexChart";
import { getNormalizedStatus } from "@/lib/utils/contest";
import { CopyInviteButton } from "@/components/contests/CopyInviteButton";

export default async function ContestDashboardPage({
  params,
}: {
  params: Promise<{ contestId: string }>;
}) {
  const { contestId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const contest = await prisma.contests.findUnique({ where: { id: contestId } });
  if (!contest) notFound();

  const [membership, memberCount, recentActivity, userWeighIns] = await Promise.all([
    prisma.contest_members.findUnique({
      where: { contest_id_user_id: { contest_id: contestId, user_id: session.user.id } },
    }),
    prisma.contest_members.count({ where: { contest_id: contestId, status: "approved" } }),
    prisma.activity_feed.findMany({
      where: { contest_id: contestId },
      orderBy: { created_at: "desc" },
      take: 8,
      include: { users: { include: { profiles: { select: { full_name: true } } } } },
    }),
    prisma.weigh_ins.findMany({
      where: {
        user_id: session.user.id,
        weighed_at: { gte: contest.start_date, lte: contest.end_date },
      },
      orderBy: { weighed_at: "desc" },
      take: 1,
    }),
  ]);

  const status = getNormalizedStatus(contest, prisma as any);
  const daysLeft = differenceInDays(contest.end_date, new Date());
  const totalDays = differenceInCalendarDays(contest.end_date, contest.start_date);
  const daysPassed = differenceInCalendarDays(new Date(), contest.start_date);
  const progressPct = totalDays > 0 ? Math.min(100, Math.max(0, (daysPassed / totalDays) * 100)) : 0;
  const isAdmin = membership?.role === "admin";

  // User's index
  const startWeight = membership?.starting_weight ? Number(membership.starting_weight) : null;
  const currentWeight = userWeighIns[0] ? Number(userWeighIns[0].weight) : startWeight;
  const userIndex = startWeight && currentWeight && startWeight > 0
    ? Math.round((currentWeight / startWeight) * 1000) / 10
    : null;

  const statusConfig: Record<string, { emoji: string; color: string; bg: string }> = {
    active: { emoji: "🟢", color: "text-green-700", bg: "bg-green-100" },
    upcoming: { emoji: "🔜", color: "text-blue-700", bg: "bg-blue-100" },
    completed: { emoji: "🏁", color: "text-purple-700", bg: "bg-purple-100" },
    cancelled: { emoji: "❌", color: "text-red-700", bg: "bg-red-100" },
    draft: { emoji: "📝", color: "text-gray-700", bg: "bg-gray-100" },
  };
  const sc = statusConfig[status] ?? statusConfig.draft;

  const activityEmojis: Record<string, string> = {
    weigh_in: "⚖️",
    joined_contest: "👋",
    achievement: "🏆",
    goal_reached: "🎉",
    streak: "🔥",
  };

  return (
    <div className="space-y-6">
      {/* Hero header */}
      <div className="rounded-2xl bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 p-6 text-white relative overflow-hidden">
        <div className="absolute top-2 right-4 text-5xl opacity-20">🏆</div>
        <div className="flex items-start justify-between relative">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge className={`${sc.bg} ${sc.color} border-0`}>
                {sc.emoji} {status}
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-heading">{contest.name}</h1>
            {contest.description && (
              <p className="text-white/80 mt-1 text-sm max-w-lg">{contest.description}</p>
            )}
            <div className="flex items-center gap-4 mt-3 text-sm text-white/70">
              <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {memberCount}</span>
              <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {format(contest.start_date, "MMM dd")} - {format(contest.end_date, "MMM dd")}</span>
              <span className="flex items-center gap-1"><Trophy className="h-4 w-4" /> {contest.contest_type.replace(/_/g, " ")}</span>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Link href="/weigh-in">
              <Button className="bg-white/20 hover:bg-white/30 border-0 text-white backdrop-blur-sm">
                <Scale className="mr-2 h-4 w-4" />
                Weigh In
              </Button>
            </Link>
            {isAdmin && (
              <Link href={`/contests/${contestId}/settings`}>
                <Button variant="ghost" size="icon" className="text-white/70 hover:text-white hover:bg-white/20">
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-white/60 mb-1">
            <span>Day {Math.max(0, daysPassed)} / {totalDays}</span>
            <span>{Math.max(0, daysLeft)} days left</span>
          </div>
          <div className="h-2 rounded-full bg-white/20 overflow-hidden">
            <div className="h-full rounded-full bg-white/80 transition-all" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-3xl mb-1">👥</p>
            <p className="text-2xl font-bold">{memberCount}</p>
            <p className="text-xs text-muted-foreground">Participants</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-3xl mb-1">{userIndex !== null && userIndex < 100 ? "📉" : userIndex !== null && userIndex > 100 ? "📈" : "⚖️"}</p>
            <p className="text-2xl font-bold">{userIndex?.toFixed(1) ?? "—"}</p>
            <p className="text-xs text-muted-foreground">Your Index</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-3xl mb-1">⏱️</p>
            <p className="text-2xl font-bold">{Math.max(0, daysLeft)}</p>
            <p className="text-xs text-muted-foreground">Days Left</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-3xl mb-1">💰</p>
            <p className="text-2xl font-bold">
              {contest.entry_fee_cents > 0
                ? `$${((contest.entry_fee_cents * memberCount) / 100).toFixed(0)}`
                : "Free"}
            </p>
            <p className="text-xs text-muted-foreground">{contest.entry_fee_cents > 0 ? "Prize Pool" : "Entry"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Invite code */}
      <Card className="border-dashed border-2 border-purple-200 bg-purple-50/50">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Invite Code</p>
            <p className="font-mono text-xl font-bold text-purple-600 tracking-widest mt-0.5">{contest.invite_code}</p>
          </div>
          <CopyInviteButton code={contest.invite_code} />
        </CardContent>
      </Card>

      {/* Chart */}
      <ContestIndexChart contestId={contestId} />

      {/* Leaderboard + Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 font-heading">
              <span>🏅</span> Leaderboard
            </CardTitle>
            <Link href={`/contests/${contestId}/leaderboard`}>
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <LeaderboardPreview contestId={contestId} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 font-heading">
              <span>📢</span> Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((activity) => {
                  const emoji = activityEmojis[activity.activity_type] ?? "📌";
                  const indexVal = (activity.data as any)?.index_value;
                  return (
                    <div key={activity.id} className="flex items-start gap-3 text-sm">
                      <span className="text-lg mt-0.5">{emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p>
                          <strong>{activity.users?.profiles?.full_name ?? "Someone"}</strong>{" "}
                          {activity.activity_type === "weigh_in" && (
                            <>
                              weighed in
                              {indexVal != null && (
                                <span className={`ml-1 font-mono font-bold ${indexVal < 100 ? "text-green-600" : indexVal > 100 ? "text-red-500" : ""}`}>
                                  {Number(indexVal).toFixed(1)}
                                </span>
                              )}
                            </>
                          )}
                          {activity.activity_type === "joined_contest" && "joined the contest"}
                          {activity.activity_type === "achievement" && "earned a badge"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(activity.created_at, "MMM dd 'at' h:mm a")}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-3xl mb-2">🦗</p>
                <p className="text-muted-foreground">No activity yet. Be the first!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

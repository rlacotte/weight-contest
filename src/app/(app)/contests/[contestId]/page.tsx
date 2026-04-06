import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Scale, Settings } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { LeaderboardPreview } from "@/components/leaderboard/LeaderboardPreview";

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

  const [membership, memberCount, recentActivity] = await Promise.all([
    prisma.contest_members.findUnique({
      where: { contest_id_user_id: { contest_id: contestId, user_id: session.user.id } },
    }),
    prisma.contest_members.count({ where: { contest_id: contestId, status: "approved" } }),
    prisma.activity_feed.findMany({
      where: { contest_id: contestId },
      orderBy: { created_at: "desc" },
      take: 5,
      include: { users: { include: { profiles: { select: { full_name: true } } } } },
    }),
  ]);

  const daysLeft = differenceInDays(contest.end_date, new Date());
  const isAdmin = membership?.role === "admin";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{contest.name}</h1>
            <Badge className={contest.status === "active" ? "bg-green-100 text-green-800" : contest.status === "upcoming" ? "bg-blue-100 text-blue-800" : ""}>{contest.status}</Badge>
          </div>
          {contest.description && <p className="text-muted-foreground mt-1">{contest.description}</p>}
        </div>
        <div className="flex gap-2">
          <Link href="/weigh-in"><Button><Scale className="mr-2 h-4 w-4" />Log Weigh-In</Button></Link>
          {isAdmin && <Link href={`/contests/${contestId}/settings`}><Button variant="outline" size="icon"><Settings className="h-4 w-4" /></Button></Link>}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{memberCount}</p><p className="text-xs text-muted-foreground">Members</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{Math.max(0, daysLeft)}</p><p className="text-xs text-muted-foreground">Days Left</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold capitalize">{contest.contest_type.replace(/_/g, " ")}</p><p className="text-xs text-muted-foreground">Type</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{contest.entry_fee_cents > 0 ? `$${((contest.entry_fee_cents * memberCount) / 100).toFixed(0)}` : "Free"}</p><p className="text-xs text-muted-foreground">{contest.entry_fee_cents > 0 ? "Prize Pool" : "Entry"}</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div><p className="text-sm text-muted-foreground">Invite Code</p><p className="font-mono text-lg font-bold">{contest.invite_code}</p></div>
          <p className="text-sm text-muted-foreground">Share this code with friends</p>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Leaderboard</CardTitle>
            <Link href={`/contests/${contestId}/leaderboard`}><Button variant="ghost" size="sm">View All</Button></Link>
          </CardHeader>
          <CardContent><LeaderboardPreview contestId={contestId} /></CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 text-sm">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
                      {activity.users?.profiles?.full_name?.charAt(0)?.toUpperCase() ?? "?"}
                    </div>
                    <div>
                      <p>
                        <strong>{activity.users?.profiles?.full_name ?? "Someone"}</strong>{" "}
                        {activity.activity_type === "weigh_in" &&
                          `weighed in at index ${(activity.data as any)?.index_value?.toFixed?.(1) ?? "—"}`}
                        {activity.activity_type === "joined_contest" && "joined the contest"}
                        {activity.activity_type === "achievement" && `earned a badge`}
                      </p>
                      <p className="text-xs text-muted-foreground">{format(activity.created_at, "MMM dd 'at' h:mm a")}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-muted-foreground text-center py-4">No activity yet</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { getNormalizedStatus } from "@/lib/utils/contest";

export default async function ContestSettingsPage({ params }: { params: Promise<{ contestId: string }> }) {
  const { contestId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const contest = await prisma.contests.findUnique({ where: { id: contestId } });
  if (!contest) notFound();

  const membership = await prisma.contest_members.findUnique({
    where: { contest_id_user_id: { contest_id: contestId, user_id: session.user.id } },
  });
  if (membership?.role !== "admin") redirect(`/contests/${contestId}`);

  const [pendingMembers, allMembers] = await Promise.all([
    prisma.contest_members.findMany({ where: { contest_id: contestId, status: "pending" }, include: { users: { include: { profiles: { select: { full_name: true } } } } } }),
    prisma.contest_members.findMany({ where: { contest_id: contestId }, include: { users: { include: { profiles: { select: { full_name: true } } } } }, orderBy: { joined_at: "asc" } }),
  ]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Contest Settings</h1>
      <Card>
        <CardHeader><CardTitle>Contest Info</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{contest.name}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Invite Code</span><span className="font-mono font-bold">{contest.invite_code}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge>{getNormalizedStatus(contest, prisma as any)}</Badge></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Dates</span><span>{format(contest.start_date, "MMM dd")} - {format(contest.end_date, "MMM dd, yyyy")}</span></div>
        </CardContent>
      </Card>

      {pendingMembers.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Pending Approvals ({pendingMembers.length})</CardTitle></CardHeader>
          <CardContent><div className="space-y-3">{pendingMembers.map((m) => (
            <div key={m.id} className="flex items-center justify-between"><p className="font-medium">{m.users?.profiles?.full_name ?? m.users?.email}</p><Badge variant="outline">Pending</Badge></div>
          ))}</div></CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Members ({allMembers.length})</CardTitle></CardHeader>
        <CardContent><div className="space-y-3">{allMembers.map((m) => (
          <div key={m.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">{m.users?.profiles?.full_name?.charAt(0)?.toUpperCase() ?? "?"}</div>
              <div><p className="font-medium">{m.users?.profiles?.full_name ?? m.users?.email}</p><p className="text-xs text-muted-foreground">Joined {format(m.joined_at, "MMM dd")}</p></div>
            </div>
            <div className="flex items-center gap-2">{m.role === "admin" && <Badge>Admin</Badge>}<Badge variant="outline">{m.status}</Badge></div>
          </div>
        ))}</div></CardContent>
      </Card>
    </div>
  );
}

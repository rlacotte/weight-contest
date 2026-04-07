import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Calendar, Trophy } from "lucide-react";
import { format } from "date-fns";
import { getNormalizedStatus } from "@/lib/utils/contest";

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  upcoming: "bg-blue-100 text-blue-800",
  active: "bg-green-100 text-green-800",
  completed: "bg-purple-100 text-purple-800",
  cancelled: "bg-red-100 text-red-800",
};

export default async function ContestsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const memberships = await prisma.contest_members.findMany({
    where: { user_id: session.user.id, status: { in: ["approved", "pending"] } },
    include: { contests: true },
    orderBy: { joined_at: "desc" },
  });

  const contests = memberships.map((m) => ({
    ...m.contests,
    status: getNormalizedStatus(m.contests, prisma as any),
    user_role: m.role,
    user_status: m.status,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Contests</h1>
        <div className="flex gap-2">
          <Link href="/contests/join"><Button variant="outline"><Users className="mr-2 h-4 w-4" />Join Contest</Button></Link>
          <Link href="/contests/new"><Button><Plus className="mr-2 h-4 w-4" />Create Contest</Button></Link>
        </div>
      </div>

      {contests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No contests yet</h3>
            <p className="text-muted-foreground text-center mb-4">Create a new contest or join one with an invite code.</p>
            <div className="flex gap-2">
              <Link href="/contests/join"><Button variant="outline">Join Contest</Button></Link>
              <Link href="/contests/new"><Button>Create Contest</Button></Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {contests.map((contest) => (
            <Link key={contest.id} href={`/contests/${contest.id}`}>
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{contest.name}</CardTitle>
                    <Badge className={statusColors[contest.status] ?? ""}>{contest.status}</Badge>
                  </div>
                  {contest.description && <p className="text-sm text-muted-foreground line-clamp-2">{contest.description}</p>}
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{format(contest.start_date, "MMM dd")} - {format(contest.end_date, "MMM dd, yyyy")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4" />
                      <span className="capitalize">{contest.contest_type.replace(/_/g, " ")}</span>
                    </div>
                    {contest.entry_fee_cents > 0 && <span className="font-medium text-foreground">${(contest.entry_fee_cents / 100).toFixed(2)} buy-in</span>}
                    {contest.user_role === "admin" && <Badge variant="outline" className="text-xs">Admin</Badge>}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

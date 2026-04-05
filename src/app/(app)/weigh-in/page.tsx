import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { WeighInForm } from "@/components/weigh-in/WeighInForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { History } from "lucide-react";
import type { WeightUnit } from "@/types/database";

export default async function WeighInPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const [profile, recentWeighIns, activeMembers] = await Promise.all([
    prisma.profiles.findUnique({ where: { user_id: session.user.id }, select: { units_weight: true } }),
    prisma.weigh_ins.findMany({
      where: { user_id: session.user.id },
      orderBy: { weighed_at: "desc" },
      take: 5,
    }),
    prisma.contest_members.findMany({
      where: { user_id: session.user.id, status: "approved" },
      include: { contests: { select: { id: true, name: true, status: true } } },
    }),
  ]);

  const units = (profile?.units_weight ?? "kg") as WeightUnit;
  const factor = units === "lbs" ? 2.20462 : 1;

  const contests = activeMembers
    .filter((m) => m.contests.status === "active")
    .map((m) => m.contests as any);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Weigh In</h1>
        <Link href="/weigh-in/history">
          <Button variant="outline" size="sm">
            <History className="mr-2 h-4 w-4" />
            History
          </Button>
        </Link>
      </div>

      <WeighInForm units={units} contests={contests} />

      {recentWeighIns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Weigh-Ins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentWeighIns.map((w) => (
                <div key={w.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">
                      {(Number(w.weight) * factor).toFixed(1)} {units}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(w.weighed_at), "MMM dd, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                  {w.weight_change !== null && (
                    <span className={`text-sm font-medium ${Number(w.weight_change) <= 0 ? "text-green-500" : "text-red-500"}`}>
                      {Number(w.weight_change) > 0 ? "+" : ""}
                      {(Number(w.weight_change) * factor).toFixed(1)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

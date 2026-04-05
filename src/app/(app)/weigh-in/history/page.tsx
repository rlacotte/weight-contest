import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default async function WeighInHistoryPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const [profile, weighIns] = await Promise.all([
    prisma.profiles.findUnique({ where: { user_id: session.user.id }, select: { units_weight: true } }),
    prisma.weigh_ins.findMany({
      where: { user_id: session.user.id },
      orderBy: { weighed_at: "desc" },
      take: 100,
    }),
  ]);

  const units = profile?.units_weight ?? "kg";
  const factor = units === "lbs" ? 2.20462 : 1;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Weigh-In History</h1>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Weight</TableHead>
                <TableHead>Change</TableHead>
                <TableHead>Body Fat</TableHead>
                <TableHead>Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {weighIns.length > 0 ? (
                weighIns.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell className="font-medium">{format(new Date(w.weighed_at), "MMM dd, yyyy")}</TableCell>
                    <TableCell>{(Number(w.weight) * factor).toFixed(1)} {units}</TableCell>
                    <TableCell>
                      {w.weight_change !== null ? (
                        <span className={Number(w.weight_change) <= 0 ? "text-green-500" : "text-red-500"}>
                          {Number(w.weight_change) > 0 ? "+" : ""}{(Number(w.weight_change) * factor).toFixed(1)}
                        </span>
                      ) : "-"}
                    </TableCell>
                    <TableCell>{w.body_fat_pct ? `${Number(w.body_fat_pct)}%` : "-"}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{w.source}</Badge></TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No weigh-ins yet</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

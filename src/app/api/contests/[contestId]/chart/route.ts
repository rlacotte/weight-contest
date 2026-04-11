import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

const COLORS = [
  "hsl(221, 83%, 53%)",
  "hsl(0, 84%, 60%)",
  "hsl(142, 76%, 36%)",
  "hsl(280, 67%, 50%)",
  "hsl(35, 92%, 50%)",
  "hsl(190, 90%, 40%)",
  "hsl(340, 75%, 55%)",
  "hsl(60, 70%, 45%)",
];

export async function GET(
  request: Request,
  { params }: { params: Promise<{ contestId: string }> }
) {
  const { contestId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contest = await prisma.contests.findUnique({ where: { id: contestId } });
  if (!contest) {
    return NextResponse.json({ error: "Contest not found" }, { status: 404 });
  }

  const members = await prisma.contest_members.findMany({
    where: { contest_id: contestId, status: "approved" },
    include: { users: { include: { profiles: { select: { full_name: true } } } } },
  });

  if (members.length === 0) {
    return NextResponse.json({ series: [], chartData: [] });
  }

  const memberIds = members.map((m) => m.user_id);

  // Fetch all weigh-ins within contest period
  const weighIns = await prisma.weigh_ins.findMany({
    where: {
      user_id: { in: memberIds },
      weighed_at: { gte: contest.start_date, lte: contest.end_date },
    },
    orderBy: { weighed_at: "asc" },
    select: { user_id: true, weight: true, weighed_at: true },
  });

  // Compute starting weight per member (first weigh-in or contest_members.starting_weight)
  const startWeights: Record<string, number> = {};
  for (const m of members) {
    if (m.starting_weight) {
      startWeights[m.user_id] = Number(m.starting_weight);
    } else {
      const first = weighIns.find((w) => w.user_id === m.user_id);
      if (first) startWeights[m.user_id] = Number(first.weight);
    }
  }

  // Build member name map
  const nameMap: Record<string, string> = {};
  members.forEach((m) => {
    const name = m.users?.profiles?.full_name ?? m.users?.name ?? "Anon";
    // Use first name only for privacy
    nameMap[m.user_id] = name.split(" ")[0];
  });

  // Series metadata
  const series = members
    .filter((m) => startWeights[m.user_id])
    .map((m, i) => ({
      name: nameMap[m.user_id],
      color: COLORS[i % COLORS.length],
      data: [] as { date: string; index: number }[],
    }));

  // Group weigh-ins by date (day granularity)
  const dateSet = new Set<string>();
  const weighInsByUserDate: Record<string, Record<string, number>> = {};

  for (const w of weighIns) {
    const dateStr = format(w.weighed_at, "MMM dd");
    dateSet.add(dateStr);

    if (!weighInsByUserDate[w.user_id]) weighInsByUserDate[w.user_id] = {};
    // Keep the latest weigh-in per day per user
    weighInsByUserDate[w.user_id][dateStr] = Number(w.weight);
  }

  const sortedDates = Array.from(dateSet);

  // Build chart data: one row per date, one column per member (index value)
  const chartData = sortedDates.map((dateStr) => {
    const row: Record<string, any> = { date: dateStr };

    for (const m of members) {
      const start = startWeights[m.user_id];
      if (!start) continue;

      const name = nameMap[m.user_id];
      const weight = weighInsByUserDate[m.user_id]?.[dateStr];

      if (weight !== undefined) {
        row[name] = Math.round((weight / start) * 1000) / 10;
      }
    }

    return row;
  });

  return NextResponse.json({ series, chartData });
}

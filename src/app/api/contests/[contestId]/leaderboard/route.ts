import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateRankings } from "@/lib/utils/leaderboard";
import type { ContestType } from "@/types/database";

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
    include: { users: { include: { profiles: true } } },
  });

  if (members.length === 0) return NextResponse.json([]);

  const memberIds = members.map((m) => m.user_id);
  const weighIns = await prisma.weigh_ins.findMany({
    where: { user_id: { in: memberIds } },
    orderBy: { weighed_at: "desc" },
  });

  const membersData = members.map((m) => {
    const memberWeighIns = weighIns
      .filter((w) => w.user_id === m.user_id)
      .map((w) => ({
        ...w,
        weight: Number(w.weight),
        weighed_at: w.weighed_at.toISOString(),
      }));
    const profile = m.users.profiles;
    return {
      member: { ...m, starting_weight: m.starting_weight ? Number(m.starting_weight) : null, starting_body_fat: m.starting_body_fat ? Number(m.starting_body_fat) : null },
      profile: profile ? { ...profile, streak_current: profile.streak_current, full_name: profile.full_name } : { streak_current: 0, full_name: m.users.name },
      weighIns: memberWeighIns,
      latestWeight: memberWeighIns[0]?.weight ?? null,
    };
  });

  const rankings = calculateRankings(membersData as any, contest.contest_type as ContestType, contest.custom_metric_name);
  return NextResponse.json(rankings);
}

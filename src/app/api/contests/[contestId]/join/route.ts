import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ contestId: string }> }
) {
  const { contestId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { invite_code } = body;

  const contest = await prisma.contests.findFirst({
    where: { id: contestId, invite_code },
  });

  if (!contest) {
    return NextResponse.json({ error: "Invalid contest or invite code" }, { status: 404 });
  }

  if (contest.status === "completed" || contest.status === "cancelled") {
    return NextResponse.json({ error: "Contest is no longer accepting members" }, { status: 400 });
  }

  const existing = await prisma.contest_members.findUnique({
    where: { contest_id_user_id: { contest_id: contestId, user_id: session.user.id } },
  });

  if (existing) {
    return NextResponse.json({ error: "Already a member" }, { status: 400 });
  }

  if (contest.max_members) {
    const count = await prisma.contest_members.count({
      where: { contest_id: contestId, status: "approved" },
    });
    if (count >= contest.max_members) {
      return NextResponse.json({ error: "Contest is full" }, { status: 400 });
    }
  }

  const latestWeighIn = await prisma.weigh_ins.findFirst({
    where: { user_id: session.user.id },
    orderBy: { weighed_at: "desc" },
    select: { weight: true },
  });

  const member = await prisma.contest_members.create({
    data: {
      contest_id: contestId,
      user_id: session.user.id,
      role: "member",
      status: contest.entry_fee_cents > 0 ? "pending" : "approved",
      starting_weight: latestWeighIn?.weight ?? null,
    },
  });

  await prisma.activity_feed.create({
    data: {
      user_id: session.user.id,
      contest_id: contestId,
      activity_type: "joined_contest",
      data: { contest_name: contest.name },
      visibility: "contest",
    },
  });

  return NextResponse.json(member);
}

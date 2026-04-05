import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createContestSchema } from "@/lib/validators/contest";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createContestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const input = parsed.data;

  const contest = await prisma.contests.create({
    data: {
      creator_id: session.user.id,
      name: input.name,
      description: input.description ?? null,
      contest_type: input.contest_type,
      custom_metric_name: input.custom_metric_name ?? null,
      custom_metric_unit: input.custom_metric_unit ?? null,
      start_date: new Date(input.start_date),
      end_date: new Date(input.end_date),
      weigh_in_frequency: input.weigh_in_frequency,
      weigh_in_day: input.weigh_in_day ?? null,
      rules: input.rules ?? null,
      is_public: input.is_public,
      max_members: input.max_members ?? null,
      entry_fee_cents: input.entry_fee_cents,
      prize_distribution: input.prize_distribution,
      penalty_missed_weigh_in_cents: input.penalty_missed_weigh_in_cents,
      has_photo_proof: input.has_photo_proof,
      milestones: input.milestones as any,
      status: new Date(input.start_date) > new Date() ? "upcoming" : "active",
    },
  });

  // Get latest weight for starting weight
  const latestWeighIn = await prisma.weigh_ins.findFirst({
    where: { user_id: session.user.id },
    orderBy: { weighed_at: "desc" },
    select: { weight: true },
  });

  await prisma.contest_members.create({
    data: {
      contest_id: contest.id,
      user_id: session.user.id,
      role: "admin",
      status: "approved",
      starting_weight: latestWeighIn?.weight ?? null,
    },
  });

  return NextResponse.json(contest);
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const memberships = await prisma.contest_members.findMany({
    where: { user_id: session.user.id, status: { in: ["approved", "pending"] } },
    include: { contests: true },
  });

  const result = memberships.map((m) => ({
    ...m.contests,
    start_date: m.contests.start_date.toISOString(),
    end_date: m.contests.end_date.toISOString(),
    created_at: m.contests.created_at.toISOString(),
    updated_at: m.contests.updated_at.toISOString(),
    user_role: m.role,
    user_status: m.status,
  }));

  return NextResponse.json(result);
}

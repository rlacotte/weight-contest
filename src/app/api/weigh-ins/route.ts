import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { weighInSchema } from "@/lib/validators/weigh-in";
import { calculateEWMA } from "@/lib/utils/trend";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const body = await request.json();
  const parsed = weighInSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const input = parsed.data;

  const profile = await prisma.profiles.findUnique({
    where: { user_id: userId },
    select: { starting_weight: true, streak_current: true, streak_longest: true, streak_last_weigh_in: true },
  });
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const recentWeighIns = await prisma.weigh_ins.findMany({
    where: { user_id: userId },
    orderBy: { weighed_at: "desc" },
    take: 30,
    select: { weight: true, weighed_at: true },
  });

  const allPoints = [
    ...recentWeighIns.map((w) => ({ weight: Number(w.weight), weighed_at: w.weighed_at.toISOString() })),
    { weight: input.weight, weighed_at: input.weighed_at ?? new Date().toISOString() },
  ];
  const smoothedWeight = calculateEWMA(allPoints);

  const previousWeight = recentWeighIns[0] ? Number(recentWeighIns[0].weight) : null;
  const weightChange = previousWeight ? input.weight - previousWeight : null;

  const startingWeight = profile.starting_weight ? Number(profile.starting_weight) : null;
  const totalChange = startingWeight ? input.weight - startingWeight : null;
  const totalChangePct =
    startingWeight && startingWeight > 0
      ? ((input.weight - startingWeight) / startingWeight) * 100
      : null;

  // Single weigh-in per measurement — no contest_id
  const weighIn = await prisma.weigh_ins.create({
    data: {
      user_id: userId,
      weight: input.weight,
      body_fat_pct: input.body_fat_pct ?? null,
      muscle_mass: input.muscle_mass ?? null,
      water_pct: input.water_pct ?? null,
      waist_cm: input.waist_cm ?? null,
      hip_cm: input.hip_cm ?? null,
      chest_cm: input.chest_cm ?? null,
      photo_url: input.photo_url ?? null,
      photo_privacy: input.photo_privacy,
      notes: input.notes ?? null,
      source: input.source,
      weighed_at: input.weighed_at ?? new Date().toISOString(),
      smoothed_weight: smoothedWeight,
      weight_change: weightChange,
      total_change: totalChange,
      total_change_pct: totalChangePct,
    },
  });

  // Update streak
  const today = new Date().toISOString().split("T")[0];
  const lastWeighIn = profile.streak_last_weigh_in?.toISOString().split("T")[0] ?? null;
  let newStreak = profile.streak_current;

  if (!lastWeighIn || lastWeighIn !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    if (lastWeighIn === yesterdayStr) {
      newStreak = profile.streak_current + 1;
    } else {
      newStreak = 1;
    }

    await prisma.profiles.update({
      where: { user_id: userId },
      data: {
        streak_current: newStreak,
        streak_longest: Math.max(profile.streak_longest, newStreak),
        streak_last_weigh_in: new Date(today),
      },
    });
  }

  // Activity feed entries for each active contest + one private
  const activeMemberships = await prisma.contest_members.findMany({
    where: {
      user_id: userId,
      status: "approved",
      contests: { status: "active", start_date: { lte: new Date() }, end_date: { gte: new Date() } },
    },
    select: { contest_id: true },
  });

  const feedContestIds = activeMemberships.map((m) => m.contest_id);

  await Promise.all([
    // Private activity
    prisma.activity_feed.create({
      data: {
        user_id: userId,
        contest_id: null,
        activity_type: "weigh_in",
        data: {
          index_value: startingWeight && startingWeight > 0 ? Math.round((input.weight / startingWeight) * 1000) / 10 : 100,
          change_pct: totalChangePct ? Math.round(totalChangePct * 10) / 10 : null,
          streak: newStreak,
        },
        visibility: "private",
      },
    }),
    // One activity per active contest
    ...feedContestIds.map((cid) =>
      prisma.activity_feed.create({
        data: {
          user_id: userId,
          contest_id: cid,
          activity_type: "weigh_in",
          data: {
            index_value: startingWeight && startingWeight > 0 ? Math.round((input.weight / startingWeight) * 1000) / 10 : 100,
            change_pct: totalChangePct ? Math.round(totalChangePct * 10) / 10 : null,
            streak: newStreak,
          },
          visibility: "contest",
        },
      })
    ),
  ]);

  return NextResponse.json({ weighIn, newStreak, newAchievements: [] });
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") ?? "90");

  const data = await prisma.weigh_ins.findMany({
    where: { user_id: session.user.id },
    orderBy: { weighed_at: "desc" },
    take: limit,
  });

  const serialized = data.map((w) => ({
    ...w,
    weight: Number(w.weight),
    body_fat_pct: w.body_fat_pct ? Number(w.body_fat_pct) : null,
    smoothed_weight: w.smoothed_weight ? Number(w.smoothed_weight) : null,
    weight_change: w.weight_change ? Number(w.weight_change) : null,
    total_change: w.total_change ? Number(w.total_change) : null,
    total_change_pct: w.total_change_pct ? Number(w.total_change_pct) : null,
    weighed_at: w.weighed_at.toISOString(),
    created_at: w.created_at.toISOString(),
  }));

  return NextResponse.json(serialized);
}

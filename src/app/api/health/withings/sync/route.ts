import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchMeasurements, refreshTokens } from "@/lib/health/withings";
import { calculateEWMA } from "@/lib/utils/trend";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const integration = await prisma.health_integrations.findUnique({
    where: { user_id_provider: { user_id: userId, provider: "withings" } },
  });

  if (!integration) {
    return NextResponse.json({ error: "Withings not connected" }, { status: 404 });
  }

  // Refresh token if expired
  let accessToken = integration.access_token;
  if (integration.token_expires_at && integration.token_expires_at <= new Date()) {
    try {
      const refreshed = await refreshTokens(integration.refresh_token!);
      accessToken = refreshed.access_token;
      await prisma.health_integrations.update({
        where: { id: integration.id },
        data: {
          access_token: refreshed.access_token,
          refresh_token: refreshed.refresh_token,
          token_expires_at: new Date(Date.now() + refreshed.expires_in * 1000),
        },
      });
    } catch (err) {
      return NextResponse.json({ error: "Failed to refresh token", details: String(err) }, { status: 500 });
    }
  }

  // Fetch measurements since last sync
  const lastSync = integration.last_sync_at ?? undefined;
  let measurements;
  try {
    measurements = await fetchMeasurements(accessToken, lastSync);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch measurements", details: String(err) }, { status: 500 });
  }

  // Get profile for starting weight
  const profile = await prisma.profiles.findUnique({
    where: { user_id: userId },
    select: { starting_weight: true, streak_current: true },
  });
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const startingWeight = profile.starting_weight ? Number(profile.starting_weight) : null;

  // Process measurements in chronological order
  measurements.sort((a, b) => a.date.getTime() - b.date.getTime());

  let imported = 0;
  let skipped = 0;

  for (const m of measurements) {
    // Deduplicate: one weigh-in per timestamp (1-minute window)
    const existing = await prisma.weigh_ins.findFirst({
      where: {
        user_id: userId,
        weighed_at: {
          gte: new Date(m.date.getTime() - 60000),
          lte: new Date(m.date.getTime() + 60000),
        },
      },
    });

    if (existing) {
      skipped++;
      continue;
    }

    // Get recent weigh-ins for smoothing
    const recent = await prisma.weigh_ins.findMany({
      where: { user_id: userId, weighed_at: { lte: m.date } },
      orderBy: { weighed_at: "desc" },
      take: 30,
      select: { weight: true, weighed_at: true },
    });

    const allPoints = [
      ...recent.map((w) => ({ weight: Number(w.weight), weighed_at: w.weighed_at.toISOString() })),
      { weight: m.weight, weighed_at: m.date.toISOString() },
    ];
    const smoothed = calculateEWMA(allPoints);

    const previousWeight = recent[0] ? Number(recent[0].weight) : null;
    const weightChange = previousWeight ? m.weight - previousWeight : null;
    const totalChange = startingWeight ? m.weight - startingWeight : null;
    const totalChangePct =
      startingWeight && startingWeight > 0
        ? ((m.weight - startingWeight) / startingWeight) * 100
        : null;

    // Single weigh-in per measurement
    await prisma.weigh_ins.create({
      data: {
        user_id: userId,
        weight: m.weight,
        body_fat_pct: m.body_fat_pct,
        muscle_mass: m.muscle_mass,
        water_pct: m.water_pct,
        source: "withings",
        weighed_at: m.date,
        smoothed_weight: smoothed,
        weight_change: weightChange,
        total_change: totalChange,
        total_change_pct: totalChangePct,
      },
    });

    // Activity feed for each active contest at this date
    const activeMemberships = await prisma.contest_members.findMany({
      where: {
        user_id: userId,
        status: "approved",
        contests: { status: "active", start_date: { lte: m.date }, end_date: { gte: m.date } },
      },
      select: { contest_id: true },
    });

    const feedData = {
      index_value: startingWeight && startingWeight > 0 ? Math.round((m.weight / startingWeight) * 1000) / 10 : 100,
      change_pct: totalChangePct ? Math.round(totalChangePct * 10) / 10 : null,
      streak: profile.streak_current,
    };

    await Promise.all([
      prisma.activity_feed.create({ data: { user_id: userId, contest_id: null, activity_type: "weigh_in", data: feedData, visibility: "private" } }),
      ...activeMemberships.map((am) =>
        prisma.activity_feed.create({ data: { user_id: userId, contest_id: am.contest_id, activity_type: "weigh_in", data: feedData, visibility: "contest" } })
      ),
    ]);

    imported++;
  }

  await prisma.health_integrations.update({
    where: { id: integration.id },
    data: { last_sync_at: new Date() },
  });

  return NextResponse.json({ imported, skipped, total: measurements.length });
}

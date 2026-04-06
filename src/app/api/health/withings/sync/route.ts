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
    select: { starting_weight: true, streak_current: true, streak_longest: true, streak_last_weigh_in: true },
  });
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  let imported = 0;
  let skipped = 0;

  for (const m of measurements) {
    // Deduplicate: check if a weigh-in already exists within 1 minute
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
    const startingWeight = profile.starting_weight ? Number(profile.starting_weight) : null;

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
        weight_change: previousWeight ? m.weight - previousWeight : null,
        total_change: startingWeight ? m.weight - startingWeight : null,
        total_change_pct: startingWeight && startingWeight > 0 ? ((m.weight - startingWeight) / startingWeight) * 100 : null,
      },
    });
    imported++;
  }

  await prisma.health_integrations.update({
    where: { id: integration.id },
    data: { last_sync_at: new Date() },
  });

  return NextResponse.json({ imported, skipped, total: measurements.length });
}

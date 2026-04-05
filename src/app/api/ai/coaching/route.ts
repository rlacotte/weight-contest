import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateWeeklyInsights, generateMotivation } from "@/lib/ai/coaching";
import { subDays } from "date-fns";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { type } = await request.json();

  const [profile, weighIns] = await Promise.all([
    prisma.profiles.findUnique({ where: { user_id: session.user.id } }),
    prisma.weigh_ins.findMany({ where: { user_id: session.user.id }, orderBy: { weighed_at: "desc" }, take: 30 }),
  ]);

  if (!profile || weighIns.length === 0) return NextResponse.json({ error: "Not enough data" }, { status: 400 });

  const currentWeight = Number(weighIns[0].weight);
  const startingWeight = Number(profile.starting_weight ?? currentWeight);
  const goalWeight = Number(profile.goal_weight ?? currentWeight);
  const totalLossPct = ((startingWeight - currentWeight) / startingWeight) * 100;

  const weekAgo = subDays(new Date(), 7);
  const weekAgoWeighIn = weighIns.find((w) => w.weighed_at <= weekAgo);
  const weeklyChange = weekAgoWeighIn ? currentWeight - Number(weekAgoWeighIn.weight) : 0;

  let recentTrend: "losing" | "gaining" | "plateau" = "plateau";
  if (weeklyChange < -0.1) recentTrend = "losing";
  else if (weeklyChange > 0.1) recentTrend = "gaining";

  const ctx = { userName: profile.full_name?.split(" ")[0] ?? "there", currentWeight, startingWeight, goalWeight, totalLossPct, streak: profile.streak_current, weeklyChange, weighInCount: weighIns.length, daysActive: Math.ceil((Date.now() - profile.created_at.getTime()) / 86400000), recentTrend };

  try {
    if (type === "insights") return NextResponse.json({ insights: await generateWeeklyInsights(ctx) });
    if (type === "motivation") return NextResponse.json({ motivation: await generateMotivation(ctx) });
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch { return NextResponse.json({ error: "AI service unavailable" }, { status: 503 }); }
}

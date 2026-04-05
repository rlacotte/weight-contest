import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { subDays, startOfWeek } from "date-fns";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reportWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekStart = subDays(new Date(), 7);

  const profiles = await prisma.profiles.findMany({ where: { onboarding_completed: true } });
  let processed = 0;

  for (const profile of profiles) {
    const weekWeighIns = await prisma.weigh_ins.findMany({
      where: { user_id: profile.user_id, weighed_at: { gte: weekStart } },
      orderBy: { weighed_at: "asc" },
      select: { weight: true, weighed_at: true },
    });

    if (weekWeighIns.length === 0) continue;

    const weightStart = Number(weekWeighIns[0].weight);
    const weightEnd = Number(weekWeighIns[weekWeighIns.length - 1].weight);

    await prisma.weekly_reports.upsert({
      where: { user_id_contest_id_report_week: { user_id: profile.user_id, contest_id: null as any, report_week: reportWeek } },
      update: { weight_start: weightStart, weight_end: weightEnd, weight_change: weightEnd - weightStart, weigh_in_count: weekWeighIns.length },
      create: { user_id: profile.user_id, report_week: reportWeek, weight_start: weightStart, weight_end: weightEnd, weight_change: weightEnd - weightStart, weigh_in_count: weekWeighIns.length, streak_maintained: profile.streak_current >= 7, data: {} },
    });

    await prisma.notifications.create({
      data: { user_id: profile.user_id, type: "weekly_digest", title: "Weekly Report Ready", body: `${weekWeighIns.length} weigh-in${weekWeighIns.length !== 1 ? "s" : ""} this week.`, data: {} },
    });

    processed++;
  }

  return NextResponse.json({ processed });
}

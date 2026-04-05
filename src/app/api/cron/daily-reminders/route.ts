import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date().toISOString().split("T")[0];
  const profiles = await prisma.profiles.findMany({
    where: { onboarding_completed: true, NOT: { notification_weigh_in_time: null } },
    select: { user_id: true, full_name: true, streak_current: true, streak_last_weigh_in: true },
  });

  let sentCount = 0;
  for (const profile of profiles) {
    if (profile.streak_last_weigh_in?.toISOString().split("T")[0] === today) continue;

    await prisma.notifications.create({
      data: {
        user_id: profile.user_id,
        type: "weigh_in_reminder",
        title: "Time to weigh in!",
        body: profile.streak_current > 0 ? `Don't break your ${profile.streak_current}-day streak!` : "Start building your streak today.",
        data: {},
      },
    });
    sentCount++;
  }

  return NextResponse.json({ sent: sentCount });
}

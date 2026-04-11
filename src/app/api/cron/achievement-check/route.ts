import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAndAwardAchievements } from "@/lib/utils/achievements";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profiles = await prisma.profiles.findMany({
    where: { onboarding_completed: true },
    select: { user_id: true },
  });

  let awarded = 0;
  for (const profile of profiles) {
    const newAchievements = await checkAndAwardAchievements(profile.user_id);
    awarded += newAchievements.length;
  }

  return NextResponse.json({ awarded });
}

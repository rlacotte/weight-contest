import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Simple achievement check - count-based achievements
  const profiles = await prisma.profiles.findMany({
    where: { onboarding_completed: true },
    select: { user_id: true },
  });

  let awarded = 0;
  // Achievement checking would go here with Prisma queries
  // Simplified for now - the main check happens on weigh-in POST

  return NextResponse.json({ awarded });
}

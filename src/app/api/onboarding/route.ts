import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { full_name, height_cm, starting_weight, goal_weight, units_weight, units_height, timezone } = body;

  await prisma.profiles.upsert({
    where: { user_id: session.user.id },
    update: {
      full_name,
      height_cm,
      starting_weight,
      goal_weight,
      units_weight: units_weight ?? "kg",
      units_height: units_height ?? "cm",
      timezone: timezone ?? "UTC",
      onboarding_completed: true,
    },
    create: {
      user_id: session.user.id,
      full_name,
      height_cm,
      starting_weight,
      goal_weight,
      units_weight: units_weight ?? "kg",
      units_height: units_height ?? "cm",
      timezone: timezone ?? "UTC",
      onboarding_completed: true,
    },
  });

  // Also update user name
  await prisma.users.update({
    where: { id: session.user.id },
    data: { name: full_name },
  });

  return NextResponse.json({ ok: true });
}

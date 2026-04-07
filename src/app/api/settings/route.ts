import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.profiles.findUnique({ where: { user_id: session.user.id } });
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  return NextResponse.json({
    units_weight: profile.units_weight,
    units_height: profile.units_height,
    privacy_hide_weight: profile.privacy_hide_weight,
    privacy_show_percentage_only: profile.privacy_show_percentage_only,
    notification_email_digest: profile.notification_email_digest,
    notification_achievements: profile.notification_achievements,
    notification_social: profile.notification_social,
    notification_leaderboard: profile.notification_leaderboard,
  });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  await prisma.profiles.update({
    where: { user_id: session.user.id },
    data: {
      full_name: body.full_name,
      height_cm: body.height_cm,
      starting_weight: body.starting_weight,
      goal_weight: body.goal_weight,
      units_weight: body.units_weight,
      units_height: body.units_height,
      privacy_hide_weight: body.privacy_hide_weight,
      privacy_show_percentage_only: body.privacy_show_percentage_only,
      notification_email_digest: body.notification_email_digest,
      notification_achievements: body.notification_achievements,
      notification_social: body.notification_social,
      notification_leaderboard: body.notification_leaderboard,
    },
  });

  return NextResponse.json({ ok: true });
}

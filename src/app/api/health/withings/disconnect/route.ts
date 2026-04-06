import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.health_integrations.deleteMany({
    where: { user_id: session.user.id, provider: "withings" },
  });

  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const integrations = await prisma.health_integrations.findMany({
    where: { user_id: session.user.id },
    select: { provider: true, last_sync_at: true, sync_enabled: true, created_at: true },
  });

  return NextResponse.json(
    integrations.map((i) => ({
      ...i,
      last_sync_at: i.last_sync_at?.toISOString() ?? null,
      created_at: i.created_at.toISOString(),
    }))
  );
}

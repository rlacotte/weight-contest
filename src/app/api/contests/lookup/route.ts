import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 });

  const contest = await prisma.contests.findFirst({ where: { invite_code: code.trim() } });
  if (!contest) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const memberCount = await prisma.contest_members.count({ where: { contest_id: contest.id, status: "approved" } });

  return NextResponse.json({
    ...contest,
    start_date: contest.start_date.toISOString(),
    end_date: contest.end_date.toISOString(),
    created_at: contest.created_at.toISOString(),
    member_count: memberCount,
  });
}

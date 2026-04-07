import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const weighIn = await prisma.weigh_ins.findUnique({
    where: { id },
  });

  if (!weighIn) {
    return NextResponse.json({ error: "Weigh-in not found" }, { status: 404 });
  }

  if (weighIn.user_id !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.weigh_ins.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}

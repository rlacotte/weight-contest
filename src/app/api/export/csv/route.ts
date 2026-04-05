import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const weighIns = await prisma.weigh_ins.findMany({
    where: { user_id: session.user.id },
    orderBy: { weighed_at: "asc" },
  });

  if (weighIns.length === 0) return NextResponse.json({ error: "No data" }, { status: 404 });

  const headers = ["Date", "Weight (kg)", "Body Fat %", "Waist (cm)", "Hip (cm)", "Chest (cm)", "Smoothed Weight", "Change", "Total Change %", "Source", "Notes"];
  const rows = weighIns.map((w) =>
    [w.weighed_at.toISOString().split("T")[0], w.weight, w.body_fat_pct ?? "", w.waist_cm ?? "", w.hip_cm ?? "", w.chest_cm ?? "", w.smoothed_weight ?? "", w.weight_change ?? "", w.total_change_pct ? `${Number(w.total_change_pct).toFixed(1)}%` : "", w.source, w.notes ?? ""].join(",")
  );

  const csv = [headers.join(","), ...rows].join("\n");
  return new NextResponse(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="weighins-${new Date().toISOString().split("T")[0]}.csv"` } });
}

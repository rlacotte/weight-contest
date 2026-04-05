import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Bell } from "lucide-react";
import { format } from "date-fns";

const typeIcons: Record<string, string> = { weigh_in_reminder: "⚖️", leaderboard_change: "📊", achievement_earned: "🏆", contest_milestone: "🎯", social_interaction: "💬", contest_invite: "📩", weekly_digest: "📋", streak_warning: "🔥", goal_reached: "🎉", payment_received: "💰", penalty_applied: "⚠️" };

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const notifications = await prisma.notifications.findMany({
    where: { user_id: session.user.id },
    orderBy: { created_at: "desc" },
    take: 50,
  });

  // Mark all as read
  await prisma.notifications.updateMany({
    where: { user_id: session.user.id, read: false },
    data: { read: true },
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Notifications</h1>
      {notifications.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-12"><Bell className="h-12 w-12 text-muted-foreground mb-4" /><h3 className="text-lg font-medium mb-2">All caught up!</h3><p className="text-muted-foreground">No notifications yet.</p></CardContent></Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card key={n.id} className={n.read ? "opacity-60" : ""}>
              <CardContent className="p-4 flex items-start gap-3">
                <span className="text-xl">{typeIcons[n.type] ?? "🔔"}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{n.title}</p>
                  <p className="text-sm text-muted-foreground">{n.body}</p>
                  <p className="text-xs text-muted-foreground mt-1">{format(n.created_at, "MMM dd 'at' h:mm a")}</p>
                </div>
                {!n.read && <div className="h-2 w-2 rounded-full bg-primary mt-2" />}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

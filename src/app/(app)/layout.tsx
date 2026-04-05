import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { TopBar } from "@/components/layout/TopBar";
import { MobileNav } from "@/components/layout/MobileNav";
import { Toaster } from "@/components/ui/sonner";
import { redirect } from "next/navigation";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const profile = await prisma.profiles.findUnique({
    where: { user_id: session.user.id },
  });

  const unreadCount = await prisma.notifications.count({
    where: { user_id: session.user.id, read: false },
  });

  // Convert Prisma Decimal fields to numbers for client components
  const profileData = profile
    ? {
        ...profile,
        height_cm: profile.height_cm ? Number(profile.height_cm) : null,
        starting_weight: profile.starting_weight ? Number(profile.starting_weight) : null,
        goal_weight: profile.goal_weight ? Number(profile.goal_weight) : null,
        streak_last_weigh_in: profile.streak_last_weigh_in?.toISOString().split("T")[0] ?? null,
        notification_weigh_in_time: profile.notification_weigh_in_time?.toISOString() ?? null,
        created_at: profile.created_at.toISOString(),
        updated_at: profile.updated_at.toISOString(),
        date_of_birth: profile.date_of_birth?.toISOString() ?? null,
      }
    : null;

  return (
    <div className="flex min-h-screen">
      <AppSidebar profile={profileData as any} />
      <div className="flex flex-1 flex-col">
        <TopBar profile={profileData as any} unreadCount={unreadCount} />
        <main className="flex-1 p-4 pb-20 lg:p-6 lg:pb-6">{children}</main>
      </div>
      <MobileNav />
      <Toaster />
    </div>
  );
}

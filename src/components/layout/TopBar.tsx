"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SidebarContent } from "./AppSidebar";
import type { Profile } from "@/types/database";

export function TopBar({
  profile,
  unreadCount,
}: {
  profile: Profile | null;
  unreadCount: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-card px-4 lg:px-6">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <SidebarContent profile={profile} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex items-center gap-2 lg:hidden">
        <span className="text-xl">🏋️</span>
        <span className="font-extrabold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">WeightContest</span>
      </div>

      <div className="flex-1" />

      {profile && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="hidden sm:inline">
            {profile.streak_current > 0 && `🔥 ${profile.streak_current} day streak`}
          </span>
        </div>
      )}

      <Link href="/notifications">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </Link>
    </header>
  );
}

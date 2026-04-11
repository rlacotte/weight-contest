import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🏋️</span>
            <span className="font-extrabold text-lg bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
              WeightContest
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/auth/login">
              <Button className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 border-0 shadow-md shadow-purple-500/20">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>
      {children}
      <footer className="border-t bg-card mt-auto">
        <div className="container mx-auto py-8 px-4 text-center text-sm text-muted-foreground">
          <span className="mr-1">🏋️</span> WeightContest — Compete. Track. Win.
        </div>
      </footer>
    </div>
  );
}

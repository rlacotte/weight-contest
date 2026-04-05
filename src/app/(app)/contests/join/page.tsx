"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Search, Users, Calendar, Trophy } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function JoinContestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [inviteCode, setInviteCode] = useState(searchParams.get("code") ?? "");
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [contest, setContest] = useState<any>(null);

  async function handleSearch() {
    if (!inviteCode.trim()) return;
    setSearching(true);
    const res = await fetch(`/api/contests/lookup?code=${inviteCode.trim()}`);
    if (!res.ok) { toast.error("Contest not found"); setContest(null); }
    else { setContest(await res.json()); }
    setSearching(false);
  }

  async function handleJoin() {
    if (!contest) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/contests/${contest.id}/join`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ invite_code: inviteCode.trim() }) });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      toast.success("Joined!", { description: contest.name });
      router.push(`/contests/${contest.id}`);
    } catch (err) { toast.error(err instanceof Error ? err.message : "Error"); }
    finally { setLoading(false); }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Join a Contest</h1>
      <Card><CardHeader><CardTitle>Enter Invite Code</CardTitle><CardDescription>Ask the contest creator for the code</CardDescription></CardHeader>
        <CardContent><div className="flex gap-2"><Input placeholder="e.g. a1b2c3d4e5f6" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} /><Button onClick={handleSearch} disabled={searching || !inviteCode.trim()}>{searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}</Button></div></CardContent>
      </Card>
      {contest && (
        <Card><CardHeader><CardTitle>{contest.name}</CardTitle>{contest.description && <CardDescription>{contest.description}</CardDescription>}</CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /><span>{format(new Date(contest.start_date), "MMM dd")} - {format(new Date(contest.end_date), "MMM dd, yyyy")}</span></div>
              <div className="flex items-center gap-2"><Trophy className="h-4 w-4 text-muted-foreground" /><span className="capitalize">{contest.contest_type.replace(/_/g, " ")}</span></div>
              <div className="flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" /><span>{contest.member_count} member{contest.member_count !== 1 ? "s" : ""}{contest.max_members && ` / ${contest.max_members}`}</span></div>
              {contest.entry_fee_cents > 0 && <p className="font-medium">Entry: ${(contest.entry_fee_cents / 100).toFixed(2)}</p>}
            </div>
            {contest.rules && <div className="rounded-lg bg-muted p-3"><p className="text-sm font-medium mb-1">Rules</p><p className="text-sm text-muted-foreground whitespace-pre-wrap">{contest.rules}</p></div>}
            <Button className="w-full" size="lg" onClick={handleJoin} disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Join Contest</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

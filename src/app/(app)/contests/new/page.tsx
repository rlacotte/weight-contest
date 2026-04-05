"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function CreateContestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [contestType, setContestType] = useState("weight_loss_pct");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [frequency, setFrequency] = useState("weekly");
  const [rules, setRules] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [maxMembers, setMaxMembers] = useState("");
  const [entryFee, setEntryFee] = useState("");
  const [photoProof, setPhotoProof] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/contests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || null,
          contest_type: contestType,
          start_date: new Date(startDate).toISOString(),
          end_date: new Date(endDate).toISOString(),
          weigh_in_frequency: frequency,
          rules: rules || null,
          is_public: isPublic,
          max_members: maxMembers ? parseInt(maxMembers) : null,
          entry_fee_cents: entryFee ? Math.round(parseFloat(entryFee) * 100) : 0,
          has_photo_proof: photoProof,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.toString() ?? "Failed to create contest");
      }

      const contest = await res.json();
      toast.success("Contest created!", {
        description: `Invite code: ${contest.invite_code}`,
      });
      router.push(`/contests/${contest.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Create Contest</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Contest Name</Label>
              <Input
                id="name"
                placeholder="Summer Shred Challenge"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what this contest is about..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Contest Type</Label>
              <Select value={contestType} onValueChange={(v) => v && setContestType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weight_loss_pct">Weight Loss % (fairest)</SelectItem>
                  <SelectItem value="absolute_weight_loss">Absolute Weight Loss</SelectItem>
                  <SelectItem value="body_fat_pct">Body Fat % Change</SelectItem>
                  <SelectItem value="custom">Custom Metric</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Weigh-in Frequency</Label>
              <Select value={frequency} onValueChange={(v) => v && setFrequency(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Biweekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rules & Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rules">Rules</Label>
              <Textarea
                id="rules"
                placeholder="Any specific rules for this contest..."
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxMembers">Max Members (optional)</Label>
              <Input
                id="maxMembers"
                type="number"
                min="2"
                max="100"
                placeholder="No limit"
                value={maxMembers}
                onChange={(e) => setMaxMembers(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Public Contest</Label>
                <p className="text-xs text-muted-foreground">Anyone can discover and join</p>
              </div>
              <Switch checked={isPublic} onCheckedChange={setIsPublic} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Require Photo Proof</Label>
                <p className="text-xs text-muted-foreground">Members must upload scale photos</p>
              </div>
              <Switch checked={photoProof} onCheckedChange={setPhotoProof} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stakes (Optional)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="entryFee">Entry Fee ($)</Label>
              <Input
                id="entryFee"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={entryFee}
                onChange={(e) => setEntryFee(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Set to 0 for a free contest
              </p>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Contest
        </Button>
      </form>
    </div>
  );
}

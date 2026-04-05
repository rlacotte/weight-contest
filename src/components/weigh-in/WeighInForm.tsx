"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Scale, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import type { WeightUnit, Contest } from "@/types/database";

interface Props {
  units: WeightUnit;
  contests?: Contest[];
}

export function WeighInForm({ units, contests }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [weight, setWeight] = useState("");
  const [contestId, setContestId] = useState<string | null>(null);
  const [bodyFatPct, setBodyFatPct] = useState("");
  const [waistCm, setWaistCm] = useState("");
  const [hipCm, setHipCm] = useState("");
  const [chestCm, setChestCm] = useState("");
  const [notes, setNotes] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    let weightKg = parseFloat(weight);
    if (units === "lbs") {
      weightKg = Math.round((weightKg / 2.20462) * 10) / 10;
    }

    const payload: Record<string, unknown> = {
      weight: weightKg,
      source: "manual",
    };

    if (contestId) payload.contest_id = contestId;
    if (bodyFatPct) payload.body_fat_pct = parseFloat(bodyFatPct);
    if (waistCm) payload.waist_cm = parseFloat(waistCm);
    if (hipCm) payload.hip_cm = parseFloat(hipCm);
    if (chestCm) payload.chest_cm = parseFloat(chestCm);
    if (notes) payload.notes = notes;

    try {
      const res = await fetch("/api/weigh-ins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.toString() ?? "Failed to log weigh-in");
      }

      const data = await res.json();

      toast.success("Weigh-in logged!", {
        description: `${weight} ${units} recorded`,
      });

      // Show confetti for achievements
      if (data.newAchievements?.length > 0) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        data.newAchievements.forEach((a: { name: string; icon: string }) => {
          toast.success(`${a.icon} Achievement Unlocked!`, {
            description: a.name,
            duration: 5000,
          });
        });
      }

      router.refresh();
      setWeight("");
      setBodyFatPct("");
      setWaistCm("");
      setHipCm("");
      setChestCm("");
      setNotes("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scale className="h-5 w-5" />
          Log Weigh-In
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="weight">Weight ({units})</Label>
            <Input
              id="weight"
              type="number"
              step="0.1"
              placeholder={units === "kg" ? "80.5" : "177.5"}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              required
              className="text-2xl h-14 font-mono"
            />
          </div>

          {contests && contests.length > 0 && (
            <div className="space-y-2">
              <Label>Contest (optional)</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={contestId ?? ""}
                onChange={(e) => setContestId(e.target.value || null)}
              >
                <option value="">Personal weigh-in</option>
                {contests.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            More measurements
          </button>

          {showAdvanced && (
            <div className="space-y-4 rounded-lg border p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bodyFat">Body Fat %</Label>
                  <Input
                    id="bodyFat"
                    type="number"
                    step="0.1"
                    placeholder="25.0"
                    value={bodyFatPct}
                    onChange={(e) => setBodyFatPct(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="waist">Waist (cm)</Label>
                  <Input
                    id="waist"
                    type="number"
                    step="0.1"
                    value={waistCm}
                    onChange={(e) => setWaistCm(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hip">Hip (cm)</Label>
                  <Input
                    id="hip"
                    type="number"
                    step="0.1"
                    value={hipCm}
                    onChange={(e) => setHipCm(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chest">Chest (cm)</Label>
                  <Input
                    id="chest"
                    type="number"
                    step="0.1"
                    value={chestCm}
                    onChange={(e) => setChestCm(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="How are you feeling today?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={loading || !weight}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Log Weigh-In
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ChevronRight, ChevronLeft, Check } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const STEPS = ["Profile", "Body Stats", "Preferences"];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [startingWeight, setStartingWeight] = useState("");
  const [goalWeight, setGoalWeight] = useState("");
  const [unitsWeight, setUnitsWeight] = useState<"kg" | "lbs">("kg");
  const [unitsHeight, setUnitsHeight] = useState<"cm" | "inches">("cm");

  async function handleComplete() {
    setLoading(true);
    setError(null);
    let h = parseFloat(heightCm), ws = parseFloat(startingWeight), wg = parseFloat(goalWeight);
    if (unitsHeight === "inches") h = Math.round(h * 2.54 * 10) / 10;
    if (unitsWeight === "lbs") { ws = Math.round((ws / 2.20462) * 10) / 10; wg = Math.round((wg / 2.20462) * 10) / 10; }

    try {
      const res = await fetch("/api/onboarding", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ full_name: fullName, height_cm: h, starting_weight: ws, goal_weight: wg, units_weight: unitsWeight, units_height: unitsHeight, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }) });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      router.push("/dashboard");
    } catch (err) { setError(err instanceof Error ? err.message : "Error"); setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader><CardTitle>Welcome to Weight Contest</CardTitle><CardDescription>Step {step + 1} of {STEPS.length}: {STEPS[step]}</CardDescription><Progress value={((step + 1) / STEPS.length) * 100} className="mt-2" /></CardHeader>
          <CardContent className="space-y-4">
            {step === 0 && <div className="space-y-2"><Label>Your Name</Label><Input placeholder="John Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>}
            {step === 1 && <div className="space-y-4"><div className="space-y-2"><Label>Height ({unitsHeight === "cm" ? "cm" : "inches"})</Label><Input type="number" step="0.1" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} /></div><div className="space-y-2"><Label>Current Weight ({unitsWeight})</Label><Input type="number" step="0.1" value={startingWeight} onChange={(e) => setStartingWeight(e.target.value)} /></div><div className="space-y-2"><Label>Goal Weight ({unitsWeight})</Label><Input type="number" step="0.1" value={goalWeight} onChange={(e) => setGoalWeight(e.target.value)} /></div></div>}
            {step === 2 && <div className="space-y-4"><div className="space-y-2"><Label>Weight Units</Label><Select value={unitsWeight} onValueChange={(v) => v && setUnitsWeight(v as "kg" | "lbs")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="kg">Kilograms</SelectItem><SelectItem value="lbs">Pounds</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>Height Units</Label><Select value={unitsHeight} onValueChange={(v) => v && setUnitsHeight(v as "cm" | "inches")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="cm">Centimeters</SelectItem><SelectItem value="inches">Inches</SelectItem></SelectContent></Select></div></div>}
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2 pt-2">
              {step > 0 && <Button variant="outline" onClick={() => setStep(step - 1)}><ChevronLeft className="mr-1 h-4 w-4" />Back</Button>}
              <div className="flex-1" />
              {step < 2 ? <Button onClick={() => setStep(step + 1)} disabled={(step === 0 && !fullName) || (step === 1 && (!heightCm || !startingWeight || !goalWeight))}>Next<ChevronRight className="ml-1 h-4 w-4" /></Button> : <Button onClick={handleComplete} disabled={loading}>{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}Complete</Button>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

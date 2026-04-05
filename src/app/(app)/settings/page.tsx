"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [unitsWeight, setUnitsWeight] = useState("kg");
  const [unitsHeight, setUnitsHeight] = useState("cm");
  const [hideWeight, setHideWeight] = useState(false);
  const [showPctOnly, setShowPctOnly] = useState(false);
  const [emailDigest, setEmailDigest] = useState(true);
  const [notifAchievements, setNotifAchievements] = useState(true);
  const [notifSocial, setNotifSocial] = useState(true);
  const [notifLeaderboard, setNotifLeaderboard] = useState(true);

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then((data) => {
      setUnitsWeight(data.units_weight);
      setUnitsHeight(data.units_height);
      setHideWeight(data.privacy_hide_weight);
      setShowPctOnly(data.privacy_show_percentage_only);
      setEmailDigest(data.notification_email_digest);
      setNotifAchievements(data.notification_achievements);
      setNotifSocial(data.notification_social);
      setNotifLeaderboard(data.notification_leaderboard);
      setLoading(false);
    });
  }, []);

  async function handleSave() {
    setSaving(true);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ units_weight: unitsWeight, units_height: unitsHeight, privacy_hide_weight: hideWeight, privacy_show_percentage_only: showPctOnly, notification_email_digest: emailDigest, notification_achievements: notifAchievements, notification_social: notifSocial, notification_leaderboard: notifLeaderboard }),
    });
    toast[res.ok ? "success" : "error"](res.ok ? "Settings saved" : "Failed to save");
    setSaving(false);
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      <Card><CardHeader><CardTitle>Units</CardTitle></CardHeader><CardContent className="space-y-4">
        <div className="flex items-center justify-between"><Label>Weight</Label><Select value={unitsWeight} onValueChange={(v) => v && setUnitsWeight(v)}><SelectTrigger className="w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="kg">Kilograms</SelectItem><SelectItem value="lbs">Pounds</SelectItem></SelectContent></Select></div>
        <div className="flex items-center justify-between"><Label>Height</Label><Select value={unitsHeight} onValueChange={(v) => v && setUnitsHeight(v)}><SelectTrigger className="w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="cm">Centimeters</SelectItem><SelectItem value="inches">Inches</SelectItem></SelectContent></Select></div>
      </CardContent></Card>
      <Card><CardHeader><CardTitle>Privacy</CardTitle></CardHeader><CardContent className="space-y-4">
        <div className="flex items-center justify-between"><div><Label>Hide Exact Weight</Label><p className="text-xs text-muted-foreground">Others see only relative changes</p></div><Switch checked={hideWeight} onCheckedChange={setHideWeight} /></div>
        <div className="flex items-center justify-between"><div><Label>Show Percentage Only</Label><p className="text-xs text-muted-foreground">Display progress as %</p></div><Switch checked={showPctOnly} onCheckedChange={setShowPctOnly} /></div>
      </CardContent></Card>
      <Card><CardHeader><CardTitle>Notifications</CardTitle></CardHeader><CardContent className="space-y-4">
        <div className="flex items-center justify-between"><Label>Weekly Email Digest</Label><Switch checked={emailDigest} onCheckedChange={setEmailDigest} /></div>
        <div className="flex items-center justify-between"><Label>Achievements</Label><Switch checked={notifAchievements} onCheckedChange={setNotifAchievements} /></div>
        <div className="flex items-center justify-between"><Label>Social</Label><Switch checked={notifSocial} onCheckedChange={setNotifSocial} /></div>
        <div className="flex items-center justify-between"><Label>Leaderboard</Label><Switch checked={notifLeaderboard} onCheckedChange={setNotifLeaderboard} /></div>
      </CardContent></Card>
      <Button onClick={handleSave} className="w-full" disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save Settings</Button>
    </div>
  );
}

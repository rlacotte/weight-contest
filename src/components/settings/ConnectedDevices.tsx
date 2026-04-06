"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Link2, Unlink, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Integration {
  provider: string;
  last_sync_at: string | null;
  sync_enabled: boolean;
  created_at: string;
}

export function ConnectedDevices() {
  const searchParams = useSearchParams();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  useEffect(() => {
    const withings = searchParams.get("withings");
    if (withings === "connected") {
      toast.success("Withings connected successfully", { description: "Your measurements are syncing..." });
    } else if (withings === "denied") {
      toast.error("Withings authorization denied");
    } else if (withings === "error") {
      toast.error("Withings connection failed");
    }
  }, [searchParams]);

  async function fetchStatus() {
    const res = await fetch("/api/health/status");
    const data = await res.json();
    setIntegrations(data);
    setLoading(false);
  }

  async function handleConnect() {
    window.location.href = "/api/health/withings/authorize";
  }

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await fetch("/api/health/withings/sync", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast.success("Sync complete", {
          description: `${data.imported} imported, ${data.skipped} already present`,
        });
        fetchStatus();
      } else {
        toast.error("Sync failed", { description: data.error });
      }
    } catch {
      toast.error("Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  async function handleDisconnect() {
    if (!confirm("Disconnect Withings? Your existing weigh-ins will be kept.")) return;
    setDisconnecting(true);
    try {
      const res = await fetch("/api/health/withings/disconnect", { method: "POST" });
      if (res.ok) {
        toast.success("Withings disconnected");
        fetchStatus();
      }
    } finally {
      setDisconnecting(false);
    }
  }

  const withings = integrations.find((i) => i.provider === "withings");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connected Devices</CardTitle>
        <CardDescription>Auto-sync your weigh-ins from smart scales</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-lg font-bold">
              W
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium">Withings</p>
                {withings && (
                  <Badge variant="outline" className="text-green-600 border-green-300">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {loading
                  ? "Loading..."
                  : withings
                  ? withings.last_sync_at
                    ? `Last sync: ${format(new Date(withings.last_sync_at), "MMM dd 'at' HH:mm")}`
                    : "Never synced"
                  : "Body+, Body Comp, Body Scan"}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {withings ? (
              <>
                <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
                  {syncing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
                <Button variant="outline" size="sm" onClick={handleDisconnect} disabled={disconnecting}>
                  <Unlink className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={handleConnect} disabled={loading}>
                <Link2 className="h-4 w-4 mr-1" />
                Connect
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

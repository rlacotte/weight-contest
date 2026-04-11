"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

export function CopyInviteButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className="border-purple-300 text-purple-600 hover:bg-purple-100"
    >
      {copied ? (
        <><Check className="h-4 w-4 mr-1" /> Copied</>
      ) : (
        <><Copy className="h-4 w-4 mr-1" /> Copy</>
      )}
    </Button>
  );
}

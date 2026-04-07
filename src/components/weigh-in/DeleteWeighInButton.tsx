"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function DeleteWeighInButton({ id }: { id: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("Voulez-vous vraiment supprimer cette pesée ?")) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/weigh-ins/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Erreur lors de la suppression");

      toast.success("Pesée supprimée");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Impossible de supprimer la pesée");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={handleDelete} 
      disabled={isDeleting}
      className="text-red-500 hover:text-red-700 hover:bg-red-100/50"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}

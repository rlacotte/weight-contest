"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Scale, Flame, Award, Target, UserIcon, Loader2 } from "lucide-react";
import type { profiles } from "@/generated/prisma/client";

export function EditProfileForm({ profile }: { profile: profiles }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile.full_name || "",
    height_cm: Number(profile.height_cm || 0),
    starting_weight: Number(profile.starting_weight || 0),
    goal_weight: Number(profile.goal_weight || 0),
    units_weight: profile.units_weight || "kg",
    units_height: profile.units_height || "cm",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Re-using the settings endpoint as it already handles profile updates
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Erreur lors de la mise à jour");

      toast.success("Profil mis à jour avec succès");
      router.push("/profile");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            Modifier le profil
          </CardTitle>
          <CardDescription>
            Mettez à jour vos informations de base et vos objectifs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Nom complet</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Unité de poids</Label>
              <Select
                value={formData.units_weight}
                onValueChange={(value) => setFormData({ ...formData, units_weight: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">Kilogrammes (kg)</SelectItem>
                  <SelectItem value="lbs">Livres (lbs)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Unité de taille</Label>
              <Select
                value={formData.units_height}
                onValueChange={(value) => setFormData({ ...formData, units_height: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cm">Centimètres (cm)</SelectItem>
                  <SelectItem value="inches">Pouces (in)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="height">Taille ({formData.units_height})</Label>
            <Input
              id="height"
              type="number"
              step="0.1"
              value={formData.height_cm}
              onChange={(e) => setFormData({ ...formData, height_cm: parseFloat(e.target.value) })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="starting_weight">Poids de départ ({formData.units_weight})</Label>
              <Input
                id="starting_weight"
                type="number"
                step="0.1"
                value={formData.starting_weight}
                onChange={(e) => setFormData({ ...formData, starting_weight: parseFloat(e.target.value) })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal_weight">Objectif de poids ({formData.units_weight})</Label>
              <Input
                id="goal_weight"
                type="number"
                step="0.1"
                value={formData.goal_weight}
                onChange={(e) => setFormData({ ...formData, goal_weight: parseFloat(e.target.value) })}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => router.back()}
          disabled={loading}
        >
          Annuler
        </Button>
        <Button type="submit" className="flex-1" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Enregistrer les modifications
        </Button>
      </div>
    </form>
  );
}

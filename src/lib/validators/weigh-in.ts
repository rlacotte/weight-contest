import { z } from "zod";

export const weighInSchema = z.object({
  weight: z.number().min(20).max(500),
  body_fat_pct: z.number().min(1).max(70).optional().nullable(),
  muscle_mass: z.number().min(10).max(200).optional().nullable(),
  water_pct: z.number().min(20).max(80).optional().nullable(),
  waist_cm: z.number().min(30).max(250).optional().nullable(),
  hip_cm: z.number().min(30).max(250).optional().nullable(),
  chest_cm: z.number().min(40).max(250).optional().nullable(),
  photo_url: z.string().url().optional().nullable(),
  photo_privacy: z.enum(["private", "contest_only", "public"]).default("private"),
  notes: z.string().max(500).optional().nullable(),
  source: z
    .enum(["manual", "withings", "fitbit", "garmin", "apple_health", "google_fit"])
    .default("manual"),
  weighed_at: z.string().datetime().optional(),
});

export type WeighInInput = z.infer<typeof weighInSchema>;

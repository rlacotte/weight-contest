import { z } from "zod";

export const onboardingSchema = z.object({
  full_name: z.string().min(2).max(100),
  height_cm: z.number().min(50).max(300),
  starting_weight: z.number().min(20).max(500),
  goal_weight: z.number().min(20).max(500),
  units_weight: z.enum(["kg", "lbs"]).default("kg"),
  units_height: z.enum(["cm", "inches"]).default("cm"),
  timezone: z.string().default("UTC"),
  date_of_birth: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
});

export const updateProfileSchema = onboardingSchema.partial().extend({
  avatar_url: z.string().url().optional().nullable(),
  privacy_hide_weight: z.boolean().optional(),
  privacy_show_percentage_only: z.boolean().optional(),
  notification_weigh_in_time: z.string().optional().nullable(),
  notification_email_digest: z.boolean().optional(),
  notification_achievements: z.boolean().optional(),
  notification_social: z.boolean().optional(),
  notification_leaderboard: z.boolean().optional(),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

import { z } from "zod";

export const createContestSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(1000).optional().nullable(),
  contest_type: z.enum(["weight_loss_pct", "absolute_weight_loss", "body_fat_pct", "custom"]),
  custom_metric_name: z.string().max(50).optional().nullable(),
  custom_metric_unit: z.string().max(20).optional().nullable(),
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  weigh_in_frequency: z.enum(["daily", "weekly", "biweekly"]).default("weekly"),
  weigh_in_day: z.number().min(0).max(6).optional().nullable(),
  rules: z.string().max(5000).optional().nullable(),
  is_public: z.boolean().default(false),
  max_members: z.number().min(2).max(100).optional().nullable(),
  entry_fee_cents: z.number().min(0).default(0),
  prize_distribution: z.enum(["winner_takes_all", "top_three", "proportional"]).default("winner_takes_all"),
  penalty_missed_weigh_in_cents: z.number().min(0).default(0),
  has_photo_proof: z.boolean().default(false),
  milestones: z
    .array(
      z.object({
        date: z.string(),
        label: z.string(),
        description: z.string().optional(),
      })
    )
    .optional()
    .default([]),
});

export const joinContestSchema = z.object({
  invite_code: z.string().min(6).max(20),
  starting_weight: z.number().min(20).max(500).optional(),
  starting_body_fat: z.number().min(1).max(70).optional().nullable(),
  goal_weight: z.number().min(20).max(500).optional().nullable(),
  team_name: z.string().max(50).optional().nullable(),
});

export type CreateContestInput = z.infer<typeof createContestSchema>;
export type JoinContestInput = z.infer<typeof joinContestSchema>;

export type WeightUnit = "kg" | "lbs";
export type HeightUnit = "cm" | "inches";
export type ContestType = "weight_loss_pct" | "absolute_weight_loss" | "body_fat_pct" | "custom";
export type ContestStatus = "draft" | "upcoming" | "active" | "completed" | "cancelled";
export type WeighInFrequency = "daily" | "weekly" | "biweekly";
export type MemberRole = "admin" | "member";
export type MemberStatus = "pending" | "approved" | "rejected" | "left";
export type PrizeDistribution = "winner_takes_all" | "top_three" | "proportional";
export type BetStatus = "pending" | "paid" | "refunded" | "forfeited" | "won";
export type AchievementCategory = "weigh_in" | "streak" | "progress" | "social" | "contest" | "special";
export type AchievementRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";
export type ActivityType = "weigh_in" | "milestone" | "achievement" | "streak" | "joined_contest" | "goal_reached" | "weekly_winner" | "photo_shared" | "comment" | "kudos";
export type Visibility = "private" | "contest" | "public";
export type PhotoPrivacy = "private" | "contest_only" | "public";
export type WeighInSource = "manual" | "withings" | "fitbit" | "garmin" | "apple_health" | "google_fit";
export type NotificationType = "weigh_in_reminder" | "leaderboard_change" | "achievement_earned" | "contest_milestone" | "social_interaction" | "contest_invite" | "weekly_digest" | "streak_warning" | "goal_reached" | "payment_received" | "penalty_applied";
export type HealthProvider = "withings" | "fitbit" | "garmin" | "apple_health" | "google_fit";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  height_cm: number | null;
  starting_weight: number | null;
  goal_weight: number | null;
  units_weight: WeightUnit;
  units_height: HeightUnit;
  date_of_birth: string | null;
  gender: string | null;
  timezone: string;
  onboarding_completed: boolean;
  xp_total: number;
  level: number;
  streak_current: number;
  streak_longest: number;
  streak_last_weigh_in: string | null;
  privacy_hide_weight: boolean;
  privacy_show_percentage_only: boolean;
  notification_weigh_in_time: string | null;
  notification_email_digest: boolean;
  notification_achievements: boolean;
  notification_social: boolean;
  notification_leaderboard: boolean;
  created_at: string;
  updated_at: string;
}

export interface Contest {
  id: string;
  creator_id: string;
  name: string;
  description: string | null;
  contest_type: ContestType;
  custom_metric_name: string | null;
  custom_metric_unit: string | null;
  start_date: string;
  end_date: string;
  weigh_in_frequency: WeighInFrequency;
  weigh_in_day: number | null;
  rules: string | null;
  invite_code: string;
  is_public: boolean;
  max_members: number | null;
  entry_fee_cents: number;
  prize_distribution: PrizeDistribution;
  penalty_missed_weigh_in_cents: number;
  has_photo_proof: boolean;
  status: ContestStatus;
  milestones: ContestMilestone[];
  created_at: string;
  updated_at: string;
}

export interface ContestMilestone {
  date: string;
  label: string;
  description?: string;
}

export interface ContestMember {
  id: string;
  contest_id: string;
  user_id: string;
  role: MemberRole;
  status: MemberStatus;
  starting_weight: number | null;
  starting_body_fat: number | null;
  goal_weight: number | null;
  team_name: string | null;
  joined_at: string;
  profile?: Profile;
}

export interface WeighIn {
  id: string;
  user_id: string;
  contest_id: string | null;
  weight: number;
  body_fat_pct: number | null;
  muscle_mass: number | null;
  water_pct: number | null;
  waist_cm: number | null;
  hip_cm: number | null;
  chest_cm: number | null;
  photo_url: string | null;
  photo_privacy: PhotoPrivacy;
  notes: string | null;
  source: WeighInSource;
  weighed_at: string;
  smoothed_weight: number | null;
  weight_change: number | null;
  total_change: number | null;
  total_change_pct: number | null;
  created_at: string;
}

export interface Achievement {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  xp_reward: number;
  rarity: AchievementRarity;
  condition: Record<string, unknown>;
  sort_order: number;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  contest_id: string | null;
  earned_at: string;
  achievement?: Achievement;
}

export interface ActivityFeedItem {
  id: string;
  user_id: string;
  contest_id: string | null;
  activity_type: ActivityType;
  data: Record<string, unknown>;
  visibility: Visibility;
  created_at: string;
  profile?: Profile;
  comments_count?: number;
  reactions_count?: number;
  user_reactions?: string[];
}

export interface Comment {
  id: string;
  user_id: string;
  activity_id: string;
  body: string;
  created_at: string;
  profile?: Profile;
}

export interface Reaction {
  id: string;
  user_id: string;
  activity_id: string;
  emoji: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  contest_id: string | null;
  is_group: boolean;
  name: string | null;
  created_at: string;
  updated_at: string;
  last_message?: Message;
  participants?: ConversationParticipant[];
  unread_count?: number;
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  last_read_at: string | null;
  profile?: Profile;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  profile?: Profile;
}

export interface ContestBet {
  id: string;
  contest_id: string;
  user_id: string;
  amount_cents: number;
  status: BetStatus;
  stripe_payment_intent_id: string | null;
  stripe_transfer_id: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

export interface HealthIntegration {
  id: string;
  user_id: string;
  provider: HealthProvider;
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string | null;
  last_sync_at: string | null;
  sync_enabled: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface WeeklyReport {
  id: string;
  user_id: string;
  contest_id: string | null;
  report_week: string;
  weight_start: number | null;
  weight_end: number | null;
  weight_change: number | null;
  weigh_in_count: number;
  streak_maintained: boolean;
  rank_in_contest: number | null;
  rank_change: number | null;
  ai_insights: string | null;
  ai_motivation: string | null;
  data: Record<string, unknown>;
  created_at: string;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  profile: Profile;
  metric_value: number;
  metric_label: string;
  index_value: number; // base 100 (starting weight = 100)
  index_label: string; // e.g. "95.2" means -4.8%
  last_weigh_in: string | null;
  streak: number;
  momentum: "up" | "down" | "flat";
  momentum_value: number;
}

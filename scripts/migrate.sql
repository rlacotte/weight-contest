-- Weight Contest - PostgreSQL Standard Schema (no Supabase)
-- Adapted for direct PostgreSQL deployment

-- ============================================
-- 1. USERS (auth - replaces Supabase auth.users)
-- ============================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  email_verified TIMESTAMPTZ,
  name TEXT,
  image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- NextAuth.js required tables
CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  UNIQUE(provider, provider_account_id)
);

CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_token TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  expires TIMESTAMPTZ NOT NULL
);

CREATE TABLE public.verification_tokens (
  identifier TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires TIMESTAMPTZ NOT NULL,
  UNIQUE(identifier, token)
);

-- ============================================
-- 2. PROFILES
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  height_cm NUMERIC,
  starting_weight NUMERIC,
  goal_weight NUMERIC,
  units_weight TEXT NOT NULL DEFAULT 'kg' CHECK (units_weight IN ('kg', 'lbs')),
  units_height TEXT NOT NULL DEFAULT 'cm' CHECK (units_height IN ('cm', 'inches')),
  date_of_birth DATE,
  gender TEXT,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  xp_total INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 0,
  streak_current INTEGER NOT NULL DEFAULT 0,
  streak_longest INTEGER NOT NULL DEFAULT 0,
  streak_last_weigh_in DATE,
  privacy_hide_weight BOOLEAN NOT NULL DEFAULT false,
  privacy_show_percentage_only BOOLEAN NOT NULL DEFAULT false,
  notification_weigh_in_time TIME,
  notification_email_digest BOOLEAN NOT NULL DEFAULT true,
  notification_achievements BOOLEAN NOT NULL DEFAULT true,
  notification_social BOOLEAN NOT NULL DEFAULT true,
  notification_leaderboard BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at();

-- ============================================
-- 3. CONTESTS
-- ============================================
CREATE TABLE public.contests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  contest_type TEXT NOT NULL DEFAULT 'weight_loss_pct'
    CHECK (contest_type IN ('weight_loss_pct', 'absolute_weight_loss', 'body_fat_pct', 'custom')),
  custom_metric_name TEXT,
  custom_metric_unit TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  weigh_in_frequency TEXT NOT NULL DEFAULT 'weekly'
    CHECK (weigh_in_frequency IN ('daily', 'weekly', 'biweekly')),
  weigh_in_day INTEGER CHECK (weigh_in_day >= 0 AND weigh_in_day <= 6),
  rules TEXT,
  invite_code TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
  is_public BOOLEAN NOT NULL DEFAULT false,
  max_members INTEGER,
  entry_fee_cents INTEGER NOT NULL DEFAULT 0,
  prize_distribution TEXT NOT NULL DEFAULT 'winner_takes_all'
    CHECK (prize_distribution IN ('winner_takes_all', 'top_three', 'proportional')),
  penalty_missed_weigh_in_cents INTEGER NOT NULL DEFAULT 0,
  has_photo_proof BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'upcoming', 'active', 'completed', 'cancelled')),
  milestones JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER contests_updated_at
  BEFORE UPDATE ON public.contests
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at();

CREATE INDEX idx_contests_creator ON public.contests(creator_id);
CREATE INDEX idx_contests_invite_code ON public.contests(invite_code);
CREATE INDEX idx_contests_status ON public.contests(status);

-- ============================================
-- 4. CONTEST_MEMBERS
-- ============================================
CREATE TABLE public.contest_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contest_id UUID NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'left')),
  starting_weight NUMERIC,
  starting_body_fat NUMERIC,
  goal_weight NUMERIC,
  team_name TEXT,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(contest_id, user_id)
);

CREATE INDEX idx_contest_members_contest ON public.contest_members(contest_id);
CREATE INDEX idx_contest_members_user ON public.contest_members(user_id);

-- ============================================
-- 5. WEIGH_INS
-- ============================================
CREATE TABLE public.weigh_ins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  contest_id UUID REFERENCES public.contests(id) ON DELETE SET NULL,
  weight NUMERIC NOT NULL,
  body_fat_pct NUMERIC,
  muscle_mass NUMERIC,
  water_pct NUMERIC,
  waist_cm NUMERIC,
  hip_cm NUMERIC,
  chest_cm NUMERIC,
  photo_url TEXT,
  photo_privacy TEXT NOT NULL DEFAULT 'private'
    CHECK (photo_privacy IN ('private', 'contest_only', 'public')),
  notes TEXT,
  source TEXT NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual', 'withings', 'fitbit', 'garmin', 'apple_health', 'google_fit')),
  weighed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  smoothed_weight NUMERIC,
  weight_change NUMERIC,
  total_change NUMERIC,
  total_change_pct NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_weigh_ins_user_date ON public.weigh_ins(user_id, weighed_at DESC);
CREATE INDEX idx_weigh_ins_contest ON public.weigh_ins(contest_id);

-- ============================================
-- 6. ACHIEVEMENTS
-- ============================================
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL
    CHECK (category IN ('weigh_in', 'streak', 'progress', 'social', 'contest', 'special')),
  xp_reward INTEGER NOT NULL DEFAULT 10,
  rarity TEXT NOT NULL DEFAULT 'common'
    CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  condition JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- ============================================
-- 7. USER_ACHIEVEMENTS
-- ============================================
CREATE TABLE public.user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  contest_id UUID REFERENCES public.contests(id) ON DELETE SET NULL,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user ON public.user_achievements(user_id);

-- ============================================
-- 8. ACTIVITY_FEED
-- ============================================
CREATE TABLE public.activity_feed (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  contest_id UUID REFERENCES public.contests(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL
    CHECK (activity_type IN ('weigh_in', 'milestone', 'achievement', 'streak', 'joined_contest', 'goal_reached', 'weekly_winner', 'photo_shared', 'comment', 'kudos')),
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  visibility TEXT NOT NULL DEFAULT 'contest'
    CHECK (visibility IN ('private', 'contest', 'public')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_feed_contest ON public.activity_feed(contest_id, created_at DESC);
CREATE INDEX idx_activity_feed_user ON public.activity_feed(user_id, created_at DESC);

-- ============================================
-- 9. COMMENTS
-- ============================================
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES public.activity_feed(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_comments_activity ON public.comments(activity_id, created_at);

-- ============================================
-- 10. REACTIONS
-- ============================================
CREATE TABLE public.reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES public.activity_feed(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, activity_id, emoji)
);

CREATE INDEX idx_reactions_activity ON public.reactions(activity_id);

-- ============================================
-- 11. CONVERSATIONS
-- ============================================
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contest_id UUID REFERENCES public.contests(id) ON DELETE SET NULL,
  is_group BOOLEAN NOT NULL DEFAULT false,
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at();

-- ============================================
-- 12. CONVERSATION_PARTICIPANTS
-- ============================================
CREATE TABLE public.conversation_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ,
  UNIQUE(conversation_id, user_id)
);

CREATE INDEX idx_conv_participants_user ON public.conversation_participants(user_id);

-- ============================================
-- 13. MESSAGES
-- ============================================
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_conversation ON public.messages(conversation_id, created_at DESC);

-- ============================================
-- 14. CONTEST_BETS
-- ============================================
CREATE TABLE public.contest_bets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contest_id UUID NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'refunded', 'forfeited', 'won')),
  stripe_payment_intent_id TEXT,
  stripe_transfer_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(contest_id, user_id)
);

-- ============================================
-- 15. NOTIFICATIONS
-- ============================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL
    CHECK (type IN ('weigh_in_reminder', 'leaderboard_change', 'achievement_earned', 'contest_milestone', 'social_interaction', 'contest_invite', 'weekly_digest', 'streak_warning', 'goal_reached', 'payment_received', 'penalty_applied')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id) WHERE read = false;

-- ============================================
-- 16. HEALTH_INTEGRATIONS
-- ============================================
CREATE TABLE public.health_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL
    CHECK (provider IN ('withings', 'fitbit', 'garmin', 'apple_health', 'google_fit')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  sync_enabled BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- ============================================
-- 17. WEEKLY_REPORTS
-- ============================================
CREATE TABLE public.weekly_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  contest_id UUID REFERENCES public.contests(id) ON DELETE SET NULL,
  report_week DATE NOT NULL,
  weight_start NUMERIC,
  weight_end NUMERIC,
  weight_change NUMERIC,
  weigh_in_count INTEGER NOT NULL DEFAULT 0,
  streak_maintained BOOLEAN NOT NULL DEFAULT false,
  rank_in_contest INTEGER,
  rank_change INTEGER,
  ai_insights TEXT,
  ai_motivation TEXT,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, contest_id, report_week)
);

CREATE INDEX idx_weekly_reports_user ON public.weekly_reports(user_id, report_week DESC);

-- ============================================
-- SEED ACHIEVEMENTS
-- ============================================
INSERT INTO public.achievements (slug, name, description, icon, category, xp_reward, rarity, condition, sort_order) VALUES
('first_weigh_in', 'First Step', 'Log your first weigh-in', '⚖️', 'weigh_in', 10, 'common', '{"type": "weigh_in_count", "value": 1}', 1),
('weigh_in_10', 'Consistent Tracker', 'Log 10 weigh-ins', '📊', 'weigh_in', 25, 'common', '{"type": "weigh_in_count", "value": 10}', 2),
('weigh_in_50', 'Data Driven', 'Log 50 weigh-ins', '📈', 'weigh_in', 50, 'uncommon', '{"type": "weigh_in_count", "value": 50}', 3),
('weigh_in_100', 'Century Club', 'Log 100 weigh-ins', '🏆', 'weigh_in', 100, 'rare', '{"type": "weigh_in_count", "value": 100}', 4),
('streak_7', 'Week Warrior', '7-day weigh-in streak', '🔥', 'streak', 25, 'common', '{"type": "streak", "value": 7}', 10),
('streak_14', 'Fortnight Focus', '14-day weigh-in streak', '🔥', 'streak', 50, 'uncommon', '{"type": "streak", "value": 14}', 11),
('streak_30', 'Monthly Master', '30-day weigh-in streak', '💎', 'streak', 100, 'rare', '{"type": "streak", "value": 30}', 12),
('streak_60', 'Iron Will', '60-day weigh-in streak', '👑', 'streak', 200, 'epic', '{"type": "streak", "value": 60}', 13),
('streak_100', 'Unstoppable', '100-day weigh-in streak', '🌟', 'streak', 500, 'epic', '{"type": "streak", "value": 100}', 14),
('streak_365', 'Year of Discipline', '365-day weigh-in streak', '⭐', 'streak', 1000, 'legendary', '{"type": "streak", "value": 365}', 15),
('lost_1pct', 'Getting Started', 'Lose 1% of body weight', '📉', 'progress', 15, 'common', '{"type": "total_loss_pct", "value": 1}', 20),
('lost_5pct', 'Noticeable Change', 'Lose 5% of body weight', '🎯', 'progress', 50, 'uncommon', '{"type": "total_loss_pct", "value": 5}', 21),
('lost_10pct', 'Transformation', 'Lose 10% of body weight', '🏅', 'progress', 100, 'rare', '{"type": "total_loss_pct", "value": 10}', 22),
('lost_15pct', 'Major Achievement', 'Lose 15% of body weight', '🏅', 'progress', 200, 'epic', '{"type": "total_loss_pct", "value": 15}', 23),
('halfway_to_goal', 'Halfway There', 'Reach halfway to your goal weight', '🎪', 'progress', 75, 'uncommon', '{"type": "halfway_to_goal", "value": true}', 24),
('goal_reached', 'Goal Crusher', 'Reach your goal weight', '🏆', 'progress', 500, 'epic', '{"type": "goal_reached", "value": true}', 25),
('first_comment', 'Conversation Starter', 'Leave your first comment', '💬', 'social', 10, 'common', '{"type": "comment_count", "value": 1}', 30),
('first_reaction', 'Supporter', 'Give your first reaction', '👍', 'social', 5, 'common', '{"type": "reaction_count", "value": 1}', 31),
('encourager_10', 'Cheerleader', 'Give 10 reactions to others', '🤝', 'social', 25, 'uncommon', '{"type": "reaction_count", "value": 10}', 32),
('encourager_50', 'Motivator', 'Give 50 reactions to others', '🤝', 'social', 50, 'rare', '{"type": "reaction_count", "value": 50}', 33),
('popular_post', 'Popular', 'Get 5 reactions on a single activity', '⭐', 'social', 25, 'uncommon', '{"type": "reactions_on_single", "value": 5}', 34),
('first_contest', 'Challenger', 'Join your first contest', '🏁', 'contest', 15, 'common', '{"type": "contest_count", "value": 1}', 40),
('contest_completed', 'Finisher', 'Complete a full contest', '✅', 'contest', 50, 'uncommon', '{"type": "contest_completed", "value": 1}', 41),
('weekly_winner', 'Weekly Champion', 'Win a weekly weigh-in', '🏅', 'contest', 30, 'uncommon', '{"type": "weekly_wins", "value": 1}', 42),
('podium_finish', 'Podium', 'Finish in the top 3 of a contest', '🥉', 'contest', 75, 'rare', '{"type": "podium_finishes", "value": 1}', 43),
('contest_winner', 'Champion', 'Win a contest', '🥇', 'contest', 200, 'epic', '{"type": "contest_wins", "value": 1}', 44),
('multi_contest', 'Serial Competitor', 'Join 5 contests', '🏁', 'contest', 50, 'rare', '{"type": "contest_count", "value": 5}', 45),
('early_adopter', 'Early Adopter', 'One of the first 100 users', '🚀', 'special', 100, 'legendary', '{"type": "early_adopter", "value": 100}', 50),
('comeback_kid', 'Comeback Kid', 'Resume a streak after missing 3+ days', '💪', 'special', 25, 'uncommon', '{"type": "comeback", "value": 3}', 51),
('photo_warrior', 'Picture Perfect', 'Upload 10 progress photos', '📸', 'special', 30, 'uncommon', '{"type": "photo_count", "value": 10}', 52);

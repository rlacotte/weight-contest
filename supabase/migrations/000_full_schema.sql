-- Weight Contest Full Schema
-- 15+ tables with RLS policies

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- ============================================
-- 1. PROFILES (extends auth.users)
-- ============================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  height_cm numeric,
  starting_weight numeric,
  goal_weight numeric,
  units_weight text not null default 'kg' check (units_weight in ('kg', 'lbs')),
  units_height text not null default 'cm' check (units_height in ('cm', 'inches')),
  date_of_birth date,
  gender text,
  timezone text not null default 'UTC',
  onboarding_completed boolean not null default false,
  xp_total integer not null default 0,
  level integer not null default 0,
  streak_current integer not null default 0,
  streak_longest integer not null default 0,
  streak_last_weigh_in date,
  privacy_hide_weight boolean not null default false,
  privacy_show_percentage_only boolean not null default false,
  notification_weigh_in_time time,
  notification_email_digest boolean not null default true,
  notification_achievements boolean not null default true,
  notification_social boolean not null default true,
  notification_leaderboard boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create profile on auth.users insert
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-update updated_at
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.update_updated_at();

-- RLS
alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- ============================================
-- 2. CONTESTS
-- ============================================
create table public.contests (
  id uuid primary key default uuid_generate_v4(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  contest_type text not null default 'weight_loss_pct'
    check (contest_type in ('weight_loss_pct', 'absolute_weight_loss', 'body_fat_pct', 'custom')),
  custom_metric_name text,
  custom_metric_unit text,
  start_date timestamptz not null,
  end_date timestamptz not null,
  weigh_in_frequency text not null default 'weekly'
    check (weigh_in_frequency in ('daily', 'weekly', 'biweekly')),
  weigh_in_day integer check (weigh_in_day >= 0 and weigh_in_day <= 6),
  rules text,
  invite_code text not null unique default encode(gen_random_bytes(6), 'hex'),
  is_public boolean not null default false,
  max_members integer,
  entry_fee_cents integer not null default 0,
  prize_distribution text not null default 'winner_takes_all'
    check (prize_distribution in ('winner_takes_all', 'top_three', 'proportional')),
  penalty_missed_weigh_in_cents integer not null default 0,
  has_photo_proof boolean not null default false,
  status text not null default 'draft'
    check (status in ('draft', 'upcoming', 'active', 'completed', 'cancelled')),
  milestones jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger contests_updated_at
  before update on public.contests
  for each row execute procedure public.update_updated_at();

create index idx_contests_creator on public.contests(creator_id);
create index idx_contests_invite_code on public.contests(invite_code);
create index idx_contests_status on public.contests(status);

alter table public.contests enable row level security;

create policy "Contests viewable by members or if public"
  on public.contests for select using (
    is_public = true
    or creator_id = auth.uid()
    or exists (
      select 1 from public.contest_members
      where contest_members.contest_id = contests.id
        and contest_members.user_id = auth.uid()
        and contest_members.status = 'approved'
    )
  );

create policy "Users can create contests"
  on public.contests for insert with check (creator_id = auth.uid());

create policy "Creator can update contest"
  on public.contests for update using (creator_id = auth.uid());

-- ============================================
-- 3. CONTEST_MEMBERS
-- ============================================
create table public.contest_members (
  id uuid primary key default uuid_generate_v4(),
  contest_id uuid not null references public.contests(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('admin', 'member')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'left')),
  starting_weight numeric,
  starting_body_fat numeric,
  goal_weight numeric,
  team_name text,
  joined_at timestamptz not null default now(),
  unique(contest_id, user_id)
);

create index idx_contest_members_contest on public.contest_members(contest_id);
create index idx_contest_members_user on public.contest_members(user_id);

alter table public.contest_members enable row level security;

create policy "Members viewable by fellow approved members"
  on public.contest_members for select using (
    user_id = auth.uid()
    or exists (
      select 1 from public.contest_members cm
      where cm.contest_id = contest_members.contest_id
        and cm.user_id = auth.uid()
        and cm.status = 'approved'
    )
  );

create policy "Users can join contests"
  on public.contest_members for insert with check (user_id = auth.uid());

create policy "Admins can update members"
  on public.contest_members for update using (
    user_id = auth.uid()
    or exists (
      select 1 from public.contest_members cm
      where cm.contest_id = contest_members.contest_id
        and cm.user_id = auth.uid()
        and cm.role = 'admin'
    )
  );

-- ============================================
-- 4. WEIGH_INS
-- ============================================
create table public.weigh_ins (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  contest_id uuid references public.contests(id) on delete set null,
  weight numeric not null,
  body_fat_pct numeric,
  muscle_mass numeric,
  water_pct numeric,
  waist_cm numeric,
  hip_cm numeric,
  chest_cm numeric,
  photo_url text,
  photo_privacy text not null default 'private'
    check (photo_privacy in ('private', 'contest_only', 'public')),
  notes text,
  source text not null default 'manual'
    check (source in ('manual', 'withings', 'fitbit', 'garmin', 'apple_health', 'google_fit')),
  weighed_at timestamptz not null default now(),
  smoothed_weight numeric,
  weight_change numeric,
  total_change numeric,
  total_change_pct numeric,
  created_at timestamptz not null default now()
);

create index idx_weigh_ins_user_date on public.weigh_ins(user_id, weighed_at desc);
create index idx_weigh_ins_contest on public.weigh_ins(contest_id);

alter table public.weigh_ins enable row level security;

create policy "Users can manage own weigh-ins"
  on public.weigh_ins for all using (user_id = auth.uid());

create policy "Contest members can view weigh-ins"
  on public.weigh_ins for select using (
    contest_id is not null
    and exists (
      select 1 from public.contest_members
      where contest_members.contest_id = weigh_ins.contest_id
        and contest_members.user_id = auth.uid()
        and contest_members.status = 'approved'
    )
  );

-- ============================================
-- 5. ACHIEVEMENTS
-- ============================================
create table public.achievements (
  id uuid primary key default uuid_generate_v4(),
  slug text not null unique,
  name text not null,
  description text not null,
  icon text not null,
  category text not null
    check (category in ('weigh_in', 'streak', 'progress', 'social', 'contest', 'special')),
  xp_reward integer not null default 10,
  rarity text not null default 'common'
    check (rarity in ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  condition jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0
);

alter table public.achievements enable row level security;

create policy "Achievements are viewable by everyone"
  on public.achievements for select using (true);

-- ============================================
-- 6. USER_ACHIEVEMENTS
-- ============================================
create table public.user_achievements (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  contest_id uuid references public.contests(id) on delete set null,
  earned_at timestamptz not null default now(),
  unique(user_id, achievement_id)
);

create index idx_user_achievements_user on public.user_achievements(user_id);

alter table public.user_achievements enable row level security;

create policy "User achievements viewable by everyone"
  on public.user_achievements for select using (true);

create policy "System can insert achievements"
  on public.user_achievements for insert with check (user_id = auth.uid());

-- ============================================
-- 7. ACTIVITY_FEED
-- ============================================
create table public.activity_feed (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  contest_id uuid references public.contests(id) on delete cascade,
  activity_type text not null
    check (activity_type in ('weigh_in', 'milestone', 'achievement', 'streak', 'joined_contest', 'goal_reached', 'weekly_winner', 'photo_shared', 'comment', 'kudos')),
  data jsonb not null default '{}'::jsonb,
  visibility text not null default 'contest'
    check (visibility in ('private', 'contest', 'public')),
  created_at timestamptz not null default now()
);

create index idx_activity_feed_contest on public.activity_feed(contest_id, created_at desc);
create index idx_activity_feed_user on public.activity_feed(user_id, created_at desc);

alter table public.activity_feed enable row level security;

create policy "Activity visible based on visibility"
  on public.activity_feed for select using (
    visibility = 'public'
    or user_id = auth.uid()
    or (
      visibility = 'contest'
      and exists (
        select 1 from public.contest_members
        where contest_members.contest_id = activity_feed.contest_id
          and contest_members.user_id = auth.uid()
          and contest_members.status = 'approved'
      )
    )
  );

create policy "Users can create own activities"
  on public.activity_feed for insert with check (user_id = auth.uid());

-- ============================================
-- 8. COMMENTS
-- ============================================
create table public.comments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  activity_id uuid not null references public.activity_feed(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index idx_comments_activity on public.comments(activity_id, created_at);

alter table public.comments enable row level security;

create policy "Comments viewable if activity is viewable"
  on public.comments for select using (
    exists (
      select 1 from public.activity_feed af
      where af.id = comments.activity_id
        and (
          af.visibility = 'public'
          or af.user_id = auth.uid()
          or (
            af.visibility = 'contest'
            and exists (
              select 1 from public.contest_members
              where contest_members.contest_id = af.contest_id
                and contest_members.user_id = auth.uid()
                and contest_members.status = 'approved'
            )
          )
        )
    )
  );

create policy "Users can create comments"
  on public.comments for insert with check (user_id = auth.uid());

create policy "Users can delete own comments"
  on public.comments for delete using (user_id = auth.uid());

-- ============================================
-- 9. REACTIONS
-- ============================================
create table public.reactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  activity_id uuid not null references public.activity_feed(id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  unique(user_id, activity_id, emoji)
);

create index idx_reactions_activity on public.reactions(activity_id);

alter table public.reactions enable row level security;

create policy "Reactions viewable if activity is viewable"
  on public.reactions for select using (
    exists (
      select 1 from public.activity_feed af
      where af.id = reactions.activity_id
        and (
          af.visibility = 'public'
          or af.user_id = auth.uid()
          or (
            af.visibility = 'contest'
            and exists (
              select 1 from public.contest_members
              where contest_members.contest_id = af.contest_id
                and contest_members.user_id = auth.uid()
                and contest_members.status = 'approved'
            )
          )
        )
    )
  );

create policy "Users can toggle reactions"
  on public.reactions for insert with check (user_id = auth.uid());

create policy "Users can remove own reactions"
  on public.reactions for delete using (user_id = auth.uid());

-- ============================================
-- 10. CONVERSATIONS
-- ============================================
create table public.conversations (
  id uuid primary key default uuid_generate_v4(),
  contest_id uuid references public.contests(id) on delete set null,
  is_group boolean not null default false,
  name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger conversations_updated_at
  before update on public.conversations
  for each row execute procedure public.update_updated_at();

-- ============================================
-- 11. CONVERSATION_PARTICIPANTS
-- ============================================
create table public.conversation_participants (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  last_read_at timestamptz,
  unique(conversation_id, user_id)
);

create index idx_conv_participants_user on public.conversation_participants(user_id);

alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;

create policy "Conversations viewable by participants"
  on public.conversations for select using (
    exists (
      select 1 from public.conversation_participants
      where conversation_participants.conversation_id = conversations.id
        and conversation_participants.user_id = auth.uid()
    )
  );

create policy "Participants viewable by fellow participants"
  on public.conversation_participants for select using (
    exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = conversation_participants.conversation_id
        and cp.user_id = auth.uid()
    )
  );

-- ============================================
-- 12. MESSAGES
-- ============================================
create table public.messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index idx_messages_conversation on public.messages(conversation_id, created_at desc);

alter table public.messages enable row level security;

create policy "Messages viewable by conversation participants"
  on public.messages for select using (
    exists (
      select 1 from public.conversation_participants
      where conversation_participants.conversation_id = messages.conversation_id
        and conversation_participants.user_id = auth.uid()
    )
  );

create policy "Participants can send messages"
  on public.messages for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversation_participants
      where conversation_participants.conversation_id = messages.conversation_id
        and conversation_participants.user_id = auth.uid()
    )
  );

-- ============================================
-- 13. CONTEST_BETS
-- ============================================
create table public.contest_bets (
  id uuid primary key default uuid_generate_v4(),
  contest_id uuid not null references public.contests(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount_cents integer not null,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'refunded', 'forfeited', 'won')),
  stripe_payment_intent_id text,
  stripe_transfer_id text,
  created_at timestamptz not null default now(),
  unique(contest_id, user_id)
);

alter table public.contest_bets enable row level security;

create policy "Bets viewable by self and contest admin"
  on public.contest_bets for select using (
    user_id = auth.uid()
    or exists (
      select 1 from public.contest_members
      where contest_members.contest_id = contest_bets.contest_id
        and contest_members.user_id = auth.uid()
        and contest_members.role = 'admin'
    )
  );

create policy "Users can create own bets"
  on public.contest_bets for insert with check (user_id = auth.uid());

-- ============================================
-- 14. NOTIFICATIONS
-- ============================================
create table public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null
    check (type in ('weigh_in_reminder', 'leaderboard_change', 'achievement_earned', 'contest_milestone', 'social_interaction', 'contest_invite', 'weekly_digest', 'streak_warning', 'goal_reached', 'payment_received', 'penalty_applied')),
  title text not null,
  body text not null,
  data jsonb not null default '{}'::jsonb,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_notifications_user on public.notifications(user_id, created_at desc);
create index idx_notifications_unread on public.notifications(user_id) where read = false;

alter table public.notifications enable row level security;

create policy "Users can view own notifications"
  on public.notifications for select using (user_id = auth.uid());

create policy "Users can update own notifications"
  on public.notifications for update using (user_id = auth.uid());

-- ============================================
-- 15. HEALTH_INTEGRATIONS
-- ============================================
create table public.health_integrations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null
    check (provider in ('withings', 'fitbit', 'garmin', 'apple_health', 'google_fit')),
  access_token text not null,
  refresh_token text,
  token_expires_at timestamptz,
  last_sync_at timestamptz,
  sync_enabled boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(user_id, provider)
);

alter table public.health_integrations enable row level security;

create policy "Users can manage own integrations"
  on public.health_integrations for all using (user_id = auth.uid());

-- ============================================
-- 16. WEEKLY_REPORTS
-- ============================================
create table public.weekly_reports (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  contest_id uuid references public.contests(id) on delete set null,
  report_week date not null,
  weight_start numeric,
  weight_end numeric,
  weight_change numeric,
  weigh_in_count integer not null default 0,
  streak_maintained boolean not null default false,
  rank_in_contest integer,
  rank_change integer,
  ai_insights text,
  ai_motivation text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(user_id, contest_id, report_week)
);

create index idx_weekly_reports_user on public.weekly_reports(user_id, report_week desc);

alter table public.weekly_reports enable row level security;

create policy "Users can view own reports"
  on public.weekly_reports for select using (user_id = auth.uid());

-- ============================================
-- STORAGE BUCKETS
-- ============================================
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);
insert into storage.buckets (id, name, public) values ('weigh-in-photos', 'weigh-in-photos', false);

create policy "Avatar images are publicly accessible"
  on storage.objects for select using (bucket_id = 'avatars');

create policy "Users can upload own avatar"
  on storage.objects for insert with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update own avatar"
  on storage.objects for update using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can upload weigh-in photos"
  on storage.objects for insert with check (
    bucket_id = 'weigh-in-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can view own weigh-in photos"
  on storage.objects for select using (
    bucket_id = 'weigh-in-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================
-- REALTIME PUBLICATIONS
-- ============================================
alter publication supabase_realtime add table public.weigh_ins;
alter publication supabase_realtime add table public.activity_feed;
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.reactions;

-- Seed achievements (~30 badges across 6 categories)

insert into public.achievements (slug, name, description, icon, category, xp_reward, rarity, condition, sort_order) values
-- Weigh-in category
('first_weigh_in', 'First Step', 'Log your first weigh-in', '⚖️', 'weigh_in', 10, 'common', '{"type": "weigh_in_count", "value": 1}', 1),
('weigh_in_10', 'Consistent Tracker', 'Log 10 weigh-ins', '📊', 'weigh_in', 25, 'common', '{"type": "weigh_in_count", "value": 10}', 2),
('weigh_in_50', 'Data Driven', 'Log 50 weigh-ins', '📈', 'weigh_in', 50, 'uncommon', '{"type": "weigh_in_count", "value": 50}', 3),
('weigh_in_100', 'Century Club', 'Log 100 weigh-ins', '🏆', 'weigh_in', 100, 'rare', '{"type": "weigh_in_count", "value": 100}', 4),

-- Streak category
('streak_7', 'Week Warrior', '7-day weigh-in streak', '🔥', 'streak', 25, 'common', '{"type": "streak", "value": 7}', 10),
('streak_14', 'Fortnight Focus', '14-day weigh-in streak', '🔥', 'streak', 50, 'uncommon', '{"type": "streak", "value": 14}', 11),
('streak_30', 'Monthly Master', '30-day weigh-in streak', '💎', 'streak', 100, 'rare', '{"type": "streak", "value": 30}', 12),
('streak_60', 'Iron Will', '60-day weigh-in streak', '👑', 'streak', 200, 'epic', '{"type": "streak", "value": 60}', 13),
('streak_100', 'Unstoppable', '100-day weigh-in streak', '🌟', 'streak', 500, 'epic', '{"type": "streak", "value": 100}', 14),
('streak_365', 'Year of Discipline', '365-day weigh-in streak', '⭐', 'streak', 1000, 'legendary', '{"type": "streak", "value": 365}', 15),

-- Progress category
('lost_1pct', 'Getting Started', 'Lose 1% of body weight', '📉', 'progress', 15, 'common', '{"type": "total_loss_pct", "value": 1}', 20),
('lost_5pct', 'Noticeable Change', 'Lose 5% of body weight', '🎯', 'progress', 50, 'uncommon', '{"type": "total_loss_pct", "value": 5}', 21),
('lost_10pct', 'Transformation', 'Lose 10% of body weight', '🏅', 'progress', 100, 'rare', '{"type": "total_loss_pct", "value": 10}', 22),
('lost_15pct', 'Major Achievement', 'Lose 15% of body weight', '🏅', 'progress', 200, 'epic', '{"type": "total_loss_pct", "value": 15}', 23),
('halfway_to_goal', 'Halfway There', 'Reach halfway to your goal weight', '🎪', 'progress', 75, 'uncommon', '{"type": "halfway_to_goal", "value": true}', 24),
('goal_reached', 'Goal Crusher', 'Reach your goal weight', '🏆', 'progress', 500, 'epic', '{"type": "goal_reached", "value": true}', 25),

-- Social category
('first_comment', 'Conversation Starter', 'Leave your first comment', '💬', 'social', 10, 'common', '{"type": "comment_count", "value": 1}', 30),
('first_reaction', 'Supporter', 'Give your first reaction', '👍', 'social', 5, 'common', '{"type": "reaction_count", "value": 1}', 31),
('encourager_10', 'Cheerleader', 'Give 10 reactions to others', '🤝', 'social', 25, 'uncommon', '{"type": "reaction_count", "value": 10}', 32),
('encourager_50', 'Motivator', 'Give 50 reactions to others', '🤝', 'social', 50, 'rare', '{"type": "reaction_count", "value": 50}', 33),
('popular_post', 'Popular', 'Get 5 reactions on a single activity', '⭐', 'social', 25, 'uncommon', '{"type": "reactions_on_single", "value": 5}', 34),

-- Contest category
('first_contest', 'Challenger', 'Join your first contest', '🏁', 'contest', 15, 'common', '{"type": "contest_count", "value": 1}', 40),
('contest_completed', 'Finisher', 'Complete a full contest', '✅', 'contest', 50, 'uncommon', '{"type": "contest_completed", "value": 1}', 41),
('weekly_winner', 'Weekly Champion', 'Win a weekly weigh-in', '🏅', 'contest', 30, 'uncommon', '{"type": "weekly_wins", "value": 1}', 42),
('podium_finish', 'Podium', 'Finish in the top 3 of a contest', '🥉', 'contest', 75, 'rare', '{"type": "podium_finishes", "value": 1}', 43),
('contest_winner', 'Champion', 'Win a contest', '🥇', 'contest', 200, 'epic', '{"type": "contest_wins", "value": 1}', 44),
('multi_contest', 'Serial Competitor', 'Join 5 contests', '🏁', 'contest', 50, 'rare', '{"type": "contest_count", "value": 5}', 45),

-- Special category
('early_adopter', 'Early Adopter', 'One of the first 100 users', '🚀', 'special', 100, 'legendary', '{"type": "early_adopter", "value": 100}', 50),
('comeback_kid', 'Comeback Kid', 'Resume a streak after missing 3+ days', '💪', 'special', 25, 'uncommon', '{"type": "comeback", "value": 3}', 51),
('photo_warrior', 'Picture Perfect', 'Upload 10 progress photos', '📸', 'special', 30, 'uncommon', '{"type": "photo_count", "value": 10}', 52);

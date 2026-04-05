export const XP_LEVELS = [
  0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 12000, 17000, 23000, 30000, 40000, 55000,
];

export const XP_REWARDS = {
  weigh_in: 5,
  streak_day: 2,
  comment: 3,
  reaction: 1,
  photo_upload: 5,
  contest_join: 10,
} as const;

export function calculateLevel(totalXp: number): {
  level: number;
  currentXp: number;
  nextLevelXp: number;
  progress: number;
} {
  let level = 0;
  for (let i = 0; i < XP_LEVELS.length; i++) {
    if (totalXp >= XP_LEVELS[i]) {
      level = i;
    } else {
      break;
    }
  }

  const currentLevelXp = XP_LEVELS[level] || 0;
  const nextLevelXp = XP_LEVELS[level + 1] || XP_LEVELS[XP_LEVELS.length - 1] * 1.5;
  const xpInLevel = totalXp - currentLevelXp;
  const xpNeeded = nextLevelXp - currentLevelXp;

  return {
    level,
    currentXp: xpInLevel,
    nextLevelXp: xpNeeded,
    progress: xpNeeded > 0 ? (xpInLevel / xpNeeded) * 100 : 100,
  };
}

export const REACTION_EMOJIS = [
  { emoji: "💪", label: "Strong" },
  { emoji: "🔥", label: "Fire" },
  { emoji: "👏", label: "Clap" },
  { emoji: "❤️", label: "Heart" },
  { emoji: "🎉", label: "Party" },
] as const;

export const ACHIEVEMENT_ICONS: Record<string, string> = {
  first_weigh_in: "⚖️",
  weigh_in_10: "📊",
  weigh_in_50: "📈",
  weigh_in_100: "🏆",
  streak_7: "🔥",
  streak_14: "🔥🔥",
  streak_30: "💎",
  streak_60: "👑",
  streak_100: "🌟",
  streak_365: "⭐",
  lost_1pct: "📉",
  lost_5pct: "🎯",
  lost_10pct: "🏅",
  halfway_to_goal: "🎪",
  goal_reached: "🏆",
  first_comment: "💬",
  first_reaction: "👍",
  encourager_10: "🤝",
  popular_post: "⭐",
  first_contest: "🏁",
  contest_winner: "🥇",
  weekly_winner: "🏅",
  podium_finish: "🥉",
  contest_completed: "✅",
  early_adopter: "🚀",
  comeback_kid: "💪",
};

import type { Achievement } from "@/types/database";
import { prisma } from "@/lib/prisma";

interface UserStats {
  weighInCount: number;
  streak: number;
  totalLossPct: number;
  halfwayToGoal: boolean;
  goalReached: boolean;
  commentCount: number;
  reactionCount: number;
  contestCount: number;
  photoCount: number;
  profileCount: number;
}

export async function checkAndAwardAchievements(userId: string): Promise<Achievement[]> {
  const [achievements, earned] = await Promise.all([
    prisma.achievements.findMany(),
    prisma.user_achievements.findMany({ where: { user_id: userId }, select: { achievement_id: true } }),
  ]);

  const earnedIds = new Set(earned.map((e) => e.achievement_id));
  const unearnedAchievements = achievements.filter((a) => !earnedIds.has(a.id));
  if (unearnedAchievements.length === 0) return [];

  const stats = await gatherUserStats(userId);
  const newlyEarned: Achievement[] = [];

  for (const achievement of unearnedAchievements) {
    if (evaluateCondition(achievement.condition as Record<string, unknown>, stats)) {
      await prisma.user_achievements.create({
        data: { user_id: userId, achievement_id: achievement.id },
      });

      // Add XP
      const currentProfile = await prisma.profiles.findUnique({
        where: { user_id: userId },
        select: { xp_total: true },
      });
      if (currentProfile) {
        const newXp = (currentProfile.xp_total || 0) + achievement.xp_reward;
        await prisma.profiles.update({
          where: { user_id: userId },
          data: { xp_total: newXp, level: calculateLevelFromXp(newXp) },
        });
      }

      await prisma.notifications.create({
        data: {
          user_id: userId,
          type: "achievement_earned",
          title: `Achievement Unlocked: ${achievement.name}`,
          body: achievement.description,
          data: { achievement_id: achievement.id, icon: achievement.icon },
        },
      });

      await prisma.activity_feed.create({
        data: {
          user_id: userId,
          activity_type: "achievement",
          data: { achievement_name: achievement.name, achievement_icon: achievement.icon, achievement_rarity: achievement.rarity },
          visibility: "contest",
        },
      });

      newlyEarned.push(achievement as unknown as Achievement);
    }
  }

  return newlyEarned;
}

async function gatherUserStats(userId: string): Promise<UserStats> {
  const [weighInCount, profile, commentCount, reactionCount, contestCount, photoCount, profileCount] = await Promise.all([
    prisma.weigh_ins.count({ where: { user_id: userId } }),
    prisma.profiles.findUnique({ where: { user_id: userId } }),
    prisma.comments.count({ where: { user_id: userId } }),
    prisma.reactions.count({ where: { user_id: userId } }),
    prisma.contest_members.count({ where: { user_id: userId, status: "approved" } }),
    prisma.weigh_ins.count({ where: { user_id: userId, NOT: { photo_url: null } } }),
    prisma.profiles.count(),
  ]);

  const startingWeight = profile?.starting_weight ? Number(profile.starting_weight) : 0;
  const goalWeight = profile?.goal_weight ? Number(profile.goal_weight) : 0;

  const latestWeighIn = await prisma.weigh_ins.findFirst({
    where: { user_id: userId },
    orderBy: { weighed_at: "desc" },
    select: { weight: true },
  });

  const currentWeight = latestWeighIn ? Number(latestWeighIn.weight) : startingWeight;
  const totalLossPct = startingWeight > 0 ? ((startingWeight - currentWeight) / startingWeight) * 100 : 0;
  const totalToLose = startingWeight - goalWeight;
  const totalLost = startingWeight - currentWeight;

  return {
    weighInCount,
    streak: profile?.streak_current ?? 0,
    totalLossPct,
    halfwayToGoal: totalToLose > 0 && totalLost >= totalToLose / 2,
    goalReached: goalWeight > 0 && currentWeight <= goalWeight,
    commentCount,
    reactionCount,
    contestCount,
    photoCount,
    profileCount,
  };
}

function evaluateCondition(condition: Record<string, unknown>, stats: UserStats): boolean {
  const type = condition.type as string;
  const value = condition.value as number | boolean;

  switch (type) {
    case "weigh_in_count": return stats.weighInCount >= (value as number);
    case "streak": return stats.streak >= (value as number);
    case "total_loss_pct": return stats.totalLossPct >= (value as number);
    case "halfway_to_goal": return stats.halfwayToGoal;
    case "goal_reached": return stats.goalReached;
    case "comment_count": return stats.commentCount >= (value as number);
    case "reaction_count": return stats.reactionCount >= (value as number);
    case "contest_count": return stats.contestCount >= (value as number);
    case "photo_count": return stats.photoCount >= (value as number);
    case "early_adopter": return stats.profileCount <= (value as number);
    default: return false;
  }
}

function calculateLevelFromXp(xp: number): number {
  const levels = [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 12000, 17000, 23000, 30000];
  let level = 0;
  for (let i = 0; i < levels.length; i++) {
    if (xp >= levels[i]) level = i;
    else break;
  }
  return level;
}

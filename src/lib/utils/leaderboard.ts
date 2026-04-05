import type { ContestType, ContestMember, WeighIn, LeaderboardEntry, Profile } from "@/types/database";
import { calculateMomentum } from "./trend";

interface MemberWithWeighIns {
  member: ContestMember;
  profile: Profile;
  weighIns: WeighIn[];
  latestWeight: number | null;
}

export function calculateRankings(
  membersData: MemberWithWeighIns[],
  contestType: ContestType,
  customMetricName?: string | null
): LeaderboardEntry[] {
  const entries: LeaderboardEntry[] = membersData
    .filter((m) => m.member.status === "approved" && m.member.starting_weight && m.latestWeight)
    .map((m) => {
      const startWeight = m.member.starting_weight!;
      const currentWeight = m.latestWeight!;
      let metricValue: number;
      let metricLabel: string;

      switch (contestType) {
        case "weight_loss_pct":
          metricValue = ((startWeight - currentWeight) / startWeight) * 100;
          metricLabel = `${metricValue.toFixed(1)}%`;
          break;
        case "absolute_weight_loss":
          metricValue = startWeight - currentWeight;
          metricLabel = `${metricValue.toFixed(1)} kg`;
          break;
        case "body_fat_pct":
          metricValue =
            (m.member.starting_body_fat ?? 0) -
            (m.weighIns[0]?.body_fat_pct ?? m.member.starting_body_fat ?? 0);
          metricLabel = `${metricValue.toFixed(1)}%`;
          break;
        case "custom":
          metricValue = startWeight - currentWeight;
          metricLabel = `${metricValue.toFixed(1)} ${customMetricName ?? ""}`;
          break;
        default:
          metricValue = 0;
          metricLabel = "N/A";
      }

      const momentum = calculateMomentum(m.weighIns);
      const trendPoints = m.weighIns.slice(-7);
      const momentumValue =
        trendPoints.length >= 2
          ? trendPoints[trendPoints.length - 1].weight - trendPoints[0].weight
          : 0;

      return {
        rank: 0,
        user_id: m.member.user_id,
        profile: m.profile,
        metric_value: metricValue,
        metric_label: metricLabel,
        last_weigh_in: m.weighIns[0]?.weighed_at ?? null,
        streak: m.profile.streak_current,
        momentum,
        momentum_value: momentumValue,
      };
    });

  entries.sort((a, b) => b.metric_value - a.metric_value);
  entries.forEach((entry, i) => {
    entry.rank = i + 1;
  });

  return entries;
}

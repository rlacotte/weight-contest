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

      // All contest types use % loss as the public metric (never exposes real weights)
      const pctLoss = ((startWeight - currentWeight) / startWeight) * 100;

      switch (contestType) {
        case "weight_loss_pct":
          metricValue = pctLoss;
          metricLabel = `${pctLoss >= 0 ? "-" : "+"}${Math.abs(pctLoss).toFixed(1)}%`;
          break;
        case "absolute_weight_loss":
          // Ranked by absolute loss but displayed as % to protect privacy
          metricValue = startWeight - currentWeight;
          metricLabel = `${pctLoss >= 0 ? "-" : "+"}${Math.abs(pctLoss).toFixed(1)}%`;
          break;
        case "body_fat_pct":
          metricValue =
            (m.member.starting_body_fat ?? 0) -
            (m.weighIns[0]?.body_fat_pct ?? m.member.starting_body_fat ?? 0);
          metricLabel = `${metricValue >= 0 ? "-" : "+"}${Math.abs(metricValue).toFixed(1)}% BF`;
          break;
        case "custom":
          metricValue = pctLoss;
          metricLabel = `${pctLoss >= 0 ? "-" : "+"}${Math.abs(pctLoss).toFixed(1)}%`;
          break;
        default:
          metricValue = 0;
          metricLabel = "N/A";
      }

      // Base 100 index: starting weight = 100, current weight = ratio * 100
      const indexValue = startWeight > 0
        ? Math.round((currentWeight / startWeight) * 1000) / 10
        : 100;
      const indexLabel = indexValue.toFixed(1);

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
        index_value: indexValue,
        index_label: indexLabel,
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

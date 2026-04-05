/**
 * Exponentially Weighted Moving Average (EWMA) with configurable half-life.
 * Used to smooth daily weight fluctuations and show true trend.
 */

interface WeighInPoint {
  weight: number;
  weighed_at: string;
}

const HALF_LIFE_DAYS = 7;
const DECAY = Math.LN2 / HALF_LIFE_DAYS;

export function calculateEWMA(weighIns: WeighInPoint[]): number | null {
  if (weighIns.length === 0) return null;
  if (weighIns.length === 1) return weighIns[0].weight;

  const sorted = [...weighIns].sort(
    (a, b) => new Date(a.weighed_at).getTime() - new Date(b.weighed_at).getTime()
  );

  const latestTime = new Date(sorted[sorted.length - 1].weighed_at).getTime();
  let weightedSum = 0;
  let weightSum = 0;

  for (const point of sorted) {
    const daysDiff = (latestTime - new Date(point.weighed_at).getTime()) / (1000 * 60 * 60 * 24);
    const w = Math.exp(-DECAY * daysDiff);
    weightedSum += w * point.weight;
    weightSum += w;
  }

  return Math.round((weightedSum / weightSum) * 100) / 100;
}

/**
 * Calculate trend line using linear regression on smoothed weights.
 * Returns slope (kg/day) and predicted values.
 */
export function calculateLinearTrend(weighIns: WeighInPoint[]): {
  slope: number;
  intercept: number;
  predict: (date: Date) => number;
} | null {
  if (weighIns.length < 2) return null;

  const sorted = [...weighIns].sort(
    (a, b) => new Date(a.weighed_at).getTime() - new Date(b.weighed_at).getTime()
  );

  const startTime = new Date(sorted[0].weighed_at).getTime();
  const points = sorted.map((p) => ({
    x: (new Date(p.weighed_at).getTime() - startTime) / (1000 * 60 * 60 * 24),
    y: p.weight,
  }));

  const n = points.length;
  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0);

  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return null;

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  return {
    slope,
    intercept,
    predict: (date: Date) => {
      const daysSinceStart = (date.getTime() - startTime) / (1000 * 60 * 60 * 24);
      return intercept + slope * daysSinceStart;
    },
  };
}

/**
 * Calculate momentum: slope of linear regression over last N days.
 * Positive = gaining, negative = losing weight.
 */
export function calculateMomentum(
  weighIns: WeighInPoint[],
  days: number = 7
): "up" | "down" | "flat" {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const recent = weighIns.filter((w) => new Date(w.weighed_at) >= cutoff);
  if (recent.length < 2) return "flat";

  const trend = calculateLinearTrend(recent);
  if (!trend) return "flat";

  const weeklyChange = trend.slope * 7;
  if (weeklyChange > 0.1) return "up";
  if (weeklyChange < -0.1) return "down";
  return "flat";
}

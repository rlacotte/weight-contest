import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface CoachingContext {
  userName: string;
  currentWeight: number;
  startingWeight: number;
  goalWeight: number;
  totalLossPct: number;
  streak: number;
  weeklyChange: number;
  weighInCount: number;
  daysActive: number;
  recentTrend: "losing" | "gaining" | "plateau";
  contestRank?: number;
  contestTotal?: number;
}

export async function generateWeeklyInsights(ctx: CoachingContext): Promise<string> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250514",
    max_tokens: 500,
    system: `You are a supportive, evidence-based weight management coach. Your tone is encouraging but honest. Keep responses concise (3-5 bullet points). Focus on:
- What the data shows (reference actual numbers)
- Sustainable, healthy approaches (warn if losing >1%/week)
- Celebrating small wins
- Actionable advice for the upcoming week
Never provide medical advice. Use the person's first name.`,
    messages: [
      {
        role: "user",
        content: `Generate a weekly coaching insight for ${ctx.userName}:
- Current: ${ctx.currentWeight}kg, Started: ${ctx.startingWeight}kg, Goal: ${ctx.goalWeight}kg
- Total lost: ${ctx.totalLossPct.toFixed(1)}%
- This week: ${ctx.weeklyChange > 0 ? "+" : ""}${ctx.weeklyChange.toFixed(1)}kg
- Streak: ${ctx.streak} days, Total weigh-ins: ${ctx.weighInCount}
- Trend: ${ctx.recentTrend}
${ctx.contestRank ? `- Contest rank: #${ctx.contestRank} of ${ctx.contestTotal}` : ""}`,
      },
    ],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  return textBlock?.text ?? "Keep going! Your consistency is building great habits.";
}

export async function detectPlateau(weeklyChanges: number[]): Promise<boolean> {
  if (weeklyChanges.length < 2) return false;
  const recent = weeklyChanges.slice(-2);
  return recent.every((change) => Math.abs(change) < 0.005); // < 0.5% change
}

export async function generateMotivation(ctx: CoachingContext): Promise<string> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250514",
    max_tokens: 200,
    system: `You are a motivational weight management coach. Generate a short, personal encouragement message (2-3 sentences). Be specific to the person's situation, not generic.`,
    messages: [
      {
        role: "user",
        content: `${ctx.userName} has a ${ctx.streak}-day streak, lost ${ctx.totalLossPct.toFixed(1)}% total, and their recent trend is ${ctx.recentTrend}. ${ctx.weeklyChange > 0 ? "They gained weight this week." : "They lost weight this week."} Give them a quick motivational message.`,
      },
    ],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  return textBlock?.text ?? "Every step forward counts. Keep showing up!";
}

import { contests } from "@/generated/prisma/client";

export type ContestStatus = "upcoming" | "active" | "completed" | "cancelled";

/**
 * Normalizes the contest status based on dates.
 * This ensures that even if a contest is marked 'upcoming' in the DB,
 * it correctly reflects 'active' if the current date is past the start_date.
 */
export function getNormalizedStatus(contest: Pick<contests, "status" | "start_date" | "end_date">): ContestStatus {
  const now = new Date();
  const startDate = new Date(contest.start_date);
  const endDate = new Date(contest.end_date);

  // If explicitly cancelled, respect that
  if (contest.status === "cancelled") return "cancelled";
  
  // If explicitly completed, respect that
  if (contest.status === "completed") return "completed";

  // Check based on dates
  if (now < startDate) {
    return "upcoming";
  } else if (now >= startDate && now <= endDate) {
    return "active";
  } else {
    // If we're past the end date but it was still 'upcoming' or 'active', it's now completed
    return "completed";
  }
}

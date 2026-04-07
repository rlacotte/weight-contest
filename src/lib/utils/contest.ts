import { contests } from "@/generated/prisma/client";
import { type PrismaClient } from "@/generated/prisma/client";

export type ContestStatus = "upcoming" | "active" | "completed" | "cancelled";

/**
 * Normalizes the contest status based on dates.
 * This ensures that even if a contest is marked 'upcoming' in the DB,
 * it correctly reflects 'active' if the current date is past the start_date.
 * 
 * Optionally updates the database if a prisma client is provided.
 */
export function getNormalizedStatus(
  contest: Pick<contests, "id" | "status" | "start_date" | "end_date">,
  prisma?: PrismaClient
): ContestStatus {
  const now = new Date();
  const startDate = new Date(contest.start_date);
  const endDate = new Date(contest.end_date);

  let calculatedStatus: ContestStatus;

  // If explicitly cancelled, respect that
  if (contest.status === "cancelled") {
    calculatedStatus = "cancelled";
  } else if (contest.status === "completed") {
    calculatedStatus = "completed";
  } else if (now < startDate) {
    calculatedStatus = "upcoming";
  } else if (now >= startDate && now <= endDate) {
    calculatedStatus = "active";
  } else {
    calculatedStatus = "completed";
  }

  // Update DB if different and prisma is available
  if (prisma && calculatedStatus !== contest.status) {
    // Non-blocking update
    prisma.contests.update({
      where: { id: contest.id },
      data: { status: calculatedStatus }
    }).catch(err => console.error("Failed to sync contest status:", err));
  }

  return calculatedStatus;
}


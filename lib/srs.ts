// Spaced Repetition System (Leitner-style).
// The term status (0-6) doubles as the "box level": the higher the status,
// the longer until the next review. Pure functions — safe on client and server.

/** Days until next review, indexed by status 0..6. */
export const SRS_INTERVALS_DAYS = [0, 1, 2, 4, 7, 15, 30] as const;

/** Returns the next review date for a given status, counted from `from`. */
export function computeNextReview(status: number, from: Date = new Date()): Date {
  const clamped = Math.min(6, Math.max(0, Math.round(status)));
  const days = SRS_INTERVALS_DAYS[clamped];
  const next = new Date(from);
  next.setHours(0, 0, 0, 0);
  next.setDate(next.getDate() + days);
  return next;
}

/** A term is due when it has no schedule yet or its review date has passed. */
export function isDue(nextReviewDate?: string | Date | null): boolean {
  if (!nextReviewDate) return true;
  return new Date(nextReviewDate).getTime() <= Date.now();
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/mongodb";
import StudySession from "@/models/StudySession";
import mongoose from "mongoose";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Counts consecutive days (ending today or yesterday) present in the set. */
function computeStreak(daySet: Set<string>): number {
  const toKey = (d: Date) => d.toISOString().slice(0, 10);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Streak may end today or yesterday and still be "current".
  let cursor = today;
  if (!daySet.has(toKey(today))) {
    const yesterday = new Date(today.getTime() - DAY_MS);
    if (!daySet.has(toKey(yesterday))) return 0;
    cursor = yesterday;
  }

  let streak = 0;
  while (daySet.has(toKey(cursor))) {
    streak++;
    cursor = new Date(cursor.getTime() - DAY_MS);
  }
  return streak;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const userId = new mongoose.Types.ObjectId((session.user as { id: string }).id);

  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - 13); // last 14 days incl. today

  const [totalsAgg, byModeAgg, dailyAgg, dayRows] = await Promise.all([
    StudySession.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          sessions: { $sum: 1 },
          total: { $sum: "$total" },
          correct: { $sum: "$correct" },
          incorrect: { $sum: "$incorrect" },
          skipped: { $sum: "$skipped" },
          durationMs: { $sum: "$durationMs" },
        },
      },
    ]),
    StudySession.aggregate([
      { $match: { userId } },
      { $group: { _id: "$mode", count: { $sum: 1 } } },
    ]),
    StudySession.aggregate([
      { $match: { userId, createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          sessions: { $sum: 1 },
          terms: { $sum: "$total" },
        },
      },
    ]),
    StudySession.aggregate([
      { $match: { userId } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } } } },
    ]),
  ]);

  const totals = totalsAgg[0] ?? {
    sessions: 0, total: 0, correct: 0, incorrect: 0, skipped: 0, durationMs: 0,
  };
  const answered = totals.correct + totals.incorrect;
  const accuracy = answered > 0 ? Math.round((totals.correct / answered) * 100) : 0;

  const byMode = { flashcards: 0, quiz: 0 };
  for (const m of byModeAgg) {
    if (m._id === "flashcards" || m._id === "quiz") byMode[m._id as "flashcards" | "quiz"] = m.count;
  }

  // Build a dense 14-day series (fill missing days with zeros).
  const dailyMap = new Map(dailyAgg.map((d) => [d._id as string, d]));
  const daily: { date: string; sessions: number; terms: number }[] = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(since.getTime() + i * DAY_MS);
    const key = d.toISOString().slice(0, 10);
    const hit = dailyMap.get(key);
    daily.push({ date: key, sessions: hit?.sessions ?? 0, terms: hit?.terms ?? 0 });
  }

  const streak = computeStreak(new Set(dayRows.map((r) => r._id as string)));

  return NextResponse.json({
    sessions: totals.sessions,
    termsStudied: totals.total,
    correct: totals.correct,
    incorrect: totals.incorrect,
    skipped: totals.skipped,
    accuracy,
    durationMs: totals.durationMs,
    streak,
    byMode,
    daily,
  });
}

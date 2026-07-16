import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/mongodb";
import StudyList from "@/models/StudyList";
import Term from "@/models/Term";
import mongoose from "mongoose";

type Params = { id: string };

async function getOwnedList(listId: string, userId: string) {
  if (!mongoose.isValidObjectId(listId)) return null;
  return StudyList.findOne({
    _id: new mongoose.Types.ObjectId(listId),
    userId: new mongoose.Types.ObjectId(userId),
  })
    .select("_id termsCount")
    .lean();
}

const PROJECTION = {
  concept: 1,
  definition: 1,
  conceptImage: 1,
  definitionImage: 1,
  status: 1,
  nextReviewDate: 1,
} as const;

// Lightweight counts used to render the config modal instantly (no term payload).
export async function GET(_req: NextRequest, { params }: { params: Promise<Params> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { id } = await params;
  const userId = (session.user as { id: string }).id;

  const list = await getOwnedList(id, userId);
  if (!list) return NextResponse.json({ error: "Lista não encontrada." }, { status: 404 });

  const eligible = await Term.countDocuments({
    studyListId: list._id,
    userId: new mongoose.Types.ObjectId(userId),
    status: { $lt: 6 },
  });

  return NextResponse.json({ total: list.termsCount ?? 0, eligible });
}

// Selects the terms for a game session server-side: Leitner-prioritised (due first)
// and randomly sampled, returning only the chosen subset with a minimal projection.
export async function POST(req: NextRequest, { params }: { params: Promise<Params> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { id } = await params;
  const userId = (session.user as { id: string }).id;

  const list = await getOwnedList(id, userId);
  if (!list) return NextResponse.json({ error: "Lista não encontrada." }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const includeMaxStatus = !!body.includeMaxStatus;
  const total = list.termsCount ?? 0;
  const rawCount = Number(body.termCount);
  const size = Math.max(1, Math.min(Number.isFinite(rawCount) ? rawCount : total, total || 1));

  const userObjectId = new mongoose.Types.ObjectId(userId);
  const baseMatch: Record<string, unknown> = { studyListId: list._id, userId: userObjectId };
  if (!includeMaxStatus) baseMatch.status = { $lt: 6 };

  const now = new Date();

  // Due terms (or never-scheduled legacy terms) come first, sampled at random.
  const due = await Term.aggregate([
    { $match: { ...baseMatch, $or: [{ nextReviewDate: { $lte: now } }, { nextReviewDate: { $exists: false } }] } },
    { $sample: { size } },
    { $project: PROJECTION },
  ]);

  let selected = due;
  if (selected.length < size) {
    const notDue = await Term.aggregate([
      { $match: { ...baseMatch, nextReviewDate: { $gt: now } } },
      { $sample: { size: size - selected.length } },
      { $project: PROJECTION },
    ]);
    selected = selected.concat(notDue);
  }

  // Shuffle the combined set so due terms aren't always presented first.
  for (let i = selected.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [selected[i], selected[j]] = [selected[j], selected[i]];
  }

  return NextResponse.json({ terms: selected });
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/mongodb";
import StudyList from "@/models/StudyList";
import Term from "@/models/Term";
import { MAX_TERMS, TERMS_PER_PAGE } from "@/lib/constants";
import { SRS_INTERVALS_DAYS } from "@/lib/srs";
import mongoose from "mongoose";

const MS_PER_DAY = 86_400_000;

/**
 * Aggregation-pipeline expression that reschedules `nextReviewDate` from the
 * term's (already updated) status — the bulk equivalent of `computeNextReview`.
 * Keeps SRS "due" state consistent after bulk +1/-1 adjustments.
 */
function rescheduleStage() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  return {
    $set: {
      nextReviewDate: {
        $add: [
          startOfToday,
          {
            $multiply: [
              { $arrayElemAt: [[...SRS_INTERVALS_DAYS], "$status"] },
              MS_PER_DAY,
            ],
          },
        ],
      },
    },
  };
}

async function getOwnedList(listId: string, userId: string) {
  if (!mongoose.isValidObjectId(listId)) return null;
  return StudyList.findOne({
    _id: new mongoose.Types.ObjectId(listId),
    userId: new mongoose.Types.ObjectId(userId),
  })
    .select("_id termsCount statusSum")
    .lean();
}

async function recalcStatusSum(listId: mongoose.Types.ObjectId, userId: mongoose.Types.ObjectId) {
  const agg = await Term.aggregate([
    { $match: { studyListId: listId, userId } },
    { $group: { _id: null, sum: { $sum: "$status" } } },
  ]);
  const statusSum: number = agg[0]?.sum ?? 0;
  await StudyList.findByIdAndUpdate(listId, { statusSum });
  return statusSum;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { id } = await params;
  const userId = (session.user as { id: string }).id;

  const list = await getOwnedList(id, userId);
  if (!list) return NextResponse.json({ error: "Lista não encontrada." }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const sort = searchParams.get("sort") ?? "default";

  let sortQuery: Record<string, 1 | -1> = { createdAt: -1 };
  if (sort === "reverse") sortQuery = { createdAt: 1 };
  else if (sort === "status_desc") sortQuery = { status: -1, createdAt: -1 };
  else if (sort === "status_asc") sortQuery = { status: 1, createdAt: -1 };

  const userObjectId = new mongoose.Types.ObjectId(userId);
  const query = { studyListId: list._id, userId: userObjectId };

  // Trust the denormalized counters (kept in sync via $inc on every mutation).
  // This avoids a full-collection aggregate + a countDocuments on every page load.
  const total = list.termsCount ?? 0;
  const statusSum = list.statusSum ?? 0;
  const pages = Math.max(1, Math.ceil(total / TERMS_PER_PAGE));

  const terms = await Term.find(query)
    .sort(sortQuery)
    .skip((page - 1) * TERMS_PER_PAGE)
    .limit(TERMS_PER_PAGE)
    .select("concept definition conceptImage definitionImage status nextReviewDate")
    .lean();

  return NextResponse.json({ terms, total, page, pages, statusSum });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { id } = await params;
  const userId = (session.user as { id: string }).id;

  const list = await getOwnedList(id, userId);
  if (!list) return NextResponse.json({ error: "Lista não encontrada." }, { status: 404 });

  if (list.termsCount >= MAX_TERMS) {
    return NextResponse.json(
      { error: `Limite de ${MAX_TERMS} termos atingido.` },
      { status: 400 }
    );
  }

  const body = await req.json();
  const { concept, definition, conceptImage, definitionImage } = body;

  if (!concept?.trim() || !definition?.trim()) {
    return NextResponse.json({ error: "Conceito e definição são obrigatórios." }, { status: 400 });
  }

  const term = await Term.create({
    studyListId: list._id,
    userId: new mongoose.Types.ObjectId(userId),
    concept: concept.trim(),
    definition: definition.trim(),
    conceptImage: conceptImage || undefined,
    definitionImage: definitionImage || undefined,
    status: 3,
  });

  // Default status is 3, so increment statusSum by 3
  await StudyList.findByIdAndUpdate(list._id, { $inc: { termsCount: 1, statusSum: 3 } });

  return NextResponse.json(term, { status: 201 });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { id } = await params;
  const userId = (session.user as { id: string }).id;
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const list = await getOwnedList(id, userId);
  if (!list) return NextResponse.json({ error: "Lista não encontrada." }, { status: 404 });

  let action = "decrement";
  try {
    const body = await req.json();
    if (body?.action) action = body.action;
  } catch { /* no body */ }

  if (action === "increment") {
    await Term.updateMany(
      { studyListId: list._id, userId: userObjectId, status: { $lt: 6 } },
      [{ $set: { status: { $add: ["$status", 1] } } }, rescheduleStage()]
    );
    await recalcStatusSum(list._id, userObjectId);
    return NextResponse.json({ success: true });
  }

  if (action === "delete_perfect") {
    const result = await Term.deleteMany(
      { studyListId: list._id, userId: userObjectId, status: 6 }
    );
    const deleted = result.deletedCount ?? 0;
    if (deleted > 0) {
      // Each deleted term had status 6
      await StudyList.findByIdAndUpdate(list._id, {
        $inc: { termsCount: -deleted, statusSum: -(deleted * 6) },
      });
    }
    return NextResponse.json({ success: true, deleted });
  }

  // default: decrement
  await Term.updateMany(
    { studyListId: list._id, userId: userObjectId, status: { $gt: 0 } },
    [{ $set: { status: { $subtract: ["$status", 1] } } }, rescheduleStage()]
  );
  await recalcStatusSum(list._id, userObjectId);

  return NextResponse.json({ success: true });
}

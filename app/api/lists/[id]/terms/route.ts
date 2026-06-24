import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/mongodb";
import StudyList from "@/models/StudyList";
import Term from "@/models/Term";
import { MAX_TERMS, TERMS_PER_PAGE } from "@/lib/constants";
import mongoose from "mongoose";

async function getOwnedList(listId: string, userId: string) {
  if (!mongoose.isValidObjectId(listId)) return null;
  return StudyList.findOne({
    _id: new mongoose.Types.ObjectId(listId),
    userId: new mongoose.Types.ObjectId(userId),
  });
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
  const all = searchParams.get("all") === "true";

  let sortQuery: Record<string, 1 | -1> = { createdAt: -1 };
  if (sort === "reverse") sortQuery = { createdAt: 1 };
  else if (sort === "status_desc") sortQuery = { status: -1, createdAt: -1 };
  else if (sort === "status_asc") sortQuery = { status: 1, createdAt: -1 };

  const query = { studyListId: list._id, userId: new mongoose.Types.ObjectId(userId) };

  if (all) {
    const terms = await Term.find(query).sort(sortQuery).lean();
    return NextResponse.json({ terms, total: terms.length, page: 1, pages: 1 });
  }

  const [statusAgg, total] = await Promise.all([
    Term.aggregate([
      { $match: { studyListId: list._id, userId: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: null, sum: { $sum: "$status" } } },
    ]),
    Term.countDocuments(query),
  ]);
  const statusSum: number = statusAgg[0]?.sum ?? 0;

  const pages = Math.ceil(total / TERMS_PER_PAGE);
  const terms = await Term.find(query)
    .sort(sortQuery)
    .skip((page - 1) * TERMS_PER_PAGE)
    .limit(TERMS_PER_PAGE)
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

  await StudyList.findByIdAndUpdate(list._id, { $inc: { termsCount: 1 } });

  return NextResponse.json(term, { status: 201 });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { id } = await params;
  const userId = (session.user as { id: string }).id;

  const list = await getOwnedList(id, userId);
  if (!list) return NextResponse.json({ error: "Lista não encontrada." }, { status: 404 });

  await Term.updateMany(
    { studyListId: list._id, userId: new mongoose.Types.ObjectId(userId), status: { $gt: 0 } },
    { $inc: { status: -1 } }
  );

  return NextResponse.json({ success: true });
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/mongodb";
import StudyList from "@/models/StudyList";
import Term from "@/models/Term";
import { MAX_LISTS } from "@/lib/constants";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const userId = (session.user as { id: string }).id;

  const { searchParams } = new URL(req.url);
  const sort = searchParams.get("sort") ?? "newest";
  const genres = searchParams.getAll("genre");

  const query: Record<string, unknown> = { userId: new mongoose.Types.ObjectId(userId) };
  if (genres.length > 0) query.genre = { $in: genres };

  const sortOrder = sort === "oldest" ? 1 : -1;

  const lists = await StudyList.find(query).sort({ createdAt: sortOrder }).lean();

  // One-time migration: populate statusSum for lists that don't have it yet
  const needsMigration = lists.filter((l) => l.statusSum == null);
  if (needsMigration.length > 0) {
    const agg = await Term.aggregate([
      {
        $match: {
          studyListId: { $in: needsMigration.map((l) => l._id) },
          userId: new mongoose.Types.ObjectId(userId),
        },
      },
      { $group: { _id: "$studyListId", sum: { $sum: "$status" } } },
    ]);
    const sumMap = new Map(agg.map((a) => [String(a._id), a.sum as number]));
    await Promise.all(
      needsMigration.map((l) =>
        StudyList.findByIdAndUpdate(l._id, { statusSum: sumMap.get(String(l._id)) ?? 0 })
      )
    );
    for (const l of lists) {
      if (l.statusSum == null) l.statusSum = sumMap.get(String(l._id)) ?? 0;
    }
  }

  return NextResponse.json(lists);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const userId = (session.user as { id: string }).id;

  const count = await StudyList.countDocuments({ userId: new mongoose.Types.ObjectId(userId) });
  if (count >= MAX_LISTS) {
    return NextResponse.json(
      { error: `Limite de ${MAX_LISTS} listas atingido.` },
      { status: 400 }
    );
  }

  const body = await req.json();
  const { name, description, genre } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Nome é obrigatório." }, { status: 400 });
  }

  const list = await StudyList.create({
    userId: new mongoose.Types.ObjectId(userId),
    name: name.trim(),
    description: description?.trim(),
    genre: genre || undefined,
    termsCount: 0,
  });

  return NextResponse.json(list, { status: 201 });
}

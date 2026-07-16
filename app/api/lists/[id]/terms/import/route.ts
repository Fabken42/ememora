import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/mongodb";
import StudyList from "@/models/StudyList";
import Term from "@/models/Term";
import { MAX_TERMS } from "@/lib/constants";
import mongoose from "mongoose";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { id } = await params;
  const userId = (session.user as { id: string }).id;

  if (!mongoose.isValidObjectId(id))
    return NextResponse.json({ error: "Lista não encontrada." }, { status: 404 });

  const list = await StudyList.findOne({
    _id: new mongoose.Types.ObjectId(id),
    userId: new mongoose.Types.ObjectId(userId),
  });
  if (!list) return NextResponse.json({ error: "Lista não encontrada." }, { status: 404 });

  const body = await req.json();
  const terms: { concept: string; definition: string }[] = body.terms ?? [];

  if (!Array.isArray(terms) || terms.length === 0)
    return NextResponse.json({ error: "Nenhum termo válido." }, { status: 400 });

  const remaining = MAX_TERMS - list.termsCount;
  if (remaining <= 0)
    return NextResponse.json({ error: `Limite de ${MAX_TERMS} termos atingido.` }, { status: 400 });

  const now = new Date();
  const toInsert = terms.slice(0, remaining).map((t) => ({
    studyListId: list._id,
    userId: new mongoose.Types.ObjectId(userId),
    concept: t.concept.trim(),
    definition: t.definition.trim(),
    status: 3,
    nextReviewDate: now,
  }));

  await Term.insertMany(toInsert);
  // Default status is 3, so statusSum increases by 3 per imported term
  await StudyList.findByIdAndUpdate(list._id, {
    $inc: { termsCount: toInsert.length, statusSum: toInsert.length * 3 },
  });

  return NextResponse.json({ inserted: toInsert.length, skipped: terms.length - toInsert.length });
}

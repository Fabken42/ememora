import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/mongodb";
import Term from "@/models/Term";
import StudyList from "@/models/StudyList";
import mongoose from "mongoose";

type Params = { id: string; termId: string };

async function getOwnedTerm(termId: string, listId: string, userId: string) {
  if (!mongoose.isValidObjectId(termId) || !mongoose.isValidObjectId(listId)) return null;
  return Term.findOne({
    _id: new mongoose.Types.ObjectId(termId),
    studyListId: new mongoose.Types.ObjectId(listId),
    userId: new mongoose.Types.ObjectId(userId),
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<Params> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { id, termId } = await params;
  const userId = (session.user as { id: string }).id;

  const term = await getOwnedTerm(termId, id, userId);
  if (!term) return NextResponse.json({ error: "Termo não encontrado." }, { status: 404 });

  const body = await req.json();
  const { concept, definition, conceptImage, definitionImage, status } = body;

  if (concept !== undefined) term.concept = concept.trim();
  if (definition !== undefined) term.definition = definition.trim();
  if (conceptImage !== undefined) term.conceptImage = conceptImage || undefined;
  if (definitionImage !== undefined) term.definitionImage = definitionImage || undefined;
  if (status !== undefined) term.status = Math.min(6, Math.max(0, Number(status)));

  await term.save();
  return NextResponse.json(term);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<Params> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { id, termId } = await params;
  const userId = (session.user as { id: string }).id;

  const term = await getOwnedTerm(termId, id, userId);
  if (!term) return NextResponse.json({ error: "Termo não encontrado." }, { status: 404 });

  await term.deleteOne();
  await StudyList.findByIdAndUpdate(term.studyListId, { $inc: { termsCount: -1 } });

  return NextResponse.json({ success: true });
}

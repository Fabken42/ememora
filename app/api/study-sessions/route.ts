import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/mongodb";
import StudySession from "@/models/StudySession";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const userId = (session.user as { id: string }).id;

  const body = await req.json();
  const { studyListId, mode, total, correct, incorrect, skipped, durationMs } = body;

  if (mode !== "flashcards" && mode !== "quiz") {
    return NextResponse.json({ error: "Modo inválido." }, { status: 400 });
  }
  const t = Number(total);
  if (!Number.isFinite(t) || t <= 0) {
    return NextResponse.json({ error: "Sessão vazia." }, { status: 400 });
  }

  const clamp = (n: unknown) => Math.max(0, Math.round(Number(n) || 0));

  await StudySession.create({
    userId: new mongoose.Types.ObjectId(userId),
    studyListId:
      studyListId && mongoose.isValidObjectId(studyListId)
        ? new mongoose.Types.ObjectId(studyListId)
        : undefined,
    mode,
    total: clamp(total),
    correct: clamp(correct),
    incorrect: clamp(incorrect),
    skipped: clamp(skipped),
    durationMs: clamp(durationMs),
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}

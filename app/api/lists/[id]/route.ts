import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/mongodb";
import StudyList from "@/models/StudyList";
import Term from "@/models/Term";
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

  return NextResponse.json(list);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { id } = await params;
  const userId = (session.user as { id: string }).id;

  const list = await getOwnedList(id, userId);
  if (!list) return NextResponse.json({ error: "Lista não encontrada." }, { status: 404 });

  const body = await req.json();
  const { name, description, genre } = body;

  if (name !== undefined) list.name = name.trim();
  if (description !== undefined) list.description = description?.trim();
  if (genre !== undefined) list.genre = genre || undefined;

  await list.save();
  return NextResponse.json(list);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { id } = await params;
  const userId = (session.user as { id: string }).id;

  const list = await getOwnedList(id, userId);
  if (!list) return NextResponse.json({ error: "Lista não encontrada." }, { status: 404 });

  await Term.deleteMany({ studyListId: list._id });
  await list.deleteOne();

  return NextResponse.json({ success: true });
}

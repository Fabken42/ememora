import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect, notFound } from "next/navigation";
import ListClient from "./ListClient";
import { connectDB } from "@/lib/mongodb";
import StudyList from "@/models/StudyList";
import mongoose from "mongoose";

export default async function ListPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { id } = await params;
  const userId = (session.user as { id: string }).id;

  await connectDB();

  if (!mongoose.isValidObjectId(id)) notFound();

  const list = await StudyList.findOne({
    _id: new mongoose.Types.ObjectId(id),
    userId: new mongoose.Types.ObjectId(userId),
  }).lean();

  if (!list) notFound();

  return <ListClient list={JSON.parse(JSON.stringify(list))} />;
}

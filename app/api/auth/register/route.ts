import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import clientPromise from "@/lib/mongodbClient";

export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json();

  if (!name?.trim() || !email?.trim() || !password) {
    return NextResponse.json({ error: "Preencha todos os campos." }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "A senha deve ter pelo menos 6 caracteres." }, { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db();

  const existing = await db.collection("users").findOne({ email: email.trim().toLowerCase() });
  if (existing) {
    return NextResponse.json({ error: "Este email já está em uso." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await db.collection("users").insertOne({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    passwordHash,
    emailVerified: null,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}

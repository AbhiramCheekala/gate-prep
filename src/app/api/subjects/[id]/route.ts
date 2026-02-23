import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { subjects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/session";
import { cookies } from "next/headers";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const data = await db.select().from(subjects).where(eq(subjects.id, params.id)).limit(1);
  return NextResponse.json({ success: true, data: data[0] });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  if (session.role !== "admin" && session.role !== "teacher") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  const { name } = await req.json();
  await db.update(subjects).set({ name }).where(eq(subjects.id, params.id));
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  if (session.role !== "admin" && session.role !== "teacher") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  await db.delete(subjects).where(eq(subjects.id, params.id));
  return NextResponse.json({ success: true });
}
